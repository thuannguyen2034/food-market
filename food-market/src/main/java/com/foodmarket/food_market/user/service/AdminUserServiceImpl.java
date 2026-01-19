package com.foodmarket.food_market.user.service;

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

import java.util.UUID;

@Service 
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;

   
    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> getUsers(String keyword, String role, Pageable pageable) {
        Specification<User> spec = Specification.allOf();

        if (StringUtils.hasText(keyword)) {
            String likeKey = "%" + keyword.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("fullName")), likeKey),
                    cb.like(cb.lower(root.get("email")), likeKey),
                    cb.like(cb.lower(root.get("phone")), likeKey)
            ));
        }
        if (StringUtils.hasText(role)) {
    spec = spec.and((root, query, cb) -> 
        cb.equal(root.get("role"), Role.valueOf(role))
    );
}

        return userRepository.findAll(spec, pageable)
                .map(this::convertToDTO);
    }


    
    @Override
    @Transactional
    public void updateUserRole(UUID userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setRole(role);
        userRepository.save(user);
    }

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