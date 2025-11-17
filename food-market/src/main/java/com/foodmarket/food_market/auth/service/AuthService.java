package com.foodmarket.food_market.auth.service;

import com.foodmarket.food_market.auth.dto.request.*;
import com.foodmarket.food_market.auth.dto.response.AuthResponseDTO;

public interface AuthService {

    /**
     * Xử lý logic đăng ký user mới.
     *
     * @param request DTO chứa thông tin đăng ký
     * @return DTO chứa JWT token
     */
    AuthResponseDTO register(RegisterRequestDTO request);

    /**
     * Xử lý logic đăng nhập.
     *
     * @param request DTO chứa email và password
     * @return DTO chứa JWT token
     */
    AuthResponseDTO login(LoginRequestDTO request);
    AuthResponseDTO refreshToken(String refreshTokenString);
    /**
     * Xử lý yêu cầu "quên mật khẩu".
     * Tạo token reset và gửi email.
     * @param request DTO chứa email
     */
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