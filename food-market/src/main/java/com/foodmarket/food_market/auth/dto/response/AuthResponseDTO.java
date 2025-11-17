package com.foodmarket.food_market.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseDTO {

    private String token; // Access Token (ngắn hạn, 15 phút)
    private String refreshToken; // Refresh Token (dài hạn, 7 ngày)
}