package com.foodmarket.food_market.auth.service;

import com.foodmarket.food_market.auth.model.RefreshToken;
import com.foodmarket.food_market.auth.repository.RefreshTokenRepository;
import com.foodmarket.food_market.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${jwt.refresh-token.expiration-ms}")
    private Long refreshTokenDurationMs;

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }
    @Transactional
    public RefreshToken createRefreshToken(UUID userId) {
        // Xóa hết token cũ của user này nếu có (đảm bảo mỗi user chỉ có 1 refresh token)
        userRepository.findById(userId).ifPresent(refreshTokenRepository::deleteByUser);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy user")))
                .token(UUID.randomUUID().toString()) // Tạo 1 chuỗi UUID ngẫu nhiên
                .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs)) // Set hạn (7 ngày)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            // Token hết hạn -> Xóa khỏi DB và văng lỗi
            refreshTokenRepository.delete(token);
            throw new RuntimeException(token.getToken() +
                    " Refresh token đã hết hạn. Vui lòng đăng nhập lại!");
        }
        return token;
    }
    @Transactional
    public void deleteToken(RefreshToken token) {
        refreshTokenRepository.delete(token);
    }
   
    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.findByToken(token)
                .ifPresent(refreshTokenRepository::delete);
    }
}