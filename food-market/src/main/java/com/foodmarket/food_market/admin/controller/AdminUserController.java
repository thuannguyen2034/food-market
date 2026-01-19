package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.admin.dashboard.dto.response.UserStatsDTO;
import com.foodmarket.food_market.user.service.AdminUserService;
import com.foodmarket.food_market.user.dto.UpdateRoleRequestDTO;
import com.foodmarket.food_market.user.dto.UserResponseDTO;
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
@PreAuthorize("hasRole('ADMIN')") 
public class AdminUserController {

    private final AdminUserService adminService;
    private  final UserService userService;
    
    
    @GetMapping
    public ResponseEntity<Page<UserResponseDTO>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.getUsers(keyword,role, pageable));
    }

    
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
