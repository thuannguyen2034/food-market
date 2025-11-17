package com.foodmarket.food_market.shared.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async; // Để gửi mail bất đồng bộ
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j // Ghi log
public class EmailService {

    private final JavaMailSender mailSender;

    // Gửi email ở một luồng (thread) riêng để không block request chính
    @Async
    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            // message.setFrom("no-reply@foodmarket.com"); // Bạn có thể set From

            mailSender.send(message);
            log.info("Đã gửi email thành công tới {}", to);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email tới {}: {}", to, e.getMessage());
        }
    }
}