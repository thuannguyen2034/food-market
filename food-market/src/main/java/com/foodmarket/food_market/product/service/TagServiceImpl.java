package com.foodmarket.food_market.product.service;

import com.foodmarket.food_market.product.dto.TagDTO;
import com.foodmarket.food_market.product.dto.TagSaveRequestDTO;
import com.foodmarket.food_market.product.model.Tag;
import com.foodmarket.food_market.product.repository.TagRepository;
import com.github.slugify.Slugify;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final Slugify slugify = Slugify.builder().transliterator(true).build();
    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<TagDTO> getAllTags() {
        return tagRepository.findAll().stream()
                .map(TagDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public TagDTO getTagById(Long id) {
        Tag tag = findTagById(id);
        return TagDTO.fromEntity(tag);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TagDTO createTag(TagSaveRequestDTO request) {
        // 1. Chuẩn hóa tên tag (bỏ dấu cách, viết thường)
        String normalizedName = request.getName().trim().toLowerCase();

        // 2. Kiểm tra tên đã tồn tại chưa
        tagRepository.findByName(normalizedName).ifPresent(tag -> {
            throw new IllegalArgumentException("Tag với tên '" + tag.getName() + "' đã tồn tại.");
        });

        // 3. Tạo mới
        Tag newTag = new Tag(normalizedName,generateUniqueSlug(normalizedName, null));
        Tag savedTag = tagRepository.save(newTag);

        return TagDTO.fromEntity(savedTag);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public TagDTO updateTag(Long id, TagSaveRequestDTO request) {
        // 1. Tìm tag
        Tag tag = findTagById(id);

        // 2. Chuẩn hóa tên mới
        String normalizedName = request.getName().trim().toLowerCase();

        // 3. Kiểm tra tên mới (nếu có thay đổi) có bị trùng với tag khác không
        if (!tag.getName().equals(normalizedName)) {
            tagRepository.findByName(normalizedName).ifPresent(existingTag -> {
                throw new IllegalArgumentException("Tên tag '" + existingTag.getName() + "' đã bị trùng.");
            });
            tag.setName(normalizedName);// Chỉ cập nhật nếu tên hợp lệ
            tag.setSlug(generateUniqueSlug(normalizedName, id));
        }

        Tag updatedTag = tagRepository.save(tag);
        return TagDTO.fromEntity(updatedTag);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void deleteTag(Long id) {
        Tag tag = findTagById(id);

        // QUY TẮC NGHIỆP VỤ: Không cho xóa tag đang được gán cho sản phẩm.
        // Ghi chú: `tag.getProducts()` có thể gây N+1 nếu không cẩn thận,
        // nhưng ở đây nó được bảo vệ bởi @Transactional và chỉ để kiểm tra isEmpty().
        if (!tag.getProducts().isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa tag. Tag đang được gán cho "
                    + tag.getProducts().size() + " sản phẩm.");
        }

        // Nếu không gán cho sản phẩm nào, cho phép xóa
        tagRepository.delete(tag);
    }

    // --- Private Helper ---
    private Tag findTagById(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tag với ID: " + id));
    }
    private String generateUniqueSlug(String name, Long excludeId) {
        String baseSlug = slugify.slugify(name);
        String slug = baseSlug;
        int counter = 1;
        while (true) {
            Optional<Tag> existing = tagRepository.findBySlug(slug);
            if (existing.isEmpty() || (excludeId != null && existing.get().getId().equals(excludeId))) {
                return slug;
            }
            slug = baseSlug + "-" + counter++;
        }
    }
}