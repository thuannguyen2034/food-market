package com.foodmarket.food_market.user.service;

import com.foodmarket.food_market.user.dto.ChangePasswordRequestDTO;
import com.foodmarket.food_market.user.dto.UserInfoUpdateDTO;
import com.foodmarket.food_market.user.dto.UserResponseDTO;

import java.time.LocalDateTime;


public interface UserService {
    /**
     * Lấy thông tin user hiện tại đang đăng nhập.
     * @param email Email của user (lấy từ token)
     * @return DTO chứa thông tin user an toàn
     */
    UserResponseDTO getCurrentUser(String email);
    // Trong UserService.java (Interface)
    void changePassword(String email, ChangePasswordRequestDTO request);
    UserResponseDTO updateUserInfo(String email, UserInfoUpdateDTO user);
    UserResponseDTO updateAvatar(String email, String newAvatarUrl);
    void deleteAvatar(String email);
    long countNewUsers(LocalDateTime start, LocalDateTime end);
}