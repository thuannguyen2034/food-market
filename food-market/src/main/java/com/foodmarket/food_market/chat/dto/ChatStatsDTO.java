package com.foodmarket.food_market.chat.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatStatsDTO {
    private long waitingCount; // Số khách đang chờ (Global)
    private long myActiveCount; // Số khách mình đang chat
}