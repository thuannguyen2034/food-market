package com.foodmarket.food_market.auth.controller;

import com.foodmarket.food_market.auth.dto.request.*;

import com.foodmarket.food_market.auth.dto.response.AccessTokenResponseDTO;
import com.foodmarket.food_market.auth.dto.response.AuthResponseDTO;
import com.foodmarket.food_market.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders; 
import org.springframework.http.ResponseCookie; 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration; 

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    
    private ResponseCookie createRefreshTokenCookie(String token) {
        long REFRESH_TOKEN_DURATION_DAYS = 7;
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(false) 
                .path("/")     
                .maxAge(Duration.ofDays(REFRESH_TOKEN_DURATION_DAYS))
                .sameSite("Strict") 
                .build();
    }

    
    private ResponseCookie createClearCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) 
                .path("/")
                .maxAge(0) 
                .sameSite("Strict")
                .build();
    }

    
    @PostMapping("/register")
    public ResponseEntity<AccessTokenResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request
    ) {
        AuthResponseDTO authDto = authService.register(request);

        ResponseCookie refreshTokenCookie = createRefreshTokenCookie(authDto.getRefreshToken());

        AccessTokenResponseDTO body = AccessTokenResponseDTO.builder()
                .token(authDto.getToken())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(body);
    }

    
    @PostMapping("/login")
    public ResponseEntity<AccessTokenResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request
    ) {
        AuthResponseDTO authDto = authService.login(request);
        ResponseCookie refreshTokenCookie = createRefreshTokenCookie(authDto.getRefreshToken());
        AccessTokenResponseDTO body = AccessTokenResponseDTO.builder()
                .token(authDto.getToken())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(body);
    }

    
    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponseDTO> refreshToken(
            @CookieValue(name = "refreshToken") String refreshToken
    ) {
        AuthResponseDTO authDto = authService.refreshToken(refreshToken);
        ResponseCookie refreshTokenCookie = createRefreshTokenCookie(authDto.getRefreshToken());
        AccessTokenResponseDTO body = AccessTokenResponseDTO.builder()
                .token(authDto.getToken())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(body);
    }

    
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }

        ResponseCookie clearCookie = createClearCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body("Đăng xuất thành công!");
    }

    
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request
    ) {
        authService.forgotPassword(request);

        // Luôn trả về 200 OK, ngay cả khi email không tồn tại
        return ResponseEntity.ok("Nếu email của bạn tồn tại trong hệ thống, chúng tôi đã gửi một link reset mật khẩu.");
    }

   
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Mật khẩu đã được reset thành công!");
    }
}