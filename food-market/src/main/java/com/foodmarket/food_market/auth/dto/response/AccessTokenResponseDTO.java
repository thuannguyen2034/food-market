package com.foodmarket.food_market.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessTokenResponseDTO {
    // Chỉ chứa Access Token (ngắn hạn)
    private String token;
}