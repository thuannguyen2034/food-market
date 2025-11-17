package com.foodmarket.food_market.auth.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity // Kích hoạt Spring Security
@EnableMethodSecurity // Kích hoạt bảo mật ở cấp độ phương thức (vd: @PreAuthorize)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider; // Bean từ ApplicationConfig

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Kích hoạt CORS (để nó đọc CorsConfig của bạn)
                .cors(withDefaults())
                // 1. Tắt CSRF (Cross-Site Request Forgery)
                // Chúng ta an toàn vì chúng ta là stateless JWT
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Định nghĩa các "luật" cho request
                .authorizeHttpRequests(authz -> authz
                        // Cho phép TẤT CẢ các request pre-flight OPTIONS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 2.1. Cho phép tất cả mọi người truy cập các URL này
                        .requestMatchers(
                                "/api/v1/auth/**", // Toàn bộ API xác thực
                                "/v3/api-docs/**", // Swagger/OpenAPI docs
                                "/swagger-ui/**"   // Swagger UI
                        ).permitAll()

                        // 2.2. Tất cả các request khác đều BẮT BUỘC phải xác thực
                        .anyRequest().authenticated()
                )


                // 3. Cấu hình quản lý phiên (Session)
                // Chúng ta là API stateless, không dùng session
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 4. Cung cấp "nhà cung cấp xác thực"
                // (Chính là DaoAuthenticationProvider mà ta đã cấu hình)
                .authenticationProvider(authenticationProvider)

                // 5. Thêm "người gác cổng" JWT của chúng ta
                // Nó phải chạy TRƯỚC filter UsernamePassword... (filter mặc định)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}