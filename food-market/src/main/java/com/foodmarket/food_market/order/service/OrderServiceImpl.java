package com.foodmarket.food_market.order.service;

import com.foodmarket.food_market.admin.dashboard.dto.projection.DailyRevenueStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.HourlyRevenueStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.OrderStatusStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.TopProductStat;
import com.foodmarket.food_market.admin.dashboard.dto.response.ChartDataDTO;
import com.foodmarket.food_market.admin.dashboard.dto.response.DashboardSummaryDTO;
import com.foodmarket.food_market.cart.model.Cart;
import com.foodmarket.food_market.cart.model.CartItem;
import com.foodmarket.food_market.cart.repository.CartRepository;
import com.foodmarket.food_market.inventory.dto.AllocatedBatchDTO;
import com.foodmarket.food_market.inventory.service.InventoryService;
import com.foodmarket.food_market.order.dto.CheckoutRequestDTO;
import com.foodmarket.food_market.order.dto.OrderFilterDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;
import com.foodmarket.food_market.order.event.OrderStatusChangedEvent;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.OrderItem;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import com.foodmarket.food_market.order.repository.OrderSpecification;
import com.foodmarket.food_market.payment.dto.PaymentCreationRequestDTO;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.repository.OrderItemRepository;
import com.foodmarket.food_market.order.repository.OrderRepository;
import com.foodmarket.food_market.payment.model.Payment;
import com.foodmarket.food_market.payment.service.PaymentService;
import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.model.Product;
import com.foodmarket.food_market.product.service.ProductService;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.model.entity.UserAddress;
import com.foodmarket.food_market.user.repository.UserAddressRepository;
import com.foodmarket.food_market.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <-- Rất quan trọng

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

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
    private final ApplicationEventPublisher eventPublisher; // "Cái loa"

    @Override
    @Transactional
    public OrderResponseDTO placeOrder(UUID userId, CheckoutRequestDTO request) {

        // 1. Lấy User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại."));

        // 2. Lấy Giỏ hàng (Đã FETCH JOIN luôn Product)
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng."));

        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng rỗng, không thể đặt hàng.");
        }

        // 3. Snapshot địa chỉ
        UserAddress address = userAddressRepository.findByIdAndUser_UserId(request.getAddressId(), userId)
                .orElseThrow(() -> new EntityNotFoundException("Địa chỉ không hợp lệ."));
        String addressSnapshot = address.getProvince(); // Ví dụ
        String phoneRecipientSnapshot = address.getRecipientPhone();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> newOrderItems = new ArrayList<>();

        // 4. LOGIC CỐT LÕI (TỐI ƯU HÓA)
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            // === BƯỚC BẢO VỆ (FINAL CHECK) ===
            // Trước khi tin tưởng giá trong Cart, hãy so sánh nhẹ một lần cuối.
            // Nếu user treo màn hình quá lâu, giá product có thể đã đổi.
            BigDecimal currentProductPrice = product.getFinalPrice();
            BigDecimal priceInCart = cartItem.getPrice();

            if (priceInCart.compareTo(currentProductPrice) != 0) {
                // NÉM LỖI ĐỂ UI BẮT
                // UI sẽ hiện: "Giá sản phẩm đã thay đổi, vui lòng tải lại trang để cập nhật giá mới."
                throw new IllegalArgumentException("Giá của sản phẩm '" + product.getName() + "' đã thay đổi. Vui lòng tải lại giỏ hàng.");
            }

            // === LOGIC CHÍNH: LẤY GIÁ TỪ CART ===
            // Lúc này ta hoàn toàn tin tưởng priceInCart vì đã qua bước check trên
            int quantityNeeded = cartItem.getQuantity();

            // Gọi Inventory để trừ kho (Logic cũ)
            List<AllocatedBatchDTO> allocations = inventoryService.allocateForOrder(
                    product.getId(),
                    quantityNeeded
            );

            for (AllocatedBatchDTO alloc : allocations) {
                OrderItem newOrderItem = new OrderItem();
                newOrderItem.setProduct(product);
                newOrderItem.setInventoryBatch(alloc.batch());
                newOrderItem.setQuantity(alloc.quantityAllocated());
                newOrderItem.setProductIdSnapshot(product.getId());
                newOrderItem.setProductNameSnapshot(product.getName());
                newOrderItem.setProductThumbnailSnapshot(product.getImages().getFirst().getImageUrl());
                // QUAN TRỌNG: Lấy giá từ CartItem (đúng ý bạn)
                newOrderItem.setPriceAtPurchase(priceInCart);

                newOrderItems.add(newOrderItem);

                // Tính tổng tiền dựa trên giá Cart
                totalAmount = totalAmount.add(
                        priceInCart.multiply(BigDecimal.valueOf(alloc.quantityAllocated()))
                );
            }
        }

        // 5. Tạo Order (Phần còn lại giữ nguyên)
        Order newOrder = new Order();
        newOrder.setUser(user);
        newOrder.setTotalAmount(totalAmount);
        newOrder.setStatus(OrderStatus.PENDING);
        newOrder.setDeliveryAddressSnapshot(addressSnapshot);
        newOrder.setDeliveryPhoneSnapshot(phoneRecipientSnapshot);
        newOrder.setDeliveryTimeslot(request.getDeliveryTimeslot());
        newOrder.setNote(request.getNote());

        Order savedOrder = orderRepository.save(newOrder);

        // 6. Gán OrderItems vào Order
        for (OrderItem item : newOrderItems) {
            item.setOrder(savedOrder);
        }
        orderItemRepository.saveAll(newOrderItems);
        savedOrder.setItems(new HashSet<>(newOrderItems));

        // 7. Tạo Payment
        PaymentCreationRequestDTO paymentRequest = new PaymentCreationRequestDTO(
                savedOrder,
                request.getPaymentMethod(),
                totalAmount
        );
        paymentService.createPendingPayment(paymentRequest);

        // 8. Xóa Giỏ hàng
        cart.getItems().clear();
        cartRepository.save(cart); // OrphanRemoval sẽ tự xóa các CartItem trong DB

        return OrderResponseDTO.fromEntity(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> getOrderHistory(UUID userId, OrderStatus status, Pageable pageable) {
        Page<Order> orderPage;
        if (status != null) {
            orderPage = orderRepository.findByUser_UserIdAndStatus(userId, status, pageable);
        } else {
            orderPage = orderRepository.findByUser_UserIdOrderByCreatedAtDesc(userId, pageable);
        }
        return orderPage.map(OrderResponseDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderDetails(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng."));

        // Bảo mật: Check đơn hàng có phải của user không
        if (!order.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Không tìm thấy đơn hàng");
        }
        return OrderResponseDTO.fromEntity(order);
    }

    //ADMIN METHODS
    @Override
    @Transactional
    public void updateOrderStatus(UUID orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Order"));

        order.setStatus(newStatus);
        orderRepository.save(order);

        // BẮN SỰ KIỆN (LA LÊN)
        // Dùng @TransactionalEventListener ở bên kia sẽ bắt được
        eventPublisher.publishEvent(new OrderStatusChangedEvent(order, newStatus));
    }


    @Override
    @Transactional
    public void cancelOrder(UUID userId, UUID orderId, String reason) {
        // 1. Tìm đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Đơn hàng không tồn tại"));

        // 2. Check quyền chủ sở hữu
        if (!order.getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền hủy đơn hàng này");
        }

        // 3. VALIDATE 1: Check trạng thái đơn hàng
        // Chỉ cho phép hủy nếu chưa đóng gói xong
        List<OrderStatus> allowCancelStatuses = List.of(OrderStatus.PENDING, OrderStatus.CONFIRMED);
        if (!allowCancelStatuses.contains(order.getStatus())) {
            throw new IllegalStateException("Không thể hủy đơn hàng đang ở trạng thái: " + order.getStatus());
        }

        // 4. VALIDATE 2: Check trạng thái thanh toán
        // Nếu đã thanh toán Online rồi thì chặn, yêu cầu gọi Admin
        // (Vì đồ án chưa làm luồng Refund tự động)
        Payment successPayment = order.getSuccessfulPayment();
        if (successPayment != null) {
            throw new IllegalStateException("Đơn hàng đã thanh toán Online. Vui lòng liên hệ CSKH để hủy và hoàn tiền.");
        }

        // 5. --- QUAN TRỌNG: HOÀN KHO (RESTORE STOCK) ---
        // Phải trả lại số lượng cho đúng cái lô hàng (Batch) đã trừ
        for (OrderItem item : order.getItems()) {
            inventoryService.restoreStock(
                    item.getInventoryBatch().getBatchId(), // Lấy ID lô hàng từ OrderItem
                    item.getQuantity()
            );
        }

        // 6. Cập nhật trạng thái Order
        order.setStatus(OrderStatus.CANCELLED);

        // Lưu lý do hủy vào ghi chú
        String oldNote = order.getNote() == null ? "" : order.getNote();
        order.setNote(oldNote + " [Đã hủy bởi khách: " + reason + "]");

        // 7. Cập nhật trạng thái Payment (nếu đang Pending)
        // Nếu có payment đang treo, set nó thành FAILED/CANCELLED luôn
        Payment currentPayment = order.getPayment();

        if (currentPayment != null && currentPayment.getStatus() == PaymentStatus.PENDING) {
            // Nếu đang chờ thanh toán mà khách hủy đơn -> Hủy luôn giao dịch thanh toán
            currentPayment.setStatus(PaymentStatus.CANCEL);
        }

        orderRepository.save(order);

        // 8. (Option) Bắn event thông báo cho Admin biết
        // eventPublisher.publishEvent(new OrderCancelledEvent(order));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponseDTO> getAllOrders(OrderFilterDTO filterDTO, Pageable pageable) {
        // Gọi hàm lớn, logic bên trong đã được ẩn đi
        Specification<Order> spec = OrderSpecification.filterBy(filterDTO);
        return orderRepository.findAll(spec, pageable)
                .map(OrderResponseDTO::fromEntity);
    }

    @Override
    public BigDecimal totalRevenueInAPeriod(OffsetDateTime startDate, OffsetDateTime endDate) {
        return orderRepository.sumRevenueBetween(startDate, endDate, OrderStatus.ACTIVE_STATUSES);
    }

    @Override
    public long countOrderInAPeriod(OffsetDateTime startDate, OffsetDateTime endDate) {
        return orderRepository.countOrdersBetween(startDate, endDate);
    }

    @Override
    public DashboardSummaryDTO getDashboardSummary(OffsetDateTime start, OffsetDateTime end) {
        // 1. Tính toán khoảng thời gian (duration)
        // VD: start=22/11, end=22/11 -> days = 0 -> duration = 1 ngày
        long daysDiff = ChronoUnit.DAYS.between(start, end);
        long duration = daysDiff + 1; // Cộng 1 để bao gồm cả ngày bắt đầu

        // 2. Tính kỳ trước (Previous Period)
        OffsetDateTime prevStart = start.minusDays(duration);
        OffsetDateTime prevEnd = end.minusDays(duration);

        // 3. Query DB (Giả sử Repo đã có hàm sumRevenue và countOrders nhận OffsetDateTime)
        BigDecimal currentRev = orderRepository.sumRevenueBetween(start, end, OrderStatus.ACTIVE_STATUSES);
        BigDecimal prevRev = orderRepository.sumRevenueBetween(prevStart, prevEnd, OrderStatus.ACTIVE_STATUSES);

        long currentOrd = orderRepository.countOrdersBetween(start, end);
        long prevOrd = orderRepository.countOrdersBetween(prevStart, prevEnd);

        // Xử lý null nếu DB trả về null
        if (currentRev == null) currentRev = BigDecimal.ZERO;
        if (prevRev == null) prevRev = BigDecimal.ZERO;

        return DashboardSummaryDTO.builder()
                .currentRevenue(currentRev)
                .previousRevenue(prevRev)
                .revenueGrowth(calculateGrowth(currentRev, prevRev))
                .currentOrders(currentOrd)
                .previousOrders(prevOrd)
                .ordersGrowth(calculateGrowth(BigDecimal.valueOf(currentOrd), BigDecimal.valueOf(prevOrd)))
                .build();
    }

    @Override
    public List<ChartDataDTO> getComparisonChart(OffsetDateTime start, OffsetDateTime end) {
        long daysDiff = ChronoUnit.DAYS.between(start, end);

        // LOGIC QUYẾT ĐỊNH CHIẾN LƯỢC
        if (daysDiff == 0) {
            // ==> CHẾ ĐỘ 1 NGÀY: Xử lý theo GIỜ (0h - 23h)
            return getHourlyChartData(start, end);
        } else {
            // ==> CHẾ ĐỘ NHIỀU NGÀY: Xử lý theo NGÀY (Logic cũ của bạn)
            return getDailyChartData(start, end, daysDiff);
        }
    }

    public List<ChartDataDTO> getDailyChartData(OffsetDateTime start, OffsetDateTime end, long daysDiff) {
        long duration = daysDiff + 1;

        OffsetDateTime prevStart = start.minusDays(duration);

        // Lấy Raw Data từ DB (List các ngày có doanh thu)
        List<DailyRevenueStat> currentStats = orderRepository.getDailyRevenueStats(start, end, OrderStatus.ACTIVE_STATUSES_Strings);
        List<DailyRevenueStat> prevStats = orderRepository.getDailyRevenueStats(prevStart, start.minusNanos(1), OrderStatus.ACTIVE_STATUSES_Strings);
        // start.minusNanos(1) để tránh trùng lặp biên

        List<ChartDataDTO> result = new ArrayList<>();

        // Vòng lặp để fill đủ số ngày (tránh trường hợp ngày không có doanh thu bị thiếu)
        for (int i = 0; i < duration; i++) {
            OffsetDateTime currDateTarget = start.plusDays(i);
            OffsetDateTime prevDateTarget = prevStart.plusDays(i);

            BigDecimal currVal = findValueByDate(currentStats, currDateTarget);
            BigDecimal prevVal = findValueByDate(prevStats, prevDateTarget);

            result.add(ChartDataDTO.builder()
                    .label(currDateTarget.format(DateTimeFormatter.ofPattern("dd/MM"))) // Label theo kỳ hiện tại
                    .currentRevenue(currVal)
                    .previousRevenue(prevVal)
                    .build());
        }
        return result;
    }

    private List<ChartDataDTO> getHourlyChartData(OffsetDateTime start, OffsetDateTime end) {
        // Tính kỳ trước (Lùi lại 1 ngày)
        OffsetDateTime prevStart = start.minusDays(1);
        OffsetDateTime prevEnd = end.minusDays(1);

        // Query DB lấy dữ liệu gom nhóm theo giờ
        List<HourlyRevenueStat> currentStats = orderRepository.getHourlyRevenueStats(start, end, OrderStatus.ACTIVE_STATUSES_Strings);
        List<HourlyRevenueStat> prevStats = orderRepository.getHourlyRevenueStats(prevStart, prevEnd, OrderStatus.ACTIVE_STATUSES_Strings);

        List<ChartDataDTO> result = new ArrayList<>();

        // Loop cứng từ 0 đến 23 giờ
        for (int hour = 0; hour < 24; hour++) {
            int currentHour = hour;

            // Tìm doanh thu trong list (hoặc = 0)
            BigDecimal currVal = currentStats.stream()
                    .filter(s -> s.getHour() == currentHour)
                    .findFirst()
                    .map(HourlyRevenueStat::getTotalRevenue)
                    .orElse(BigDecimal.ZERO);

            BigDecimal prevVal = prevStats.stream()
                    .filter(s -> s.getHour() == currentHour)
                    .findFirst()
                    .map(HourlyRevenueStat::getTotalRevenue)
                    .orElse(BigDecimal.ZERO);

            // Tạo Label theo giờ (Ví dụ: "08:00")
            String label = String.format("%02d:00", currentHour);

            result.add(ChartDataDTO.builder()
                    .label(label)
                    .currentRevenue(currVal)
                    .previousRevenue(prevVal)
                    .build());
        }
        return result;
    }

    @Override
    public List<DailyRevenueStat> getDailyRevenueStats(OffsetDateTime startDate) {
//        return orderRepository.getDailyRevenueStats(startDate,statusList);
        return null;
    }

    @Override
    public List<OrderStatusStat> countOrdersByStatus() {
        return orderRepository.countOrdersByStatus();
    }

    @Override
    public List<Order> findUrgentOrders(Pageable pageable) {
        return orderRepository.findUrgentOrders(OrderStatus.URGENT_STATUSES, pageable);
    }

    @Override
    public List<TopProductStat> findTopSellingProducts(OffsetDateTime startDate, OffsetDateTime endDate, Pageable pageable) {
        return orderRepository.findTopSellingProducts(startDate, endDate, OrderStatus.ACTIVE_STATUSES, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDTO getAdminOrderDetails(UUID orderId) {
        Optional<Order> order = orderRepository.findById(orderId);
        if (order.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy order");
        }
        return OrderResponseDTO.fromEntity(order.get());
    }

    /**
     * Helper
     */

// Helper tính % tăng trưởng
    private Double calculateGrowth(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        // (Current - Prev) / Prev * 100
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    // Helper tìm giá trị trong list DB trả về (convert OffsetDateTime sang LocalDate để so sánh cho dễ)
    private BigDecimal findValueByDate(List<DailyRevenueStat> stats, OffsetDateTime targetDate) {
        return stats.stream()
                .filter(s -> s.getDate().isEqual(targetDate.toLocalDate())) // Giả sử projection trả về LocalDate
                .findFirst()
                .map(DailyRevenueStat::getTotalRevenue)
                .orElse(BigDecimal.ZERO);
    }
}

