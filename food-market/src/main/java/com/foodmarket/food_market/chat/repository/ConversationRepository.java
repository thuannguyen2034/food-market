package com.foodmarket.food_market.chat.repository;

import com.foodmarket.food_market.chat.model.Conversation;
import com.foodmarket.food_market.chat.model.enums.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByCustomer_UserId(UUID customerId);

    long countByStatus(ConversationStatus status);

    // count Active
    long countByStaffIdAndStatus(UUID staffId, ConversationStatus status);

    //
    @Query("SELECT c FROM Conversation c JOIN c.customer u " +
            "WHERE (:status IS NULL OR c.status = :status) " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Conversation> searchByStatusAndKeyword(
            @Param("status") ConversationStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // My Conversations
    @Query("SELECT c FROM Conversation c JOIN c.customer u " +
            "WHERE c.staffId = :staffId " +
            "AND c.status = 'ACTIVE' " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Conversation> searchMyConversations(
            @Param("staffId") UUID staffId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}