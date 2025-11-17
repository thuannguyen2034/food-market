package com.foodmarket.food_market.shared.config;

import com.foodmarket.food_market.auth.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor // Sẽ tự động tiêm 2 bean dưới đây vào
public class ApplicationConfig {

    // 1. Bean UserDetailsService mà chúng ta đã tạo
    private final UserDetailsServiceImpl userDetailsService;

    /**
     * Bean 1: Cung cấp "cỗ máy" mã hóa mật khẩu
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Bean 2: Cung cấp "nhà cung cấp xác thực" (AuthenticationProvider)
     * --- ĐÂY LÀ PHIÊN BẢN ĐÃ SỬA THEO CHUẨN MỚI NHẤT ---
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {

        // 1. Sử dụng constructor duy nhất KHÔNG LỖI THỜI,
        //    yêu cầu cung cấp UserDetailsService.
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);

        // 2. Gọi hàm setter "setPasswordEncoder()" để cung cấp
        //    cách thức mã hóa mật khẩu (lấy từ Bean 1).
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    /**
     * Bean 3: Cung cấp "cỗ máy" quản lý xác thực
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}