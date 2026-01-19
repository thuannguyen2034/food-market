package com.foodmarket.food_market.auth.repository;

import com.foodmarket.food_market.auth.model.RefreshToken;
import com.foodmarket.food_market.user.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @Query("SELECT rt FROM RefreshToken rt JOIN FETCH rt.user u WHERE rt.token = :token")
    Optional<RefreshToken> findByToken(@Param("token") String token);

    void deleteByUser(User user);

}