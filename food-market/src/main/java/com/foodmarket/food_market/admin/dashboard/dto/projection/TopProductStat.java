package com.foodmarket.food_market.admin.dashboard.dto.projection;

import com.foodmarket.food_market.product.model.ProductImage;

import java.math.BigDecimal;
import java.util.List;

public interface TopProductStat {
    Long getProductId();
    String getProductName();
    List<ProductImage> getProductImages();
    Long getTotalSold();      // Tổng số lượng bán ra
    BigDecimal getTotalRevenue(); // Tổng tiền thu được từ sản phẩm này
}