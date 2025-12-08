package com.foodmarket.food_market.user.model.enums;

/**
 * Định nghĩa các vai trò trong hệ thống.
 * Chúng ta dùng String trong DB nên sẽ map với Enum này.
 */
public enum Role {
    CUSTOMER, // Khách hàng
    ADMIN,    // Quản trị viên
    STAFF   // Người giao hàng
}