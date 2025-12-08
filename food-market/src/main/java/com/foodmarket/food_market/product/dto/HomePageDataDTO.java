package com.foodmarket.food_market.product.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class HomePageDataDTO {
    private List<ProductResponseDTO> flashSaleProducts; // List sản phẩm giảm giá
    private List<HomeSectionDTO> categorySections;      // List các cụm danh mục (Thịt, Rau...)
}
