package com.foodmarket.food_market.product.service;

import com.foodmarket.food_market.product.dto.TagDTO;
import com.foodmarket.food_market.product.dto.TagSaveRequestDTO;
import java.util.List;

public interface TagService {

    /**
     * (Public) Lấy tất cả tag (ví dụ: cho tag cloud, bộ lọc).
     */
    List<TagDTO> getAllTags();

    /**
     * (Admin) Lấy chi tiết 1 tag bằng ID.
     */
    TagDTO getTagById(Long id);

    /**
     * (Admin) Tạo tag mới.
     */
    TagDTO createTag(TagSaveRequestDTO request);

    /**
     * (Admin) Cập nhật tên tag.
     */
    TagDTO updateTag(Long id, TagSaveRequestDTO request);

    /**
     * (Admin) Xóa một tag.
     */
    void deleteTag(Long id);
}