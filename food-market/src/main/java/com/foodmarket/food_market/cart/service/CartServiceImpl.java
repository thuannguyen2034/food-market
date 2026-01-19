package com.foodmarket.food_market.cart.service;

import com.foodmarket.food_market.cart.dto.CartItemRequestDTO;
import com.foodmarket.food_market.cart.dto.CartItemUpdateDTO;
import com.foodmarket.food_market.cart.dto.CartResponseDTO;
import com.foodmarket.food_market.cart.model.Cart;
import com.foodmarket.food_market.cart.model.CartItem;
import com.foodmarket.food_market.cart.repository.CartItemRepository;
import com.foodmarket.food_market.cart.repository.CartRepository;
import com.foodmarket.food_market.inventory.repository.InventoryBatchRepository;
import com.foodmarket.food_market.product.model.Product;
import com.foodmarket.food_market.product.repository.ProductRepository;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryBatchRepository inventoryBatchRepository;

    @Override
    @Transactional
    public CartResponseDTO getCart(UUID userId) {
        Cart cart = findOrCreateCart(userId, true);
        Map<Long, String> note = new HashMap<>(); 
        boolean isCartChanged = false; 

        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            BigDecimal currentLivePrice = product.getFinalPrice();
            if (item.getPrice().compareTo(currentLivePrice) != 0) {
                if (item.getPrice().compareTo(currentLivePrice) < 0) {
                    note.put(item.getId(), "Chương trình khuyến mãi cho món '" + product.getName() +
                            "' đã kết thúc. Giá đã cập nhật về " + currentLivePrice + "đ.");
                } else {
                    note.put(item.getId(), "Tin vui! Món '" + product.getName() +
                            "' vừa được giảm giá xuống còn " + currentLivePrice + "đ.");
                }
                item.setPrice(currentLivePrice);
                isCartChanged = true;
            }
            // 3. logic check tồn kho
            long stockQuantity = inventoryBatchRepository.findCurrentProductQuantity(item.getProduct().getId());
            if (stockQuantity <= 0) {
                item.setQuantity(0);
                note.put(item.getId(), "Sản phẩm đã hết hàng");
                isCartChanged = true;
            } else if (stockQuantity < item.getQuantity()) {
                item.setQuantity((int) stockQuantity);
                note.put(item.getId(), "Kho chỉ còn " + stockQuantity + " sản phẩm. Số lượng đã được cập nhật.");
                isCartChanged = true;
            }
        }
        if (isCartChanged) {
            cartRepository.save(cart);
        }
        return mapCartToDTO(cart, note);
    }

    @Override
    @Transactional
    public CartResponseDTO addItemToCart(UUID userId, CartItemRequestDTO request) {
        Cart cart = findOrCreateCart(userId, false);
        Product product = findProductById(request.getProductId());

        // 1. Kiểm tra tồn kho thực tế
        long currentStock = inventoryBatchRepository
                .findCurrentProductQuantity(request.getProductId());

        // Tìm item cũ để tính tổng số lượng sau khi thêm
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartAndProduct(cart, product);
        int currentQuantityInCart = existingItemOpt.map(CartItem::getQuantity).orElse(0);
        int totalRequested = currentQuantityInCart + request.getQuantity();

        if (currentStock < totalRequested) {
            throw new IllegalArgumentException(
                    "Kho chỉ còn " + currentStock + " sản phẩm (Giỏ của bạn đã có " + currentQuantityInCart + ")."
            );
        }

        // 2. Xử lý Thêm hoặc Cập nhật
        BigDecimal priceToAdd = product.getFinalPrice();

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(totalRequested);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(cart, product, request.getQuantity());
            newItem.setPrice(priceToAdd);
            cartItemRepository.save(newItem);
        }

        // 3. QUAN TRỌNG: Gọi lại getCart để trả về DTO đầy đủ kèm Warnings (nếu có các item khác bị thay đổi)
        return getCart(userId);
    }

    @Override
    @Transactional
    public CartResponseDTO updateCartItem(UUID userId, Long cartItemId, CartItemUpdateDTO request) {
        Cart cart = findOrCreateCart(userId, false);

        CartItem item = cartItemRepository.findByIdAndCart_Id(cartItemId, cart.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy item trong giỏ hàng."));

        // 1. Kiểm tra tồn kho với số lượng MỚI user muốn update
        long currentStock = inventoryBatchRepository
                .findCurrentProductQuantity(item.getProduct().getId());

        if (currentStock < request.getQuantity()) {
            throw new IllegalArgumentException(
                    "Kho chỉ còn " + currentStock + " sản phẩm. Không thể cập nhật lên " + request.getQuantity() + "."
            );
        }

        // 2. Cập nhật số lượng VÀ giá mới nhất
        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        // 3. Gọi lại getCart để đảm bảo tính toán lại tổng tiền và warnings
        return getCart(userId);
    }

    @Override
    @Transactional
    public CartResponseDTO removeCartItem(UUID userId, Long cartItemId) {
        Cart cart = findOrCreateCart(userId, false);

        CartItem item = cartItemRepository.findByIdAndCart_Id(cartItemId, cart.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy item trong giỏ hàng."));

        cartItemRepository.delete(item);

        // Gọi lại getCart để tính lại tổng tiền sau khi xóa
        return getCart(userId);
    }

    private Cart findOrCreateCart(UUID userId, boolean fetchItems) {
        Optional<Cart> cartOpt = fetchItems ?
                cartRepository.findByUserIdWithItems(userId) :
                cartRepository.findByUser_UserId(userId);

        if (cartOpt.isPresent()) {
            return cartOpt.get();
        }

        // Tạo mới nếu chưa có
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy user: " + userId));

        Cart newCart = new Cart();
        newCart.setUser(user);
        newCart.setLastUpdated(OffsetDateTime.now());
        return cartRepository.save(newCart);
    }

    private CartResponseDTO mapCartToDTO(Cart cart, Map<Long, String> noteMap) {
        if (cart.getItems().isEmpty()) {
            return CartResponseDTO.fromEntity(cart, Map.of());
        }
        return CartResponseDTO.fromEntity(cart, noteMap);
    }

    private Product findProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
    }
}