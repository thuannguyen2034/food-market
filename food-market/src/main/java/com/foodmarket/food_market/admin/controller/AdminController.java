package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.user.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin") 
@RequiredArgsConstructor
public class AdminController {

     private final AdminUserService adminService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'SHIPPER')") 
    public ResponseEntity<String> getDashboard() {
        return ResponseEntity.ok("API cho cả Admin và Shipper");
    }
}