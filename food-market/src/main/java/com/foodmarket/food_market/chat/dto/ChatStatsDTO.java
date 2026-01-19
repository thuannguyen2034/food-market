package com.foodmarket.food_market.chat.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatStatsDTO {
    private long waitingCount; 
    private long myActiveCount; 
}