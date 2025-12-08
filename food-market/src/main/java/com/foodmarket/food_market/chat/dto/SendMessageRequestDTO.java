package com.foodmarket.food_market.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequestDTO {
    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String content;
}