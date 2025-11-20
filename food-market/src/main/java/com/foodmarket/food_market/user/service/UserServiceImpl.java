package com.foodmarket.food_market.user.service;

import com.foodmarket.food_market.shared.service.EmailService;
import com.foodmarket.food_market.user.dto.ChangePasswordRequestDTO;
import com.foodmarket.food_market.user.dto.UserInfoUpdateDTO;
import com.foodmarket.food_market.user.dto.UserResponseDTO;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // <-- TIÊM PasswordEncoder
    private final EmailService emailService; // <-- TIÊM EmailService
    // Sau này sẽ thêm 1 Mapper (ví dụ: MapStruct)

    @Override
    public UserResponseDTO getCurrentUser(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));

        // (Tạm thời map thủ công, sau này sẽ dùng MapStruct)
        return UserResponseDTO.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequestDTO request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));

        // 1. Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu cũ không chính xác");
        }
        // Kiểm tra mật khẩu mới có khác mật khẩu cũ
        if(passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng mật khẩu cũ");
        }
        // 2. Cập nhật mật khẩu mới (đã băm)
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 3. Gửi email thông báo
        String subject = "Thông báo: Mật khẩu của bạn đã được thay đổi";
        String text = "Xin chào " + user.getFullName() + ",\n\n"
                + "Mật khẩu của bạn tại Food Market vừa được thay đổi thành công.";
        emailService.sendEmail(user.getEmail(), subject, text);
    }

    @Override
    @Transactional
    public UserResponseDTO updateUserInfo(String email, UserInfoUpdateDTO userRequest) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));
        //Cập nhật tên và số điện thoại
        user.setFullName(userRequest.getFullName());
        user.setPhone(userRequest.getPhone());
        //Lưu thay đổi
        userRepository.save(user);
        return UserResponseDTO.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Override
    @Transactional
    public UserResponseDTO updateAvatar(String email, String newAvatarUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));
        //Cập nhật avatar url
        user.setAvatarUrl(newAvatarUrl);
        //Lưu thay đổi
        userRepository.save(user);
        return UserResponseDTO.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Override
    @Transactional
    public void deleteAvatar(String email) {
        // 1. Lấy lên (SELECT)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));

        // 2. Thay đổi trạng thái (logic)
        user.setAvatarUrl(null); // Hoặc user.removeAvatar();

        // 3. Cập nhật xuống (UPDATE)
        userRepository.save(user);
    }

    @Override
    public long countNewUsers(LocalDateTime start, LocalDateTime end) {
       return userRepository.countNewUsers(start, end);
    }

}