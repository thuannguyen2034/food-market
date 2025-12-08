package com.foodmarket.food_market.chat.dto;

import com.foodmarket.food_market.chat.model.Conversation;
import com.foodmarket.food_market.chat.model.enums.ConversationStatus;
import com.foodmarket.food_market.user.model.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ConversationDTO {
    private UUID id;

    // Thông tin khách hàng (Lấy từ User Entity)
    private UUID customerId;
    private String customerName;
    private String customerAvatar;
    private String customerEmail; // Thêm email để Staff dễ liên hệ nếu cần

    private UUID staffId; // Null nếu chưa ai nhận

    private ConversationStatus status;
    private String title; // Optional

    private OffsetDateTime lastMessageAt;
    private OffsetDateTime createdAt;

    // Các trường bổ sung (Computed fields)
    private String lastMessagePreview; // Tin nhắn cuối (cắt ngắn)
    private int unreadCount; // Số tin chưa đọc (để hiện badge đỏ)

    /**
     * Mapper thủ công: Chuyển từ Entity sang DTO
     * Cách này nhanh, hiệu năng cao hơn dùng Reflection của thư viện.
     */
    public static ConversationDTO fromEntity(Conversation conversation) {
        // Lấy thông tin Customer từ quan hệ @OneToOne
        User customer = conversation.getCustomer();

        // Xử lý avatar: Nếu null thì có thể để null hoặc FE tự xử lý
        String avatarUrl = customer != null ? customer.getAvatarUrl() : null;
        String fullName = customer != null ? customer.getFullName() : "Unknown Customer";
        String email = customer != null ? customer.getEmail() : "";
        UUID custId = customer != null ? customer.getUserId() : null;

        return ConversationDTO.builder()
                .id(conversation.getId())
                .customerId(custId)
                .customerName(fullName)
                .customerAvatar(avatarUrl)
                .customerEmail(email)
                .staffId(conversation.getStaffId())
                .status(conversation.getStatus())
                .title(conversation.getTitle())
                .lastMessageAt(conversation.getLastMessageAt())
                .createdAt(conversation.getCreatedAt())
                // Lưu ý: unreadCount và preview sẽ được set riêng ở Service nếu cần query phức tạp
                .build();
    }
}