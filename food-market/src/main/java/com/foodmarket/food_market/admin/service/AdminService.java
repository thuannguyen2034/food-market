package com.foodmarket.food_market.admin.service;

import com.foodmarket.food_market.user.dto.UserResponseDTO;
import com.foodmarket.food_market.user.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AdminService {
    Page<UserResponseDTO> getUsers(String keyword,String role, Pageable pageable);
    void updateUserRole(UUID userId, Role role);
}