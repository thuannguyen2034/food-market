package com.foodmarket.food_market.user.model.entity;

import com.foodmarket.food_market.user.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails { // Implement UserDetails

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "phone", length = 20, nullable = false, unique = true)
    private String phone;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING) // Quan trọng: Lưu Enum dưới dạng String trong DB
    @Column(name = "role", length = 50, nullable = false)
    private Role role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;
    // --- Các hàm nghiệp vụ của Rich Domain Model (sẽ thêm sau) ---
    // public void changePassword(String newHashedPassword) { ... }
    // public void updateProfile(String newName, String newPhone) { ... }

    // --- Triển khai các phương thức của UserDetails (Bắt buộc cho Spring Security) ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Trả về quyền của user, Spring Security sẽ dùng tiền tố "ROLE_"
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        // Trả về mật khẩu đã hash
        return this.passwordHash;
    }

    @Override
    public String getUsername() {
        // Chúng ta dùng email để đăng nhập, nên username chính là email
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Tài khoản không bao giờ hết hạn
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // Tài khoản không bị khóa
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Mật khẩu không hết hạn
    }

    @Override
    public boolean isEnabled() {
        return true; // Tài khoản được kích hoạt
    }
}