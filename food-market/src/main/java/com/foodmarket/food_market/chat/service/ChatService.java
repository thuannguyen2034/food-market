package com.foodmarket.food_market.chat.service;

import com.foodmarket.food_market.chat.dto.ChatMessageDTO;
import com.foodmarket.food_market.chat.dto.ChatStatsDTO;
import com.foodmarket.food_market.chat.dto.ConversationDTO;
import com.foodmarket.food_market.chat.model.enums.ConversationStatus;
import com.foodmarket.food_market.user.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ChatService {

    // --- Customer ---
    void customerSend(User customer, String content);
    Page<ChatMessageDTO> getCustomerHistory(UUID customerId, Pageable pageable);

    // --- Staff/Admin: Query ---
    Page<ConversationDTO> getConversations(ConversationStatus status, Pageable pageable);
    Page<ConversationDTO> getMyConversations(UUID staffId, Pageable pageable);
    Page<ChatMessageDTO> getMessages(UUID conversationId, Pageable pageable);
    ChatStatsDTO getStats(UUID staffId);

    // --- Staff/Admin: Actions ---
    void staffReply(UUID conversationId, UUID staffId, String content);
    void assignConversation(UUID conversationId, UUID requesterId, UUID targetStaffId);
    void finishConversation(UUID conversationId, UUID staffId);
    void revokeConversation(UUID conversationId);
}