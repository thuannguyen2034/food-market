package com.foodmarket.food_market.chat.model.enums;

public enum ConversationStatus {
    WAITING, // Khách mới nhắn, chưa ai nhận
    ACTIVE, // Đã có Staff nhận
    IDLE //nhân viên đã đóng chat,khách hàng không nhắn gì mới, chuyển sang trạng thái idle
}