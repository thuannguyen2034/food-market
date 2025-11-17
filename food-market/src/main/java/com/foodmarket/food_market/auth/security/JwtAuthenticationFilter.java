package com.foodmarket.food_market.auth.security;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter; // Quan trọng: Dùng OncePerRequestFilter

import java.io.IOException;

@Component // Biến class này thành 1 Bean, để SecurityConfig có thể tiêm vào
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService; // Đây chính là UserDetailsServiceImpl

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Lấy header Authorization
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Kiểm tra xem có header không, và có phải là Bearer token không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Không phải token? Cho qua filter tiếp theo
            return;
        }

        // 3. Lấy token (bỏ "Bearer " ở đầu)
        jwt = authHeader.substring(7);

        // 4. Giải mã token để lấy email
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (ExpiredJwtException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Token expired");
            return; // Dừng chain
        } catch (Exception e) {
            // Token lỗi (hết hạn, sai chữ ký, v.v...)
            filterChain.doFilter(request, response);
            return;
        }


        // 5. Kiểm tra xem user đã được xác thực trong SecurityContext chưa
        // (Nếu rồi thì không cần làm lại)
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 6. Tải thông tin User từ DB
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 7. Kiểm tra xem token có hợp lệ không (so với thông tin user)
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // 8. Nếu hợp lệ, tạo 1 "vé" xác thực và đặt vào SecurityContext
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // Chúng ta không cần credentials ở đây
                        userDetails.getAuthorities() // Quyền (ADMIN, CUSTOMER...)
                );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Đây là bước quan trọng: Báo cho Spring biết "User này đã OK"
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 9. Cho request đi tiếp
        filterChain.doFilter(request, response);
    }
}