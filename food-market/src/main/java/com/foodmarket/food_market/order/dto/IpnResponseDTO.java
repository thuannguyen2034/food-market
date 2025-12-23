package com.foodmarket.food_market.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class IpnResponseDTO {
    private String RspCode;
    private String Message;
}