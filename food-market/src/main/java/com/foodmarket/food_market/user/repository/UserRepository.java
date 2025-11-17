package com.foodmarket.food_market.user.repository;

import com.foodmarket.food_market.user.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

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


}