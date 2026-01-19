package com.foodmarket.food_market.user.dto;

import com.foodmarket.food_market.user.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponseDTO {
    private UUID userId;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private OffsetDateTime createdAt;
    private String avatarUrl;
}