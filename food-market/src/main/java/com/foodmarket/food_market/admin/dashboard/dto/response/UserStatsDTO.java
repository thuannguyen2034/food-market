package com.foodmarket.food_market.admin.dashboard.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsDTO {
    private long totalUsers;
    private long totalCustomers;
    private long totalAdmins;
    private long totalStaffs;
    private long newUsersThisMonth;
}