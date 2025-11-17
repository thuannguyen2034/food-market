package com.foodmarket.food_market.auth.controller;

import com.foodmarket.food_market.auth.dto.request.*;
// IMPORT DTO MỚI
import com.foodmarket.food_market.auth.dto.response.AccessTokenResponseDTO;
import com.foodmarket.food_market.auth.dto.response.AuthResponseDTO;
import com.foodmarket.food_market.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders; // IMPORT MỚI
import org.springframework.http.ResponseCookie; // IMPORT MỚI
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration; // IMPORT MỚI

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Helper: Tạo HttpOnly Cookie cho Refresh Token
     */
    private ResponseCookie createRefreshTokenCookie(String token) {
        // Thời gian sống của Refresh Token (ví dụ: 7 ngày)
        long REFRESH_TOKEN_DURATION_DAYS = 7;
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(false) // Đặt là TRUE ở môi trường Production (HTTPS)
                .path("/")     // Áp dụng cho toàn bộ domain
                .maxAge(Duration.ofDays(REFRESH_TOKEN_DURATION_DAYS))
                .sameSite("Strict") // Chống CSRF
                .build();
    }

    /**
     * Helper: Tạo Cookie "xóa" (dùng khi logout)
     */
    private ResponseCookie createClearCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // Đặt là TRUE ở môi trường Production (HTTPS)
                .path("/")
                .maxAge(0) // Hết hạn ngay lập tức
                .sameSite("Strict")
                .build();
    }

    /**
     * API Endpoint cho việc đăng ký
     * Trả về: AccessToken (body) & RefreshToken (cookie)
     */
    @PostMapping("/register")
    public ResponseEntity<AccessTokenResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request
    ) {
        // 1. Service trả về cả 2 token
        AuthResponseDTO authDto = authService.register(request);

        // 2. Tạo cookie cho Refresh Token
        ResponseCookie refreshTokenCookie = createRefreshTokenCookie(authDto.getRefreshToken());

        // 3. Tạo body CHỈ chứa Access Token
        AccessTokenResponseDTO body = AccessTokenResponseDTO.builder()
                .token(authDto.getToken())
                .build();

        // 4. Trả về response
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(body);
    }

    /**
     * API Endpoint cho việc đăng nhập
     * Trả về: AccessToken (body) & RefreshToken (cookie)
     */
    @PostMapping("/login")
    public ResponseEntity<AccessTokenResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request
    ) {
        // Logic tương tự register
        AuthResponseDTO authDto = authService.login(request);
        ResponseCookie refreshTokenCookie = createRefreshTokenCookie(authDto.getRefreshToken());
        AccessTokenResponseDTO body = AccessTokenResponseDTO.builder()
                .token(authDto.getToken())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(body);
    }

    /**
     * API Endpoint để "làm mới" Access Token
     * Đọc: RefreshToken (cookie)
     * Trả về: AccessToken (body) & RefreshToken MỚI (cookie)
     */
    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponseDTO> refreshToken(
            // Đọc cookie thay vì body
            @CookieValue(name = "refreshToken") String refreshToken
    ) {
        // Service giờ nhận String
        AuthResponseDTO authDto = authService.refreshToken(refreshToken);

        // Tạo cookie cho Refresh Token MỚI (Token Rotation)
        ResponseCookie refreshTokenCookie = createRefreshTokenCookie(authDto.getRefreshToken());
        AccessTokenResponseDTO body = AccessTokenResponseDTO.builder()
                .token(authDto.getToken())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(body);
    }

    /**
     * API Endpoint cho việc "Đăng xuất".
     * Đọc: RefreshToken (cookie)
     * Trả về: Cookie rỗng (để xóa)
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            // Đọc cookie thay vì body
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }

        // Luôn trả về cookie "clear" để xóa ở phía client
        ResponseCookie clearCookie = createClearCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body("Đăng xuất thành công!");
    }

    /**
     * API Endpoint cho việc "Quên Mật khẩu".
     * (Không cần đăng nhập)
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request
    ) {
        authService.forgotPassword(request);

        // Luôn trả về 200 OK, ngay cả khi email không tồn tại
        // Đây là biện pháp bảo mật để không lộ thông tin
        return ResponseEntity.ok("Nếu email của bạn tồn tại trong hệ thống, chúng tôi đã gửi một link reset mật khẩu.");
    }

    /**
     * API Endpoint cho việc "Reset Mật khẩu".
     * (Không cần đăng nhập)
     */
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Mật khẩu đã được reset thành công!");
    }
}