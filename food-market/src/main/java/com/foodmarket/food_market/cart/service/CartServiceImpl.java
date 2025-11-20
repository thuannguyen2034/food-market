package com.foodmarket.food_market.cart.service;

import com.foodmarket.food_market.cart.dto.CartItemRequestDTO;
import com.foodmarket.food_market.cart.dto.CartItemUpdateDTO;
import com.foodmarket.food_market.cart.dto.CartResponseDTO;
import com.foodmarket.food_market.cart.model.Cart;
import com.foodmarket.food_market.cart.model.CartItem;
import com.foodmarket.food_market.cart.repository.CartItemRepository;
import com.foodmarket.food_market.cart.repository.CartRepository;
import com.foodmarket.food_market.inventory.repository.InventoryBatchRepository; // Cần để check tồn kho
import com.foodmarket.food_market.product.dto.ProductResponseDTO; // TÁI SỬ DỤNG
import com.foodmarket.food_market.product.model.Product;
import com.foodmarket.food_market.product.repository.ProductRepository;
import com.foodmarket.food_market.product.service.ProductService; // TÁI SỬ DỤNG
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryBatchRepository inventoryBatchRepository; // Check tồn kho
    private final ProductService productService; // TÁI SỬ DỤNG ĐỂ TÍNH GIÁ

    @Override
    @Transactional(readOnly = true)
    public CartResponseDTO getCart(UUID userId) {
        Cart cart = findOrCreateCart(userId, true); // Dùng true để fetch items
        return mapCartToDTO(cart);
    }

    @Override
    @Transactional
    public CartResponseDTO addItemToCart(UUID userId, CartItemRequestDTO request) {
        Cart cart = findOrCreateCart(userId, false); // Không cần fetch, sẽ thêm item
        Product product = findProductById(request.getProductId());

        // --- Logic nghiệp vụ quan trọng ---
        // 1. Kiểm tra tồn kho (dựa trên logic HSD của bạn)
        // Chúng ta chỉ cần check xem có lô nào còn hàng không (quantity > 0)
        boolean inStock = inventoryBatchRepository
                .findStillHasProductByProductIdOrderByExpirationDateAsc(request.getProductId())
                .isEmpty();

        if (inStock) {
            // Ném lỗi 400 Bad Request
            throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' đã hết hàng.");
        }

        // 2. Tìm xem item đã có trong giỏ chưa
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartAndProduct(cart, product);

        if (existingItemOpt.isPresent()) {
            // Đã có: Cập nhật số lượng
            CartItem item = existingItemOpt.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            cartItemRepository.save(item);
        } else {
            // Chưa có: Tạo mới
            CartItem newItem = new CartItem(cart, product, request.getQuantity());
            cartItemRepository.save(newItem);
        }

        // Tải lại giỏ hàng (đã fetch) để trả về
        Cart updatedCart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new EntityNotFoundException("Lỗi tải lại giỏ hàng."));
        return mapCartToDTO(updatedCart);
    }

    @Override
    @Transactional
    public CartResponseDTO updateCartItem(UUID userId, Long cartItemId, CartItemUpdateDTO request) {
        Cart cart = findOrCreateCart(userId, false); // Chỉ cần ID giỏ hàng

        // --- Logic bảo mật quan trọng ---
        // Phải tìm item BẰNG ID và ID giỏ hàng của user
        CartItem item = cartItemRepository.findByIdAndCart_Id(cartItemId, cart.getId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy item trong giỏ hàng của bạn." // Lỗi 404
                ));

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        Cart updatedCart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new EntityNotFoundException("Lỗi tải lại giỏ hàng."));
        return mapCartToDTO(updatedCart);
    }

    @Override
    @Transactional
    public CartResponseDTO removeCartItem(UUID userId, Long cartItemId) {
        Cart cart = findOrCreateCart(userId, false);

        // --- Logic bảo mật (giống như update) ---
        CartItem item = cartItemRepository.findByIdAndCart_Id(cartItemId, cart.getId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy item trong giỏ hàng của bạn."
                ));

        cartItemRepository.delete(item);

        Cart updatedCart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new EntityNotFoundException("Lỗi tải lại giỏ hàng."));
        return mapCartToDTO(updatedCart);
    }

    // ==================================================================
    // --- Private Helper Methods ---
    // ==================================================================

    /**
     * Hàm tiện ích tìm giỏ hàng. Tự tạo nếu chưa có.
     * @param fetchItems Dùng query JOIN FETCH (tốn kém) hay không?
     */
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

    /**
     * Hàm tiện ích chuyển đổi Cart sang DTO (chứa logic tính giá)
     */
    private CartResponseDTO mapCartToDTO(Cart cart) {
        if (cart.getItems().isEmpty()) {
            // Trả về giỏ hàng trống, không cần gọi ProductService
            return CartResponseDTO.fromEntity(cart, Map.of());
        }

        // Lấy danh sách ID các sản phẩm trong giỏ
        Set<Long> productIds = cart.getItems().stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toSet());

        // --- Tái sử dụng logic tính giá ---
        // Gọi ProductService để lấy giá động (finalPrice) cho TẤT CẢ sản phẩm
        Map<Long, ProductResponseDTO> priceMap = productIds.stream()
                .map(productService::getProductDetails) // Gọi hàm đã có
                .collect(Collectors.toMap(ProductResponseDTO::getId, Function.identity()));

        return CartResponseDTO.fromEntity(cart, priceMap);
    }

    private Product findProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
    }
}