package com.foodmarket.food_market.inventory.service;

import com.foodmarket.food_market.inventory.dto.*;
import com.foodmarket.food_market.inventory.exception.InsufficientStockException;
import com.foodmarket.food_market.inventory.model.InventoryAdjustment;
import com.foodmarket.food_market.inventory.model.InventoryBatch;
import com.foodmarket.food_market.inventory.repository.InventoryAdjustmentRepository;
import com.foodmarket.food_market.inventory.repository.InventoryBatchRepository;
import com.foodmarket.food_market.product.repository.ProductRepository;
import com.foodmarket.food_market.product.service.ProductServiceImpl;
import com.foodmarket.food_market.user.repository.UserRepository;
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
@RequiredArgsConstructor 
public class InventoryServiceImpl implements InventoryService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryAdjustmentRepository inventoryAdjustmentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryBatchDTO> getBatchesForProduct(Long productId, boolean includeZeroQuantity, Pageable pageable) {
        Specification<InventoryBatch> spec = InventoryBatchSpecification.byProductId(productId);
        if (!includeZeroQuantity) {
            spec = spec.and(InventoryBatchSpecification.hasQuantityGreaterThan(0));
        }
        if (pageable.getSort().isEmpty()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("expirationDate").ascending());
        }
        Page<InventoryBatch> batchesPage = inventoryBatchRepository.findAll(spec, pageable);
        return batchesPage.map(inventoryBatch -> {
            String productName = productRepository.findNameById(inventoryBatch.getProductId());
            return InventoryBatchDTO.fromEntity(inventoryBatch, productName);
        });
    }


    @Override
    @Transactional(readOnly = true)
    public InventoryBatchDTO getBatchDetails(Long batchId) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new EntityNotFoundException("InventoryBatch not found with ID: " + batchId));

        List<InventoryAdjustment> adjustments = inventoryAdjustmentRepository.findByInventoryBatchOrderByCreatedAtDesc(batch);
        List<InventoryAdjustmentDTO> adjustmentDTOs = adjustments.stream()
                .map(InventoryAdjustmentDTO::fromEntity)
                .toList();
        String productName = productRepository.findNameById(batch.getProductId());
        return InventoryBatchDTO.fromEntity(batch, adjustmentDTOs, productName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryBatchDTO> getInventoryBatches(
            Pageable pageable,
            Integer daysThreshold) {   

        Specification<InventoryBatch> spec = Specification.allOf();

        if (daysThreshold != null) {
            if (daysThreshold >= 0) {
                spec = spec.and(InventoryBatchSpecification.expiringWithinDays(daysThreshold));
            } else if (daysThreshold == -1) {
                spec = spec.and(InventoryBatchSpecification.expired());
            }
        }

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

    @Override
    @Transactional
    public void destroyBatch(Long batchId, String reason, String userId) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new EntityNotFoundException("InventoryBatch not found with ID: " + batchId));

        if (batch.getCurrentQuantity() <= 0) {
            throw new IllegalStateException("Batch already has zero quantity: " + batchId);
        }

        InventoryAdjustment adjustment = new InventoryAdjustment();
        adjustment.setInventoryBatch(batch);
        adjustment.setAdjustedBy(userRepository.getReferenceById(UUID.fromString(userId)));
        adjustment.setAdjustmentQuantity(-batch.getCurrentQuantity()); 
        adjustment.setReason("DESTROY: " + reason);  
        inventoryAdjustmentRepository.save(adjustment);

        batch.setCurrentQuantity(0);
        inventoryBatchRepository.save(batch);
    }

   
    @Override
    @Transactional
    public InventoryBatchDTO importStock(ImportStockRequestDTO requestDTO, UUID currentAdminId) {
        InventoryBatch newBatch = new InventoryBatch();
        newBatch.setProductId(requestDTO.getProductId());
        newBatch.setBatchCode(requestDTO.getBatchCode());
        newBatch.setExpirationDate(requestDTO.getExpirationDate());
        newBatch.setQuantityReceived(requestDTO.getQuantityReceived());
        // Khi mới nhập, số lượng hiện tại = số lượng nhận
        newBatch.setCurrentQuantity(requestDTO.getQuantityReceived());
        inventoryBatchRepository.save(newBatch);
        InventoryAdjustment adjustment = new InventoryAdjustment();
        adjustment.setInventoryBatch(newBatch);
        adjustment.setAdjustmentQuantity(requestDTO.getQuantityReceived());
        adjustment.setReason("Nhập hàng mới");
        adjustment.setAdjustedBy(userRepository.getReferenceById(currentAdminId));
        inventoryAdjustmentRepository.save(adjustment);
        String productName = productRepository.findNameById(newBatch.getProductId());
        return InventoryBatchDTO.fromEntity(newBatch, productName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryAdjustmentDTO> getAdjustmentsForBatch(Long batchId, Pageable pageable) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new EntityNotFoundException("InventoryBatch not found with ID: " + batchId));
        Page<InventoryAdjustment> adjustmentsPage = inventoryAdjustmentRepository.findByInventoryBatchOrderByCreatedAtDesc(batch, pageable);
        return adjustmentsPage.map(InventoryAdjustmentDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryAdjustmentDTO> getAllAdjustments(Pageable pageable) {
        return inventoryAdjustmentRepository.findAll(pageable).map(InventoryAdjustmentDTO::fromEntity);
    }

    @Override
    @Transactional 
    public List<AllocatedBatchDTO> allocateForOrder(Long productId, int quantityToAllocate, UUID userId, UUID orderId) {
        if (quantityToAllocate <= 0) {
            throw new IllegalArgumentException("Số lượng sản phẩm muốn lấy phải lớn hơn 0");
        }

        List<InventoryBatch> batches = inventoryBatchRepository
                .findStillHasProductByProductIdOrderByExpirationDateAsc(productId);

        int totalAvailable = batches.stream().mapToInt(InventoryBatch::getCurrentQuantity).sum();
        if (totalAvailable < quantityToAllocate) {
            String productName = productRepository.findNameById(productId);
            throw new InsufficientStockException(productName, quantityToAllocate, totalAvailable);
        }

        List<AllocatedBatchDTO> allocations = new ArrayList<>();
        int remainingQuantityToAllocate = quantityToAllocate;

        for (InventoryBatch batch : batches) {
            if (remainingQuantityToAllocate <= 0) {
                break;
            }

            int quantityToTake = Math.min(batch.getCurrentQuantity(), remainingQuantityToAllocate);

            InventoryAdjustment adjustment = new InventoryAdjustment();
            adjustment.setInventoryBatch(batch);
            adjustment.setAdjustmentQuantity(-quantityToTake);
            adjustment.setReason("Trừ kho cho đơn hàng mã: " + orderId.toString());
            adjustment.setAdjustedBy(userRepository.getReferenceById(userId));
            inventoryAdjustmentRepository.save(adjustment);
            batch.setCurrentQuantity(batch.getCurrentQuantity() - quantityToTake);
            inventoryBatchRepository.save(batch);
            allocations.add(new AllocatedBatchDTO(batch, quantityToTake));

            remainingQuantityToAllocate -= quantityToTake;
        }
        if (remainingQuantityToAllocate > 0) {
            throw new InsufficientStockException("Failed to allocate full quantity. Race condition likely. Product ID: " + productId);
        }

        return allocations;
    }
    @Override
    @Transactional
    public void adjustStock(AdjustStockRequestDTO requestDTO) {
        
        InventoryBatch batch = inventoryBatchRepository.findById(requestDTO.getBatchId())
                .orElseThrow(() -> new EntityNotFoundException("InventoryBatch not found with ID: " + requestDTO.getBatchId()));

        int newQuantity = batch.getCurrentQuantity() + requestDTO.getAdjustmentQuantity();

        if (newQuantity < 0) {
            throw new IllegalArgumentException("Adjustment results in negative stock for batch ID: " + batch.getBatchId());
        }
        InventoryAdjustment adjustment = new InventoryAdjustment();
        adjustment.setInventoryBatch(batch);
        adjustment.setAdjustedBy(userRepository.getReferenceById(requestDTO.getAdjustedByUserId()));
        adjustment.setAdjustmentQuantity(requestDTO.getAdjustmentQuantity());
        adjustment.setReason(requestDTO.getReason());
        inventoryAdjustmentRepository.save(adjustment);

        batch.setCurrentQuantity(newQuantity);
        inventoryBatchRepository.save(batch);
    }

    
     
    @Override
    @Transactional(readOnly = true)
    public int getStockAvailability(Long productId) {
        return inventoryBatchRepository.findCurrentProductQuantity(productId);
    }


  
    @Override
    @Transactional(readOnly = true)
    public ProductStockInfoDTO getProductStockInfo(Long productId) {
        List<InventoryBatch> batches = inventoryBatchRepository
                .findStillHasProductByProductIdOrderByExpirationDateAsc(productId);

        if (batches.isEmpty()) {
            return new ProductStockInfoDTO(0, null);
        }
        int totalStock = batches.stream().mapToInt(InventoryBatch::getCurrentQuantity).sum();
        LocalDate soonestDate = batches.getFirst().getExpirationDate();

        return new ProductStockInfoDTO(totalStock, soonestDate);
    }

    @Override
    @Transactional
    public void restoreStock(Long batchId, int quantityToRestore, UUID userId, UUID orderId) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new EntityNotFoundException("Batch not found"));

        batch.setCurrentQuantity(batch.getCurrentQuantity() + quantityToRestore);
        inventoryBatchRepository.save(batch);

        InventoryAdjustment adjustment = new InventoryAdjustment();
        adjustment.setInventoryBatch(batch);
        adjustment.setReason("Cập nhật lại do đơn hàng bị huỷ, mã đơn: " + orderId.toString());
        adjustment.setAdjustmentQuantity(quantityToRestore);
        adjustment.setAdjustedBy(userRepository.getReferenceById(userId));
        inventoryAdjustmentRepository.save(adjustment);
    }
}