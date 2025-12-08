package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.admin.dashboard.dto.response.UserStatsDTO;
import com.foodmarket.food_market.admin.service.AdminService;
import com.foodmarket.food_market.user.dto.UpdateRoleRequestDTO;
import com.foodmarket.food_market.user.dto.UserResponseDTO;
import com.foodmarket.food_market.user.repository.UserRepository;
import com.foodmarket.food_market.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Chỉ ADMIN mới được truy cập Class này
public class AdminUserController {

    private final AdminService adminService;
    private  final UserService userService;
    /**
     * 1. Lấy danh sách User (Có tìm kiếm & Phân trang)
     * URL: GET /api/v1/admin/users?keyword=nam&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<Page<UserResponseDTO>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.getUsers(keyword,role, pageable));
    }

    /**
     * 2. Cập nhật Role (Thăng chức/Giáng chức)
     * URL: PATCH /api/v1/admin/users/{userId}/role
     * Body: { "role": "ADMIN" }
     */
    @PatchMapping("/{userId}/role")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateRoleRequestDTO request
    ) {
        adminService.updateUserRole(userId, request.role());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsDTO> getUserStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }
}
