package com.foodmarket.food_market.product.dto;

import com.foodmarket.food_market.product.model.Tag;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TagDTO {
    private Long id;
    private String name;
    private String slug;
    public static TagDTO fromEntity(Tag tag) {
        return TagDTO.builder()
                .id(tag.getId())
                .name(tag.getName())
                .slug(tag.getSlug())
                .build();
    }
}