package com.foodmarket.food_market.auth.model;

import com.foodmarket.food_market.user.model.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Token là 1 chuỗi UUID duy nhất, không được trùng lặp
    @Column(nullable = false, unique = true)
    private String token;

    // Hết hạn khi nào
    @Column(nullable = false)
    private Instant expiryDate;

    // Token này của User nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false)
    private User user;
}