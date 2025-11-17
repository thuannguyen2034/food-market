package com.foodmarket.food_market.admin.service;

import com.foodmarket.food_market.user.dto.UserResponseDTO;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service // Đánh dấu đây là một Spring Bean
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;

    // Injecct UserRepository qua constructor
    public AdminServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public List<UserResponseDTO> getAllUsers() {
        // 1. Gọi repository để lấy tất cả User entity
        List<User> users = userRepository.findAll();

        // 2. Chuyển đổi (map) danh sách User entity sang UserResponseDTO
        return users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Phương thức private helper để chuyển đổi User Entity -> UserResponseDTO.
     * Đảm bảo không làm lộ mật khẩu hoặc các thông tin nhạy cảm.
     */
    private UserResponseDTO convertToDTO(User user) {
        return UserResponseDTO.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}