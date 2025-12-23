package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.user.service.AdminUserService;
// (Bạn sẽ cần tạo 1 AdminService để lấy danh sách user)
// import com.foodmarket.food_market.user.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin") // Một prefix riêng cho Admin
@RequiredArgsConstructor
public class AdminController {

     private final AdminUserService adminService; // (Sẽ thêm sau)

    /**
     * API Endpoint này CHỈ DÀNH CHO ADMIN.
     * Spring Security sẽ tự động kiểm tra role của user từ JWT token.
     */

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'SHIPPER')") // ADMIN hoặc SHIPPER
    public ResponseEntity<String> getDashboard() {
        return ResponseEntity.ok("API cho cả Admin và Shipper");
    }
}