package com.foodmarket.food_market.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret-key}")
    private String SECRET_KEY;

    @Value("${jwt.expiration-ms}")
    private long JWT_EXPIRATION_MS;

    /**
     * Trích xuất username (email) từ token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Trích xuất một "claim" (thông tin) cụ thể từ token.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Tạo token chỉ với UserDetails.
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Tạo token với các "claim" (thông tin) bổ sung.
     * Đây là code ĐÃ SỬA LẠI theo API mới (v0.12.x).
     */
    public String generateToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails
    ) {
        return Jwts
                .builder()
                .claims(extraClaims) // Sử dụng .claims() thay vì .setClaims()
                .subject(userDetails.getUsername()) // Sử dụng .subject() thay vì .setSubject()
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION_MS)) // Sử dụng .expiration()
                .signWith(getSignInKey()) // .signWith() chỉ cần Key, không cần Algorithm
                .compact();
    }

    /**
     * Kiểm tra xem token có hợp lệ không.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Giải mã token và lấy tất cả "claims".
     * Đây là code ĐÃ SỬA LẠI theo API mới (v0.12.x).
     */
    private Claims extractAllClaims(String token) {
        return Jwts
                .parser() // Sử dụng .parser()
                .verifyWith(getSignInKey()) // Sử dụng .verifyWith(key)
                .build()
                .parseSignedClaims(token) // Sử dụng .parseSignedClaims()
                .getPayload(); // Lấy "payload"
    }

    /**
     * Lấy SecretKey từ chuỗi BASE64 trong application.properties.
     * (Không thay đổi, nhưng đảm bảo trả về SecretKey)
     */
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}