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
import com.foodmarket.food_market.user.repository.UserRepository;
import com.pusher.rest.Pusher;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final Pusher pusher;

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
    @Transactional
    public Page<ChatMessageDTO> getCustomerHistory(UUID customerId, Pageable pageable) {
        Conversation conversation = conversationRepository.findByCustomer_UserId(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Lỗi khi tải cuộc trò chuyện"));

        Page<ChatMessage> chatMessagePage = chatMessageRepository.findByConversation_Id(conversation.getId(), pageable);
        for (ChatMessage chatMessage : chatMessagePage.getContent()) {
            if (!chatMessage.getSenderType().equals(SenderType.CUSTOMER)) {
                chatMessage.setRead(true);
            }
        }
        return chatMessagePage.map(ChatMessageDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationDTO> getConversations(ConversationStatus status,String keyword, Pageable pageable) {
        Page<Conversation> conversations = conversationRepository.searchByStatusAndKeyword(status,keyword, pageable);
        return enrichConversations(conversations);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationDTO> getMyConversations(UUID staffId, String keyword, Pageable pageable) {
        Page<Conversation> conversations = conversationRepository.searchMyConversations(staffId, keyword, pageable);
        return enrichConversations(conversations);
    }

    @Override
    @Transactional
    public Page<ChatMessageDTO> getMessagesAdmin(UUID conversationId, Pageable pageable) {
        Page<ChatMessage> chatMessagePage = chatMessageRepository.findByConversation_Id(conversationId, pageable);
        for (ChatMessage chatMessage : chatMessagePage.getContent()) {
            if (chatMessage.getSenderType().equals(SenderType.CUSTOMER)) {
                chatMessage.setRead(true);
            }
        }
        return chatMessagePage.map(ChatMessageDTO::fromEntity);
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
                .isRead(false)
                .build();
        chatMessageRepository.save(message);

        triggerPusherEvents(conversation, message);
    }

    @Override
    @Transactional
    public void assignConversation(UUID conversationId, UUID requesterId, UUID targetStaffId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cuộc trò chuyện"));
        // Race Condition Check: Nếu đã có người khác nhận rồi
        if (conversation.getStaffId() != null && !conversation.getStaffId().equals(requesterId) && !conversation.getStaffId().equals(targetStaffId)) {
            throw new IllegalStateException("Hội thoại này đã được nhận bởi nhân viên khác!");
        }

        UUID assignedStaffId = (targetStaffId != null) ? targetStaffId : requesterId;
        conversation.setStaffId(assignedStaffId);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversationRepository.save(conversation);
        pushConversationUpdate(conversation);
    }

    @Override
    @Transactional
    public void finishConversation(UUID conversationId, UUID staffId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cuộc trò chuyện"));

        conversation.setStatus(ConversationStatus.IDLE);
        conversation.setStaffId(null);
        conversationRepository.save(conversation);
        //update dashboard
        pushConversationUpdate(conversation);
    }

    @Override
    @Transactional
    public void revokeConversation(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cuộc trò chuyện"));

        conversation.setStatus(ConversationStatus.WAITING);
        conversation.setStaffId(null);
        conversationRepository.save(conversation);
        pushConversationUpdate(conversation);
    }

    // --- Helper Methods ---
    private Page<ConversationDTO> enrichConversations(Page<Conversation> page) {
        if (page.isEmpty()) {
            return Page.empty();
        }
        List<UUID> ids = page.getContent().stream().map(Conversation::getId).toList();
        // 1. Batch Query Unread Counts (Map<ConversationId, Long>)
        List<Object[]> unreadResults = chatMessageRepository.countUnreadBatch(ids, SenderType.CUSTOMER);
        Map<UUID, Long> unreadMap = unreadResults.stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));
        // 2. Batch Query Last Messages (Map<ConversationId, String>)
        List<Object[]> lastMsgResults = chatMessageRepository.findLatestContentBatch(ids);
        Map<UUID, String> lastMsgMap = lastMsgResults.stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (String) row[1]
                ));
        // 3. Map to DTO
        return page.map(conv -> {
            ConversationDTO dto = ConversationDTO.fromEntity(conv);
            dto.setUnreadCount(unreadMap.getOrDefault(conv.getId(), 0L).intValue());
            dto.setLastMessagePreview(lastMsgMap.getOrDefault(conv.getId(), ""));
            if (conv.getStaffId() != null) {
                String staffName = userRepository.getReferenceById(conv.getStaffId()).getFullName();
                dto.setStaffName(staffName);
            } else dto.setStaffName(null);
            return dto;
        });
    }

    private void triggerPusherEvents(Conversation conversation, ChatMessage message) {
        try {
            ChatMessageDTO dto = ChatMessageDTO.fromEntity(message);
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.convertValue(dto, Map.class);
            String userChannel = "user-" + conversation.getCustomer().getUserId();
            pusher.trigger(userChannel, EVENT_NEW_MESSAGE, payload);
            String chatChannel = "chat-" + conversation.getId();
            pusher.trigger(chatChannel, EVENT_NEW_MESSAGE, payload);
            // Logic: Nếu customer nhắn -> Update Dashboard (để nổi lên đầu)
            // Nếu Staff nhắn -> Cũng nên Update Dashboard để cập nhật "Last Message Preview" cho Admin thấy
            pushConversationUpdate(conversation);
        } catch (Exception e) {
            log.error("Pusher error: ", e);
        }
    }

    private void pushConversationUpdate(Conversation conversation) {
        try {
            ConversationDTO dto = ConversationDTO.fromEntity(conversation);
            //Lấy last msg realtime cho pusher
            String lastestMessage = chatMessageRepository.findFirstByConversation_IdOrderBySentAtDesc(conversation.getId())
                    .map(ChatMessage::getContent)
                    .orElse("Hình ảnh/File"); // Fallback nếu sau này làm ảnh
            dto.setLastMessagePreview(lastestMessage);
            // Tính lại unread realtime
            long unread = chatMessageRepository.countByConversation_IdAndIsReadFalseAndSenderType(
                    conversation.getId(), SenderType.CUSTOMER);
            dto.setUnreadCount((int) unread);

            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.convertValue(dto, Map.class);
            pusher.trigger(CHANNEL_ADMIN_FEED, EVENT_SESSION_UPDATED, payload);
        } catch (Exception e) {
            log.error("Pusher dashboard update error: ", e);
        }
    }
}