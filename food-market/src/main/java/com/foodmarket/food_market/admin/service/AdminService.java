package com.foodmarket.food_market.admin.service;

import com.foodmarket.food_market.user.dto.UserResponseDTO;
import java.util.List;

public interface AdminService {
    /**
     * Lấy danh sách tất cả người dùng (chỉ dành cho Admin).
     * @return Danh sách UserResponseDTO
     */
    List<UserResponseDTO> getAllUsers();
}