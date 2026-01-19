package com.foodmarket.food_market.chat.repository;

import com.foodmarket.food_market.chat.model.ChatMessage;
import com.foodmarket.food_market.chat.model.enums.SenderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    Page<ChatMessage> findByConversation_Id(UUID conversationId, Pageable pageable);
    long countByConversation_IdAndIsReadFalseAndSenderType(UUID conversationId, SenderType senderType);
    @Query("SELECT m.conversation.id, COUNT(m) FROM ChatMessage m " +
            "WHERE m.conversation.id IN :conversationIds " +
            "AND m.isRead = false " +
            "AND m.senderType = :senderType " +
            "GROUP BY m.conversation.id")
    List<Object[]> countUnreadBatch(@Param("conversationIds") List<UUID> conversationIds,
                                    @Param("senderType") SenderType senderType);

    @Query(value = "SELECT DISTINCT ON (m.conversation_id) m.conversation_id, m.content " +
            "FROM chat_messages m " +
            "WHERE m.conversation_id IN :conversationIds " +
            "ORDER BY m.conversation_id, m.sent_at DESC",
            nativeQuery = true)
    List<Object[]> findLatestContentBatch(@Param("conversationIds") List<UUID> conversationIds);

    @Query("SELECT m FROM ChatMessage m WHERE m.conversation.id = :conversationId ORDER BY m.sentAt DESC LIMIT 1")
    Optional<ChatMessage> findFirstByConversation_IdOrderBySentAtDesc(@Param("conversationId") UUID conversationId);
}