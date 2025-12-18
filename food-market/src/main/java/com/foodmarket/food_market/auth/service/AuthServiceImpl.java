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

    // Tiêm các Bean chúng ta đã tạo từ trước
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    @Override
    @Transactional // Đảm bảo việc đăng ký là một "giao dịch" (tất cả hoặc không gì cả)
    public AuthResponseDTO register(RegisterRequestDTO request) {

        // 1. Kiểm tra xem email hoặc SĐT đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            // Sau này chúng ta sẽ dùng ExceptionHandler để bắt lỗi này
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại đã tồn tại");
        }

        // 2. Tạo User mới (Rich Domain Model)
        // Chúng ta dùng @Builder đã tạo trong Entity User
        User newUser = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword())) // Băm mật khẩu
                .role(Role.CUSTOMER) // Mặc định đăng ký là CUSTOMER
                .build();

        // 3. Lưu User vào DB
        // Do Entity User đã implement UserDetails, ta có thể dùng nó trực tiếp
        User savedUser = userRepository.save(newUser);

        // 4. Tạo JWT token từ user đã lưu
        String jwtToken = jwtService.generateToken(savedUser);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getUserId());

        // --- BƯỚC MỚI: GỬI EMAIL CHÀO MỪNG ---
        String emailSubject = "Chào mừng bạn đến với Food Market!";
        String emailText = "Xin chào " + savedUser.getFullName() + ",\n\n"
                + "Cảm ơn bạn đã đăng ký tài khoản tại Food Market.";
        emailService.sendEmail(savedUser.getEmail(), emailSubject, emailText);
        // --- KẾT THÚC BƯỚC MỚI ---
        return AuthResponseDTO.builder()
                .token(jwtToken) // Access Token (15 phút)
                .refreshToken(refreshToken.getToken()) // Refresh Token (7 ngày)
                .build();
    }

    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        // 1. Dùng authenticationManager để xác thực...
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        // 2. Nếu không văng lỗi, tức là xác thực thành công.
        // Tải lại user (vì entity User của ta implement UserDetails)
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại.")); // Lỗi này không nên xảy ra nếu authenticate thành công
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getUserId());
        extraClaims.put("fullName", user.getFullName());
        extraClaims.put("role", user.getRole().name());
        // 3. Tạo token
        String jwtToken = jwtService.generateToken(extraClaims,user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUserId());

        return AuthResponseDTO.builder()
                .token(jwtToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    @Override
    public AuthResponseDTO refreshToken(String refreshTokenString) {
        // 1. Tìm token trong DB
        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenString)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Refresh token!"));

        // 2. Kiểm tra xem token đã hết hạn chưa
        refreshTokenService.verifyExpiration(refreshToken);

        // 3. (Best Practice: Token Rotation) Xóa token cũ
        refreshTokenService.deleteToken(refreshToken);

        // 4. Lấy thông tin user
        User user = refreshToken.getUser();

        // 5. Tạo Access Token MỚI
        String newAccessToken = jwtService.generateToken(user);

        // 6. Tạo Refresh Token MỚI
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getUserId());

        return AuthResponseDTO.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .build();
    }
    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequestDTO request) {
        // 1. Tìm user bằng email
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);
        if (user != null) {
            // Check nếu user đã tạo yêu cầu reset password trước đó
            Optional<PasswordResetToken> findResetToken = passwordResetTokenRepository.findByUser(user);
            // Nếu có reset passwoed token rồi thì check nếu gửi quá 5 phút sẽ gửi lại
            if (findResetToken.isPresent()) {
                if(findResetToken.get().getExpiryDate().minusMillis(600000).isAfter(Instant.now())){
                    return;
                }
                    passwordResetTokenRepository.deleteById(findResetToken.get().getId());
                    passwordResetTokenRepository.flush();
            }
            // 2. Tạo PasswordResetToken (Hàm khởi tạo tự set token và expiry date)
            PasswordResetToken resetToken = new PasswordResetToken(user);

            // 3. Lưu token vào DB
            passwordResetTokenRepository.save(resetToken);

            // 4. Tạo link reset (Đây là link của Front-end)
            String resetLink = "http://localhost:3000/reset-password?token=" + resetToken.getToken();

            // 5. Gửi email (bất đồng bộ)
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
        // 1. Tìm token trong DB
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Token reset không hợp lệ!"));

        // 2. Kiểm tra xem token đã hết hạn chưa
        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken); // Xóa token hết hạn
            throw new IllegalArgumentException("Token reset đã hết hạn!");
        }

        // 3. Lấy user từ token
        User user = resetToken.getUser();

        // 4. Cập nhật mật khẩu mới (đã băm)
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 5. Xóa token (vì đã được sử dụng)
        passwordResetTokenRepository.delete(resetToken);

        // 6. Gửi email thông báo reset thành công
        String subject = "Thông báo: Mật khẩu của bạn đã được reset";
        String text = "Xin chào " + user.getFullName() + ",\n\n"
                + "Mật khẩu của bạn tại Food Market vừa được reset thành công.";
        emailService.sendEmail(user.getEmail(), subject, text);
    }
    @Override
    public void logout(String refreshTokenString) {
        // Gọi service xóa token đi.
        // Hàm này rất "an toàn", nếu không tìm thấy token, nó sẽ không làm gì cả.
        refreshTokenService.deleteByToken(refreshTokenString);
    }
}
