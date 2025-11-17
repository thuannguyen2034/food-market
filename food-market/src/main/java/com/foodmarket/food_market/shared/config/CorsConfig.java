package com.foodmarket.food_market.shared.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/v1/**") // Chỉ áp dụng cho các API /api/v1/
                .allowedOrigins("http://localhost:3000") // Cho phép origin này
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Cho phép các phương thức
                .allowedHeaders("*") // Cho phép tất cả header
                .allowCredentials(true); // Cho phép gửi cookie (nếu cần)
    }
}