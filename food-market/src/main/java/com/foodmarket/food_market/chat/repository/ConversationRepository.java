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

    // 1. Dùng cho Tab "Hàng chờ" (WAITING) và Tab "Lịch sử chung" (IDLE)
    // Sắp xếp giảm dần theo tin nhắn cuối
    Page<Conversation> findByStatusOrderByLastMessageAtDesc(ConversationStatus status, Pageable pageable);

    // 2. CHỈ Dùng cho Tab "Của tôi" (ACTIVE)
    // Lúc này staffId chắc chắn phải có giá trị
    Page<Conversation> findByStaffIdAndStatusOrderByLastMessageAtDesc(UUID staffId, ConversationStatus status, Pageable pageable);

    // --- Stats ---
    long countByStatus(ConversationStatus status);

    // Đếm xem mình đang chat với bao nhiêu người (chỉ count Active)
    long countByStaffIdAndStatus(UUID staffId, ConversationStatus status);
}