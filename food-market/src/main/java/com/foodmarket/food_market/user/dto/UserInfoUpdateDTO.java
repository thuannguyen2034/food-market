package com.foodmarket.food_market.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserInfoUpdateDTO {
    @NotBlank(message = "Tên không được để trống")
    String fullName;
    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(min = 10, max = 11, message = "Số điện thoại phải từ 10-11 số")
    String phone;
    String avatarUrl;
}
