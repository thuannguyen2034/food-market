package com.foodmarket.food_market.user.controller;

import com.foodmarket.food_market.shared.service.ImageService;
import com.foodmarket.food_market.user.dto.ChangePasswordRequestDTO;
import com.foodmarket.food_market.user.dto.UserInfoUpdateDTO;
import com.foodmarket.food_market.user.dto.UserResponseDTO;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ImageService imageService;

    /**
     * API Endpoint được BẢO VỆ.
     * Chỉ user đã đăng nhập (có token hợp lệ) mới gọi được.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()") // Chỉ cần đã đăng nhập là được (Role gì cũng OK)
    public ResponseEntity<UserResponseDTO> getCurrentUser(Authentication authentication) {
        // Sau khi JwtAuthenticationFilter chạy, Spring Security
        // sẽ "nhét" thông tin user vào `Authentication`
        // getEmail() là hàm getUsername() mà chúng ta đã implement trong UserDetails
        String userEmail = authentication.getName();

        return ResponseEntity.ok(userService.getCurrentUser(userEmail));
    }

    @PostMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()") // Yêu cầu đã đăng nhập
    public ResponseEntity<String> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequestDTO request
    ) {
        String userEmail = authentication.getName();
        userService.changePassword(userEmail, request);
        return ResponseEntity.ok("Đổi mật khẩu thành công!");
    }

    @PostMapping("/profile/update-profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UserInfoUpdateDTO user
    ){
        String userEmail = authentication.getName();
        UserResponseDTO updatedUser = userService.updateUserInfo(userEmail, user);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Endpoint này chỉ để cập nhật Avatar
     */
    @PostMapping("/profile/avatar")
    @PreAuthorize("isAuthenticated()") // Đảm bảo đã đăng nhập
    public ResponseEntity<UserResponseDTO> updateAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) throws IOException {

        // 1. Lấy email của người đang đăng nhập
        String userEmail = authentication.getName();
        User currentUser = (User) authentication.getPrincipal();
        String userId = currentUser.getUserId().toString();
        // 2. Upload file mới lên Cloudinary
        String newAvatarUrl = imageService.uploadAvatar(file,userId);

        // 4. Cập nhật URL mới vào DB
        UserResponseDTO updatedUser = userService.updateAvatar(userEmail, newAvatarUrl);

        // 5. Trả về DTO đã cập nhật
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/profile/avatar")
    @PreAuthorize("isAuthenticated()") // Đảm bảo đã đăng nhập
    public ResponseEntity<String> deleteAvatar(
            Authentication authentication) throws IOException {

        // 1. Lấy email của người đang đăng nhập
        String userEmail = authentication.getName();
        User currentUser = (User) authentication.getPrincipal();
        String userId = currentUser.getUserId().toString();
        // 2. Upload file mới lên Cloudinary
        imageService.deleteAvatar(userId);

        // 4. Cập nhật URL mới vào DB
        userService.deleteAvatar(userEmail);

        // 5. Trả về DTO đã cập nhật
        return ResponseEntity.ok("Xoá avatar thành công");
    }

}