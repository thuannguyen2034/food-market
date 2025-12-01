package com.foodmarket.food_market.order.model.enums;


import lombok.Getter;

@Getter
public enum DeliveryTimeSlot {
    SLOT_08_10("08:00 - 10:00", 8, 10),
    SLOT_10_12("10:00 - 12:00", 10, 12),
    SLOT_12_14("12:00 - 14:00", 12, 14),
    SLOT_14_16("14:00 - 16:00", 14, 16),
    SLOT_16_18("16:00 - 18:00", 16, 18),
    SLOT_18_20("18:00 - 20:00", 18, 20);

    private final String label;
    private final int startHour;
    private final int endHour;

    DeliveryTimeSlot(String label, int startHour, int endHour) {
        this.label = label;
        this.startHour = startHour;
        this.endHour = endHour;
    }

    public boolean isAvailable(int currentHour) {
        return currentHour < this.startHour;
    }
}