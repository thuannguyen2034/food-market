package com.foodmarket.food_market.admin.service;

import com.foodmarket.food_market.user.dto.UserResponseDTO;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.model.enums.Role;
import com.foodmarket.food_market.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service // Đánh dấu đây là một Spring Bean
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;

    /**
     * 1. NÂNG CẤP: Lấy danh sách User có Phân trang & Tìm kiếm
     * Thay vì findAll() list, ta trả về Page.
     */
    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> getUsers(String keyword, Pageable pageable) {
        Specification<User> spec = Specification.allOf();

        if (StringUtils.hasText(keyword)) {
            String likeKey = "%" + keyword.toLowerCase() + "%";

            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("fullName")), likeKey),
                    cb.like(cb.lower(root.get("email")), likeKey),
                    cb.like(cb.lower(root.get("phone")), likeKey)
            ));
        }

        // Trả về Page để Frontend phân trang (Trang 1, Trang 2...)
        return userRepository.findAll(spec, pageable)
                .map(this::convertToDTO);
    }


    /**
     *  TÍNH NĂNG MỚI: Cập nhật Role (Thăng chức/Giáng chức)
     */
    @Override
    @Transactional
    public void updateUserRole(UUID userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setRole(role);
        userRepository.save(user);
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