package com.foodmarket.food_market.payment.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "payment.vnpay") // Đọc từ application.yml
@Data
public class VnPayConfig {
    private String vnpTmnCode;
    private String vnpHashSecret;
    private String vnpApiUrl;
    private String vnpReturnUrl; // URL Client redirect về sau khi thanh toán
    private String vnpIpnUrl; // URL VNPay gọi callback (chính là API của chúng ta)
}