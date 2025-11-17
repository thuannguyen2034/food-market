package com.foodmarket.food_market.order.service;

import com.foodmarket.food_market.cart.model.Cart;
import com.foodmarket.food_market.cart.model.CartItem;
import com.foodmarket.food_market.cart.repository.CartRepository;
import com.foodmarket.food_market.inventory.dto.AllocatedBatchDTO;
import com.foodmarket.food_market.inventory.service.InventoryService;
import com.foodmarket.food_market.order.dto.CheckoutRequestDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.OrderItem;
import com.foodmarket.food_market.payment.dto.PaymentCreationRequestDTO;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.repository.OrderItemRepository;
import com.foodmarket.food_market.order.repository.OrderRepository;
import com.foodmarket.food_market.payment.service.PaymentService;
import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.service.ProductService;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.model.entity.UserAddress;
import com.foodmarket.food_market.user.repository.UserAddressRepository;
import com.foodmarket.food_market.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <-- Rất quan trọng

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final UserAddressRepository userAddressRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final ProductService productService; // Tái sử dụng để tính giá

    @Override
    @Transactional // <-- Đảm bảo tất cả hoặc không gì cả
    public OrderResponseDTO placeOrder(UUID userId, CheckoutRequestDTO request) {

        // 1. Lấy User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại."));

        // 2. Lấy Giỏ hàng
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng."));

        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng rỗng, không thể đặt hàng.");
        }

        // 3. Lấy và "Chụp nhanh" (Snapshot) Địa chỉ
        UserAddress address = userAddressRepository.findByIdAndUser_UserId(request.getAddressId(), userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa chỉ hoặc địa chỉ không thuộc về bạn."));
        String addressSnapshot = address.getProvince(); // (Giả sử có hàm này)

        // 4. Lấy Map giá
        Map<Long, ProductResponseDTO> priceMap = getPriceMap(cart.getItems());

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> newOrderItems = new ArrayList<>();

        // 5. --- LOGIC CỐT LÕI (ĐÃ REFACTOR) ---
        // Lỗi InsufficientStockException sẽ được ném bởi InventoryService
        // và được GlobalExceptionHandler bắt, tự động rollback transaction.
        for (CartItem cartItem : cart.getItems()) {
            int quantityNeeded = cartItem.getQuantity();
            Long productId = cartItem.getProduct().getId(); // Giữ lại product id
            ProductResponseDTO pricedProduct = priceMap.get(productId);
            BigDecimal priceAtPurchase = pricedProduct.getFinalPrice();

            // === PHẦN THAY THẾ SẠCH SẼ ===
            // Gõ cửa InventoryService và yêu cầu phân bổ kho
            List<AllocatedBatchDTO> allocations = inventoryService.allocateForOrder(
                    productId,
                    quantityNeeded
            );
            // === KẾT THÚC THAY THẾ ===

            // Duyệt qua kết quả trả về từ InventoryService
            for (AllocatedBatchDTO alloc : allocations) {
                // Tạo OrderItem mới
                OrderItem newOrderItem = new OrderItem();
                newOrderItem.setProduct(cartItem.getProduct()); // Bạn vẫn cần tham chiếu đến Product
                newOrderItem.setInventoryBatch(alloc.batch()); // Link đến lô hàng
                newOrderItem.setQuantity(alloc.quantityAllocated()); // Số lượng lấy từ lô này
                newOrderItem.setPriceAtPurchase(priceAtPurchase);
                newOrderItems.add(newOrderItem);

                // Cộng dồn tổng tiền
                totalAmount = totalAmount.add(
                        priceAtPurchase.multiply(BigDecimal.valueOf(alloc.quantityAllocated()))
                );
            }
            // Không cần check "quantityNeeded > 0"
            // vì nếu không đủ, inventoryService.allocateForOrder
            // đã ném InsufficientStockException
        }

        // 6. Tạo Order
        Order newOrder = new Order();
        newOrder.setUser(user);
        newOrder.setTotalAmount(totalAmount);
        newOrder.setStatus(OrderStatus.PENDING);
        newOrder.setDeliveryAddressSnapshot(addressSnapshot);
        newOrder.setDeliveryTimeslot(request.getDeliveryTimeslot());
        Order savedOrder = orderRepository.save(newOrder);

        // 7. Gán OrderItems vào Order
        for (OrderItem item : newOrderItems) {
            item.setOrder(savedOrder);
        }
        orderItemRepository.saveAll(newOrderItems);
        savedOrder.setItems(new HashSet<>(newOrderItems));

        // 8. Tạo Payment (Ghi nợ)
        PaymentCreationRequestDTO paymentRequest = new PaymentCreationRequestDTO(
                savedOrder,
                request.getPaymentMethod(),
                totalAmount
        );
        paymentService.createPendingPayment(paymentRequest);

        // 9. Xóa Giỏ hàng
        cart.getItems().clear();
        cartRepository.save(cart);

        // 10. Trả về DTO
        return OrderResponseDTO.fromEntity(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrderHistory(UUID userId) {
        return orderRepository.findByUser_UserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderDetails(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng."));

        // Bảo mật: Check đơn hàng có phải của user không
        if (!order.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền xem đơn hàng này."); // 400 Bad Request
        }
        return OrderResponseDTO.fromEntity(order);
    }

    // Hàm private lấy Map giá (tách ra từ CartServiceImpl)
    private Map<Long, ProductResponseDTO> getPriceMap(Set<CartItem> items) {
        Set<Long> productIds = items.stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toSet());

        return productIds.stream()
                .map(productService::getProductDetails) // Gọi hàm đã có
                .collect(Collectors.toMap(ProductResponseDTO::getId, Function.identity()));
    }
}