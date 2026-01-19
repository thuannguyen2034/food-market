package com.foodmarket.food_market.product.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class HomePageDataDTO {
    private List<ProductResponseDTO> flashSaleProducts; 
    private List<HomeSectionDTO> categorySections;      
}
