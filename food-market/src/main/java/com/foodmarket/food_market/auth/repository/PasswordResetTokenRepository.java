package com.foodmarket.food_market.auth.repository;

import com.foodmarket.food_market.auth.model.PasswordResetToken;
import com.foodmarket.food_market.user.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUser(User user);
}