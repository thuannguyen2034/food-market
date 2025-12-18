package com.foodmarket.food_market.inventory.service;

import com.foodmarket.food_market.inventory.dto.*;
import com.foodmarket.food_market.inventory.exception.InsufficientStockException;
import com.foodmarket.food_market.inventory.model.InventoryAdjustment;
import com.foodmarket.food_market.inventory.model.InventoryBatch;
import com.foodmarket.food_market.inventory.repository.InventoryAdjustmentRepository;
import com.foodmarket.food_market.inventory.repository.InventoryBatchRepository;
import com.foodmarket.food_market.product.repository.ProductRepository;
import com.foodmarket.food_market.product.service.ProductServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor // Tự động tiêm (inject) repository qua constructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryAdjustmentRepository inventoryAdjustmentRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryBatchDTO> getBatchesForProduct(Long productId, boolean includeZeroQuantity, Pageable pageable) {
        // Specification động để filter
        Specification<InventoryBatch> spec = InventoryBatchSpecification.byProductId(productId);
        if (!includeZeroQuantity) {
            spec = spec.and(InventoryBatchSpecification.hasQuantityGreaterThan(0));
        }
        // Thêm sort mặc định nếu pageable không chỉ định: order by expirationDate ASC
        if (pageable.getSort().isEmpty()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("expirationDate").ascending());
        }
        Page<InventoryBatch> batchesPage = inventoryBatchRepository.findAll(spec, pageable);
        return batchesPage.map(inventoryBatch ->{
            String productName = productRepository.findNameById(inventoryBatch.getProductId());
            return InventoryBatchDTO.fromEntity(inventoryBatch, productName);
        });
    }


    @Override
    @Transactional(readOnly = true)
    public InventoryBatchDTO getBatchDetails(Long batchId) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new EntityNotFoundException("InventoryBatch not found with ID: " + batchId));

        // Lấy list adjustments (giả sử repo có method findByInventoryBatchOrderByAdjustmentDateDesc)
        List<InventoryAdjustment> adjustments = inventoryAdjustmentRepository.findByInventoryBatchOrderByCreatedAtDesc(batch);
        List<InventoryAdjustmentDTO> adjustmentDTOs = adjustments.stream()
                .map(InventoryAdjustmentDTO::fromEntity)
                .toList();
        // Lấy tên sản phẩm
        String productName = productRepository.findNameById(batch.getProductId());
        return InventoryBatchDTO.fromEntity(batch, adjustmentDTOs, productName);
    }

    // Cao ưu tiên 2: getAllBatches (sửa thành int daysThreshold để dễ filter < now + days)
    @Override
    @Transactional(readOnly = true)
    public Page<InventoryBatchDTO> getInventoryBatches(
            Pageable pageable,
            Integer daysThreshold) {   // Integer thay vì int để có thể null = "không filter"

        Specification<InventoryBatch> spec = Specification.allOf();

        // Chỉ filter nếu có truyền daysThreshold
        if (daysThreshold != null) {
            if (daysThreshold >= 0) {
                spec = spec.and(InventoryBatchSpecification.expiringWithinDays(daysThreshold));
            } else if (daysThreshold == -1) {
                spec = spec.and(InventoryBatchSpecification.expired());
            }
        }
        // Nếu daysThreshold == null → lấy tất cả (không filter)

        // Sort mặc định: gần hết hạn trước
        if (pageable.getSort().isEmpty()) {
            pageable = PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    Sort.by("expirationDate").ascending()
            );
        }

        Page<InventoryBatch> page = inventoryBatchRepository.findAll(spec, pageable);
        return page.map(inventoryBatch -> {
            String productName = productRepository.findNameById(inventoryBatch.getProductId());
            return InventoryBatchDTO.fromEntity(inventoryBatch, productName);
        });
    }

    // Cao ưu tiên 3: destroyBatch
    @Override
    @Transactional
    public void destroyBatch(Long batchId, String reason, String userId) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new EntityNotFoundException("InventoryBatch not found with ID: " + batchId));

        if (batch.getCurrentQuantity() <= 0) {
            throw new IllegalStateException("Batch already has zero quantity: " + batchId);
        }

        // Tạo adjustment đặc biệt cho destroy (quantity = -currentQuantity)
        InventoryAdjustment adjustment = new InventoryAdjustment();
        adjustment.setInventoryBatch(batch);
        adjustment.setAdjustedByUserId(UUID.fromString(userId));
        adjustment.setAdjustmentQuantity(-batch.getCurrentQuantity());  // Giảm hết
        adjustment.setReason("DESTROY: " + reason);  // Type đặc biệt
        inventoryAdjustmentRepository.save(adjustment);

        // Set quantity = 0
        batch.setCurrentQuantity(0);
        inventoryBatchRepository.save(batch);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public InventoryBatchDTO importStock(ImportStockRequestDTO requestDTO) {
        InventoryBatch newBatch = new InventoryBatch();
        newBatch.setProductId(requestDTO.getProductId());
        newBatch.setBatchCode(requestDTO.getBatchCode());
        newBatch.setExpirationDate(requestDTO.getExpirationDate());
        newBatch.setQuantityReceived(requestDTO.getQuantityReceived());

        // Khi mới nhập, số lượng hiện tại = số lượng nhận
        newBatch.setCurrentQuantity(requestDTO.getQuantityReceived());
        inventoryBatchRepository.save(newBatch);
        String productName = productRepository.findNameById(newBatch.getProductId());
        return InventoryBatchDTO.fromEntity(newBatch, productName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryAdjustmentDTO> getAdjustmentsForBatch(Long batchId, Pageable pageable) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new EntityNotFoundException("InventoryBatch not found with ID: " + batchId));
        // Giả sử repo có method findByInventoryBatchId (thêm @Query nếu cần)
        Page<InventoryAdjustment> adjustmentsPage = inventoryAdjustmentRepository.findByInventoryBatchOrderByCreatedAtDesc(batch, pageable);

        return adjustmentsPage.map(InventoryAdjustmentDTO::fromEntity);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Đây là logic FEFO (First-Expired, First-Out) cốt lõi.
     */
    @Override
    @Transactional // Rất quan trọng, phải nằm trong Transaction
    public List<AllocatedBatchDTO> allocateForOrder(Long productId, int quantityToAllocate, UUID userId, UUID orderId) {
        if (quantityToAllocate <= 0) {
            throw new IllegalArgumentException("Số lượng sản phẩm muốn lấy phải lớn hơn 0");
        }

        // 1. Lấy tất cả các lô còn hàng, SẮP XẾP THEO HSD TĂNG DẦN (FEFO)
        List<InventoryBatch> batches = inventoryBatchRepository
                .findStillHasProductByProductIdOrderByExpirationDateAsc(productId);

        // 2. Kiểm tra tổng tồn kho
        int totalAvailable = batches.stream().mapToInt(InventoryBatch::getCurrentQuantity).sum();
        if (totalAvailable < quantityToAllocate) {
            String productName = productRepository.findNameById(productId);
            throw new InsufficientStockException(productName, quantityToAllocate,totalAvailable);
        }

        // 3. Chuẩn bị danh sách trả về
        List<AllocatedBatchDTO> allocations = new ArrayList<>();
        int remainingQuantityToAllocate = quantityToAllocate;

        // 4. Bắt đầu trừ kho theo vòng lặp
        for (InventoryBatch batch : batches) {
            if (remainingQuantityToAllocate <= 0) {
                break; // Đã phân bổ đủ
            }

            int quantityToTake = Math.min(batch.getCurrentQuantity(), remainingQuantityToAllocate);

            // Cập nhật lô
            InventoryAdjustment adjustment = new InventoryAdjustment();
            adjustment.setInventoryBatch(batch);
            adjustment.setAdjustmentQuantity(-quantityToTake);
            adjustment.setReason("Trừ kho cho đơn hàng mã: " + orderId.toString());
            adjustment.setAdjustedByUserId(userId);
            inventoryAdjustmentRepository.save(adjustment);
            batch.setCurrentQuantity(batch.getCurrentQuantity() - quantityToTake);
            inventoryBatchRepository.save(batch);
            // Thêm vào danh sách trả về
            allocations.add(new AllocatedBatchDTO(batch, quantityToTake));

            remainingQuantityToAllocate -= quantityToTake;
        }

        // 5. (Double-check)
        if (remainingQuantityToAllocate > 0) {
            throw new InsufficientStockException("Failed to allocate full quantity. Race condition likely. Product ID: " + productId);
        }

        // 6. Trả về danh sách các lô đã dùng
        return allocations;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void adjustStock(AdjustStockRequestDTO requestDTO) {
        // 1. Tìm lô hàng (batch)
        InventoryBatch batch = inventoryBatchRepository.findById(requestDTO.getBatchId())
                .orElseThrow(() -> new EntityNotFoundException("InventoryBatch not found with ID: " + requestDTO.getBatchId()));

        int newQuantity = batch.getCurrentQuantity() + requestDTO.getAdjustmentQuantity();

        // 2. Kiểm tra tính hợp lệ
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Adjustment results in negative stock for batch ID: " + batch.getBatchId());
        }

        // 3. Tạo phiếu điều chỉnh (để lưu vết)
        InventoryAdjustment adjustment = new InventoryAdjustment();
        adjustment.setInventoryBatch(batch);
        adjustment.setAdjustedByUserId(requestDTO.getAdjustedByUserId());
        adjustment.setAdjustmentQuantity(requestDTO.getAdjustmentQuantity());
        adjustment.setReason(requestDTO.getReason());
        inventoryAdjustmentRepository.save(adjustment);

        // 4. Cập nhật số lượng thực tế của lô
        batch.setCurrentQuantity(newQuantity);
        inventoryBatchRepository.save(batch);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public int getStockAvailability(Long productId) {
        // Sử dụng phương thức repository đã định nghĩa
       return inventoryBatchRepository.findCurrentProductQuantity(productId);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public ProductStockInfoDTO getProductStockInfo(Long productId) {
        // Lấy tất cả các lô còn hàng, sắp xếp FEFO
        List<InventoryBatch> batches = inventoryBatchRepository
                .findStillHasProductByProductIdOrderByExpirationDateAsc(productId);

        if (batches.isEmpty()) {
            return new ProductStockInfoDTO(0, null);
        }
        // 1. Tính tổng tồn kho
        int totalStock = batches.stream().mapToInt(InventoryBatch::getCurrentQuantity).sum();
        LocalDate soonestDate = batches.getFirst().getExpirationDate();

        return new ProductStockInfoDTO(totalStock, soonestDate);
    }

    @Override
    public long countExpiringBatches(LocalDate thresholdDate) {
        return inventoryBatchRepository.countExpiringBatches(thresholdDate);
    }


    @Override
    @Transactional
    public void restoreStock(Long batchId, int quantityToRestore, UUID userId, UUID orderId) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new EntityNotFoundException("Batch not found"));

        // Cộng lại kho
        batch.setCurrentQuantity(batch.getCurrentQuantity() + quantityToRestore);
        inventoryBatchRepository.save(batch);

        // (Option) Lưu log Adjustment để biết tại sao tự nhiên kho tăng lên
        InventoryAdjustment adjustment = new InventoryAdjustment();
        adjustment.setInventoryBatch(batch);
        adjustment.setReason("Cập nhật lại do đơn hàng bị huỷ, mã đơn: " + orderId.toString());
        adjustment.setAdjustmentQuantity(quantityToRestore);
        adjustment.setAdjustedByUserId(userId);
        inventoryAdjustmentRepository.save(adjustment);
    }
}