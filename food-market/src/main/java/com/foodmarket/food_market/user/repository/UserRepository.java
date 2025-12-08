package com.foodmarket.food_market.user.repository;

import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;


public interface UserRepository extends JpaRepository<User,UUID>, JpaSpecificationExecutor<User> {

    /**
     * Tìm kiếm user bằng email.
     * Rất quan trọng cho UserDetailsServiceImpl khi đăng nhập.
     */
    Optional<User> findByEmail(String email);

    /**
     * Kiểm tra xem email đã tồn tại hay chưa.
     * Hữu ích khi đăng ký.
     */
    boolean existsByEmail(String email);

    /**
     * Kiểm tra xem SĐT đã tồn tại hay chưa.
     * Hữu ích khi đăng ký.
     */
    boolean existsByPhone(String phone);

    // KPI: Đếm khách hàng đăng ký mới trong ngày
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :start AND :end")
    long countNewUsers(@Param("start") OffsetDateTime start,
                       @Param("end") OffsetDateTime end);

    // Đếm theo Role
    long countByRole(Role role);

    // Đếm user mới tạo sau thời điểm X
    long countByCreatedAtAfter(OffsetDateTime date);
}