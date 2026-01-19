package com.foodmarket.food_market.order.model.enums;

import java.util.EnumSet;
import java.util.Set;

public enum OrderStatus {
    PENDING,        
    CONFIRMED,      
    PROCESSING,     
    OUT_FOR_DELIVERY, 
    DELIVERED,      
    CANCELLED;    

    public static final Set<OrderStatus> ACTIVE_STATUSES =
            EnumSet.of(CONFIRMED
                    , DELIVERED
                    , PROCESSING
                    , OUT_FOR_DELIVERY);
    public static final Set<String> ACTIVE_STATUSES_Strings = Set.of(CONFIRMED.name()
            , DELIVERED.name()
            , PROCESSING.name()
            , OUT_FOR_DELIVERY.name());
    public static final Set<OrderStatus> URGENT_STATUSES =
            EnumSet.of(CONFIRMED
                    , PENDING
                    , PROCESSING
                    , OUT_FOR_DELIVERY);
}