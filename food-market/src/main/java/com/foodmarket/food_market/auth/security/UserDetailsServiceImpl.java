package com.foodmarket.food_market.auth.security;

import com.foodmarket.food_market.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Tải thông tin User từ database dựa trên email (username)
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Chúng ta dùng email làm username để đăng nhập
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy User với email: " + username));
        // Lưu ý: Entity User của chúng ta đã implement UserDetails,
        // nên chúng ta có thể trả về nó trực tiếp. Rất "Rich Domain Model".
    }
}