package com.foodmarket.food_market.user.dto;

import com.foodmarket.food_market.user.model.enums.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequestDTO(
        @NotNull(message = "Role is required")
        Role role
) {}
