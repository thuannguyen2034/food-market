package com.foodmarket.food_market.product.service;

import com.foodmarket.food_market.product.dto.TagDTO;
import com.foodmarket.food_market.product.dto.TagSaveRequestDTO;
import java.util.List;

public interface TagService {

    List<TagDTO> getAllTags();

    TagDTO getTagById(Long id);

    TagDTO createTag(TagSaveRequestDTO request);

    TagDTO updateTag(Long id, TagSaveRequestDTO request);

    void deleteTag(Long id);
}