package com.foodmarket.food_market.user.service;

import com.foodmarket.food_market.admin.dashboard.dto.response.UserStatsDTO;
import com.foodmarket.food_market.shared.service.EmailService;
import com.foodmarket.food_market.user.dto.ChangePasswordRequestDTO;
import com.foodmarket.food_market.user.dto.UserInfoUpdateDTO;
import com.foodmarket.food_market.user.dto.UserResponseDTO;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.model.enums.Role;
import com.foodmarket.food_market.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; 
    private final EmailService emailService; 
    

    @Override
    public UserResponseDTO getCurrentUser(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));

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
        user.setFullName(userRequest.getFullName());
        user.setPhone(userRequest.getPhone());
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
        user.setAvatarUrl(newAvatarUrl);
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
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user"));
        user.setAvatarUrl(null); 
        userRepository.save(user);
    }

    @Override
    public long countNewUsersInLastDay() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime twentyFourHoursAgo = now.minusHours(24);
       return userRepository.countNewUsers(twentyFourHoursAgo, now);
    }
    @Override
    public UserStatsDTO getUserStats() {
        OffsetDateTime startOfMonth = OffsetDateTime.now().withDayOfMonth(1)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);
        long totalUsers = userRepository.count();
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long totalStaffs = userRepository.countByRole(Role.STAFF);
        long newUsers = userRepository.countByCreatedAtAfter(startOfMonth);

        return UserStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalCustomers(totalCustomers)
                .totalAdmins(totalAdmins)
                .totalStaffs(totalStaffs)
                .newUsersThisMonth(newUsers)
                .build();
    }
}