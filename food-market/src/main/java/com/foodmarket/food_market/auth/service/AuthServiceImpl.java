package com.foodmarket.food_market.auth.service;

import com.foodmarket.food_market.auth.dto.request.*;
import com.foodmarket.food_market.auth.dto.response.AuthResponseDTO;
import com.foodmarket.food_market.auth.model.PasswordResetToken;
import com.foodmarket.food_market.auth.model.RefreshToken;
import com.foodmarket.food_market.auth.repository.PasswordResetTokenRepository;
import com.foodmarket.food_market.auth.security.JwtService;
import com.foodmarket.food_market.shared.service.EmailService;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.model.enums.Role;
import com.foodmarket.food_market.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    @Override
    @Transactional 
    public AuthResponseDTO register(RegisterRequestDTO request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại đã tồn tại");
        }

        User newUser = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword())) 
                .role(Role.CUSTOMER) 
                .build();

        User savedUser = userRepository.save(newUser);

        String jwtToken = jwtService.generateToken(savedUser);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getUserId());
        String emailSubject = "Chào mừng bạn đến với Food Market!";
        String emailText = "Xin chào " + savedUser.getFullName() + ",\n\n"
                + "Cảm ơn bạn đã đăng ký tài khoản tại Food Market.";
        emailService.sendEmail(savedUser.getEmail(), emailSubject, emailText);
        return AuthResponseDTO.builder()
                .token(jwtToken) 
                .refreshToken(refreshToken.getToken()) 
                .build();
    }

    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại.")); 
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getUserId());
        extraClaims.put("fullName", user.getFullName());
        extraClaims.put("role", user.getRole().name());
        String jwtToken = jwtService.generateToken(extraClaims,user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUserId());

        return AuthResponseDTO.builder()
                .token(jwtToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    @Override
    public AuthResponseDTO refreshToken(String refreshTokenString) {
        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenString)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Refresh token!"));

        refreshTokenService.verifyExpiration(refreshToken);

        refreshTokenService.deleteToken(refreshToken);

        User user = refreshToken.getUser();

        String newAccessToken = jwtService.generateToken(user);

        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getUserId());

        return AuthResponseDTO.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .build();
    }
    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);
        if (user != null) {
            Optional<PasswordResetToken> findResetToken = passwordResetTokenRepository.findByUser(user);
            if (findResetToken.isPresent()) {
                if(findResetToken.get().getExpiryDate().minusMillis(600000).isAfter(Instant.now())){
                    return;
                }
                    passwordResetTokenRepository.deleteById(findResetToken.get().getId());
                    passwordResetTokenRepository.flush();
            }
            PasswordResetToken resetToken = new PasswordResetToken(user);
            passwordResetTokenRepository.save(resetToken);

            String resetLink = "http://localhost:3000/reset-password?token=" + resetToken.getToken();
            String subject = "Yêu cầu Reset Mật khẩu Food Market";
            String text = "Xin chào " + user.getFullName() + ",\n\n"
                    + "Chúng tôi nhận được yêu cầu reset mật khẩu cho tài khoản của bạn.\n"
                    + "Vui lòng nhấp vào link dưới đây để đặt lại mật khẩu (link có hiệu lực trong 15 phút):\n"
                    + resetLink + "\n\n"
                    + "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.";

            emailService.sendEmail(user.getEmail(), subject, text);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequestDTO request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Token reset không hợp lệ!"));

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken); 
            throw new IllegalArgumentException("Token reset đã hết hạn!");
        }

        User user = resetToken.getUser();

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
        String subject = "Thông báo: Mật khẩu của bạn đã được reset";
        String text = "Xin chào " + user.getFullName() + ",\n\n"
                + "Mật khẩu của bạn tại Food Market vừa được reset thành công.";
        emailService.sendEmail(user.getEmail(), subject, text);
    }
    @Override
    public void logout(String refreshTokenString) {
        refreshTokenService.deleteByToken(refreshTokenString);
    }
}
