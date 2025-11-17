package com.foodmarket.food_market.product.controller;

import com.foodmarket.food_market.product.dto.TagDTO;
import com.foodmarket.food_market.product.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags") // <-- Base path public
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    /**
     * API 1: (Public) Lấy tất cả tag
     * Dùng cho bộ lọc, tag cloud...
     */
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<TagDTO>> getPublicAllTags() {
        return ResponseEntity.ok(tagService.getAllTags());
    }
}