package com.foodmarket.food_market.auth.service;

import com.foodmarket.food_market.auth.dto.request.*;
import com.foodmarket.food_market.auth.dto.response.AuthResponseDTO;

public interface AuthService {

    AuthResponseDTO register(RegisterRequestDTO request);

    AuthResponseDTO login(LoginRequestDTO request);
    AuthResponseDTO refreshToken(String refreshTokenString);
    void forgotPassword(ForgotPasswordRequestDTO request);

    /**
     * Xử lý "reset mật khẩu".
     * Xác thực token và cập nhật mật khẩu mới.
     * @param request DTO chứa token và mật khẩu mới
     */
    void resetPassword(ResetPasswordRequestDTO request);
    /**
     * Xử lý logic đăng xuất.
     * Vô hiệu hóa Refresh Token.
     * @param request DTO chứa Refresh Token
     */
    void logout(String refreshTokenString);
}