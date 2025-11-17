package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.product.dto.TagDTO;
import com.foodmarket.food_market.product.dto.TagSaveRequestDTO;
import com.foodmarket.food_market.product.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/tags") // <-- Base path mới cho admin
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // <-- Áp dụng security cho CẢ CLASS
public class AdminTagController {

    private final TagService tagService; // Vẫn dùng TagService chung

    /**
     * API 1 (Admin): Lấy tất cả tag
     * Dùng để hiển thị trong bảng quản lý tag.
     */
    @GetMapping
    public ResponseEntity<List<TagDTO>> getAllTagsForAdmin() {
        return ResponseEntity.ok(tagService.getAllTags());
    }

    /**
     * API 2 (Admin): Lấy chi tiết 1 tag
     * Dùng khi admin click "Sửa" để load data vào form.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TagDTO> getTagById(@PathVariable Long id) {
        return ResponseEntity.ok(tagService.getTagById(id));
    }

    /**
     * API 3 (Admin): Tạo tag mới
     */
    @PostMapping
    public ResponseEntity<TagDTO> createTag(
            @Valid @RequestBody TagSaveRequestDTO request) {

        TagDTO newTag = tagService.createTag(request);
        return new ResponseEntity<>(newTag, HttpStatus.CREATED);
    }

    /**
     * API 4 (Admin): Cập nhật tag
     */
    @PutMapping("/{id}")
    public ResponseEntity<TagDTO> updateTag(
            @PathVariable Long id,
            @Valid @RequestBody TagSaveRequestDTO request) {

        TagDTO updatedTag = tagService.updateTag(id, request);
        return ResponseEntity.ok(updatedTag);
    }

    /**
     * API 5 (Admin): Xóa tag
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build(); // 204 No Content
    }
}