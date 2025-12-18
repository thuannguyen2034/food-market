package com.foodmarket.food_market.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodmarket.food_market.chat.dto.*;
import com.foodmarket.food_market.chat.model.ChatMessage;
import com.foodmarket.food_market.chat.model.Conversation;
import com.foodmarket.food_market.chat.model.enums.ConversationStatus;
import com.foodmarket.food_market.chat.model.enums.SenderType;
import com.foodmarket.food_market.chat.repository.ChatMessageRepository;
import com.foodmarket.food_market.chat.repository.ConversationRepository;
import com.foodmarket.food_market.user.model.entity.User;
import com.pusher.rest.Pusher;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;
    private final Pusher pusher; // Đã config bean Pusher từ trước

    // Channel names constants
    private static final String CHANNEL_ADMIN_FEED = "admin-chat-feed";
    private static final String EVENT_SESSION_UPDATED = "session-updated";
    private static final String EVENT_NEW_MESSAGE = "new-message";

    @Override
    @Transactional
    public void customerSend(User customer, String content) {
        // 1. Tìm hoặc tạo Conversation
        Conversation conversation = conversationRepository.findByCustomer_UserId(customer.getUserId())
                .orElseGet(() -> Conversation.builder()
                        .customer(customer)
                        .status(ConversationStatus.WAITING)
                        .build());

        // 2. Cập nhật trạng thái: Luôn đưa về WAITING để nổi lên hàng chờ
        if (!ConversationStatus.ACTIVE.equals(conversation.getStatus())) {
            conversation.setStatus(ConversationStatus.WAITING);
        }
        conversation.setLastMessageAt(OffsetDateTime.now());
        conversation = conversationRepository.save(conversation);

        // 3. Lưu tin nhắn
        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .senderId(customer.getUserId())
                .senderType(SenderType.CUSTOMER)
                .content(content)
                .isRead(false)
                .build();
        chatMessageRepository.save(message);

        // 4. Bắn Pusher
        triggerPusherEvents(conversation, message);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageDTO> getCustomerHistory(UUID customerId, Pageable pageable) {
        Conversation conversation = conversationRepository.findByCustomer_UserId(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Bạn chưa có cuộc trò chuyện nào."));

        return chatMessageRepository.findByConversation_Id(conversation.getId(), pageable)
                .map(ChatMessageDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationDTO> getConversations(ConversationStatus status, Pageable pageable) {
        ConversationStatus queryStatus = (status != null) ? status : ConversationStatus.WAITING;

        return conversationRepository.findByStatusOrderByLastMessageAtDesc(queryStatus, pageable)
                .map(conversation -> {
                    ConversationDTO dto = ConversationDTO.fromEntity(conversation);
                    String lastMsg = chatMessageRepository.findFirstByConversation_IdOrderBySentAtDesc(conversation.getId())
                            .map(ChatMessage::getContent)
                            .orElse(""); // Hàng chờ thì có thể để trống hoặc "..."

                    dto.setLastMessagePreview(lastMsg);

                    // Hàng chờ cũng cần biết khách nhắn bao nhiêu tin chưa đọc
                    long unread = chatMessageRepository.countByConversation_IdAndIsReadFalseAndSenderType(
                            conversation.getId(),
                            SenderType.CUSTOMER
                    );
                    dto.setUnreadCount((int) unread);

                    return dto;
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationDTO> getMyConversations(UUID staffId, Pageable pageable) {
        // Lấy danh sách Active của Staff
        Page<Conversation> conversations = conversationRepository.findByStaffIdAndStatusOrderByLastMessageAtDesc(
                staffId,
                ConversationStatus.ACTIVE,
                pageable
        );
        // Map sang DTO và điền thêm thông tin (Last Message + Unread)
        return conversations.map(conversation -> {
            ConversationDTO dto = ConversationDTO.fromEntity(conversation);

            // 1. Lấy Last Message (Xử lý an toàn với orElse)
            String lastMsg = chatMessageRepository.findFirstByConversation_IdOrderBySentAtDesc(conversation.getId())
                    .map(ChatMessage::getContent) // Nếu có tin nhắn -> lấy content
                    .orElse("Chưa có tin nhắn");  // Nếu chưa có -> Default text

            dto.setLastMessagePreview(lastMsg);

            // 2. Lấy Unread Count (Chỉ đếm tin của CUSTOMER gửi)
            long unread = chatMessageRepository.countByConversation_IdAndIsReadFalseAndSenderType(
                    conversation.getId(),
                    SenderType.CUSTOMER // Enum SenderType.CUSTOMER
            );

            dto.setUnreadCount((int) unread);

            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageDTO> getMessages(UUID conversationId, Pageable pageable) {
        return chatMessageRepository.findByConversation_Id(conversationId, pageable)
                .map(ChatMessageDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatStatsDTO getStats(UUID staffId) {
        return ChatStatsDTO.builder()
                .waitingCount(conversationRepository.countByStatus(ConversationStatus.WAITING))
                .myActiveCount(conversationRepository.countByStaffIdAndStatus(staffId, ConversationStatus.ACTIVE))
                .build();
    }

    @Override
    @Transactional
    public void staffReply(UUID conversationId, UUID staffId, String content) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));

        // Update time để sort
        conversation.setLastMessageAt(OffsetDateTime.now());
        conversationRepository.save(conversation);

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .senderId(staffId)
                .senderType(SenderType.STAFF)
                .content(content)
                .isRead(true)
                .build();
        chatMessageRepository.save(message);

        triggerPusherEvents(conversation, message);
    }

    @Override
    @Transactional
    public void assignConversation(UUID conversationId, UUID requesterId, UUID targetStaffId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));

        UUID assignedStaffId = (targetStaffId != null) ? targetStaffId : requesterId;

        conversation.setStaffId(assignedStaffId);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversationRepository.save(conversation);

        // Bắn event update dashboard (để conversation biến mất khỏi list Waiting)
        pushConversationUpdate(conversation);
    }

    @Override
    @Transactional
    public void finishConversation(UUID conversationId, UUID staffId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));

        // Logic chuẩn: Set IDLE và Xóa staffId
        conversation.setStatus(ConversationStatus.IDLE);
        conversation.setStaffId(null);

        conversationRepository.save(conversation);

        // Bắn update dashboard
        pushConversationUpdate(conversation);
    }

    @Override
    @Transactional
    public void revokeConversation(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));

        conversation.setStatus(ConversationStatus.WAITING);
        conversation.setStaffId(null);
        conversationRepository.save(conversation);
        pushConversationUpdate(conversation);
    }

    // --- Helper Methods ---

    private void triggerPusherEvents(Conversation conversation, ChatMessage message) {
        try {
            ChatMessageDTO dto = ChatMessageDTO.fromEntity(message);
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.convertValue(dto, Map.class);
            // 1. Gửi vào channel riêng của Khách hàng (để họ thấy tin nhắn ngay)
            // Channel: user-{uuid}
            String userChannel = "user-" + conversation.getCustomer().getUserId();
            pusher.trigger(userChannel, EVENT_NEW_MESSAGE, payload);

            // 2. Gửi vào channel riêng của cuộc hội thoại (Cho Staff đang chat thấy)
            // Channel: chat-{conversationId}
            String chatChannel = "chat-" + conversation.getId();
            pusher.trigger(chatChannel, EVENT_NEW_MESSAGE, payload);

            // 3. Nếu là tin nhắn mới của khách -> Cập nhật list hàng chờ cho Admin Dashboard
            if (message.getSenderType() == SenderType.CUSTOMER) {
                pushConversationUpdate(conversation);
            }
        } catch (Exception e) {
            log.error("Pusher error: ", e);
        }
    }

    private void pushConversationUpdate(Conversation conversation) {
        try {
            // Channel chung cho toàn bộ Staff/Admin đang mở Dashboard
            ConversationDTO dto = ConversationDTO.fromEntity(conversation);

            String lastestMessage = chatMessageRepository.findFirstByConversation_IdOrderBySentAtDesc(conversation.getId()).map(ChatMessage::getContent).orElse("cập nhật trạng thái...");
            dto.setLastMessagePreview(lastestMessage);
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.convertValue(dto, Map.class);
            pusher.trigger(CHANNEL_ADMIN_FEED, EVENT_SESSION_UPDATED, payload);
        } catch (Exception e) {
            log.error("Pusher dashboard update error: ", e);
        }
    }
}