package com.foodmarket.food_market.chat.controller;

import com.foodmarket.food_market.chat.dto.*;
import com.foodmarket.food_market.chat.dto.SendMessageRequestDTO;
import com.foodmarket.food_market.chat.model.enums.ConversationStatus;
import com.foodmarket.food_market.chat.service.ChatService;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.model.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ================= CUSTOMER ENDPOINTS =================

    @PostMapping("/customer/send")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> customerSend(
            Authentication auth,
            @RequestBody SendMessageRequestDTO request
    ) {
        User user = (User) auth.getPrincipal();
        chatService.customerSend(user, request.getContent());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/customer/history")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<ChatMessageDTO>> getMyHistory(
            Authentication auth,
            @PageableDefault(size = 20, sort = "sentAt") Pageable pageable
    ) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(chatService.getCustomerHistory(user.getUserId(), pageable));
    }

    // ================= STAFF/ADMIN ENDPOINTS =================

    // 1. Lấy danh sách hội thoại (chỉ waiting hoặc idle)
    @GetMapping("/admin/conversations")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Page<ConversationDTO>> getConversations(
            @RequestParam(required = false) ConversationStatus status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "lastMessageAt") Pageable pageable
    ) {
        return ResponseEntity.ok(chatService.getConversations(status,keyword, pageable));
    }

    // 2. Lấy danh sách hội thoại Của Tôi (Đang chat)
    @GetMapping("/admin/conversations/my")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Page<ConversationDTO>> getMyConversations(
            Authentication auth,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "lastMessageAt") Pageable pageable
    ) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(chatService.getMyConversations(user.getUserId(),keyword, pageable));
    }

    // 3. Xem chi tiết tin nhắn của 1 hội thoại
    @GetMapping("/admin/conversations/{conversationId}/messages")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Page<ChatMessageDTO>> getConversationMessages(
            @PathVariable UUID conversationId,
            @PageableDefault(size = 20, sort = "sentAt") Pageable pageable
    ) {
        return ResponseEntity.ok(chatService.getMessagesAdmin(conversationId, pageable));
    }

    // 4. Staff trả lời tin nhắn
    @PostMapping("/admin/conversations/{conversationId}/messages")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Void> staffReply(
            Authentication auth,
            @PathVariable UUID conversationId,
            @RequestBody SendMessageRequestDTO request
    ) {
        User user = (User) auth.getPrincipal();
        chatService.staffReply(conversationId, user.getUserId(), request.getContent());
        return ResponseEntity.ok().build();
    }

    // 5. Nhận việc (Assign)
    @PatchMapping("/admin/conversations/{conversationId}/assign")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Void> assignConversation(
            Authentication auth,
            @PathVariable UUID conversationId,
            @RequestBody(required = false) AssignConversationRequestDTO request
    ) {
        User currentUser = (User) auth.getPrincipal();
        UUID targetStaffId = (request != null) ? request.getStaffId() : null;
        if (currentUser.getRole() == Role.STAFF && targetStaffId != null && !targetStaffId.equals(currentUser.getUserId())) {
            return ResponseEntity.status(403).build();
        }
        try {
            chatService.assignConversation(conversationId, currentUser.getUserId(), targetStaffId);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).build();
        }
    }

    @PatchMapping("/admin/conversations/{conversationId}/finish")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Void> finishConversation(
            Authentication auth,
            @PathVariable UUID conversationId
    ) {
        User user = (User) auth.getPrincipal();
        chatService.finishConversation(conversationId, user.getUserId());
        return ResponseEntity.ok().build();
    }

    // 7. Thống kê
    @GetMapping("/admin/stats")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<ChatStatsDTO> getStats(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(chatService.getStats(user.getUserId()));
    }

    @PatchMapping("/admin/conversations/{conversationId}/revoke")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')") //
    public ResponseEntity<Void> revokeConversation(@PathVariable UUID conversationId) {
        chatService.revokeConversation(conversationId);
        return ResponseEntity.ok().build();
    }
}