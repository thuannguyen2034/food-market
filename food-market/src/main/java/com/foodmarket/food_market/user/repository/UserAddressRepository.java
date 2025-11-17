package com.foodmarket.food_market.user.repository;

import com.foodmarket.food_market.user.model.entity.UserAddress; // (File này bạn phải tạo)
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    // Check địa chỉ có thuộc user không
    Optional<UserAddress> findByIdAndUser_UserId(Long id, UUID userId);
    /**
     * Dùng để lấy danh sách địa chỉ của user
     */
    List<UserAddress> findByUser_UserId(UUID userId);
}