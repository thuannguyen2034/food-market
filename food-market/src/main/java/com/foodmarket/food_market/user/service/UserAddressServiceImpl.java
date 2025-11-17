package com.foodmarket.food_market.user.service;

import com.foodmarket.food_market.user.dto.UserAddressResponseDTO;
import com.foodmarket.food_market.user.dto.UserAddressSaveRequestDTO;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.model.entity.UserAddress;
import com.foodmarket.food_market.user.repository.UserAddressRepository;
import com.foodmarket.food_market.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAddressServiceImpl implements UserAddressService {

    private final UserAddressRepository userAddressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserAddressResponseDTO> getMyAddresses(UUID userId) {
        return userAddressRepository.findByUser_UserId(userId).stream()
                .map(UserAddressResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserAddressResponseDTO getAddressById(UUID userId, Long addressId) {
        UserAddress address = findAddressByIdAndUser(addressId, userId);
        return UserAddressResponseDTO.fromEntity(address);
    }

    @Override
    @Transactional
    public UserAddressResponseDTO createAddress(UUID userId, UserAddressSaveRequestDTO request) {
        User user = findUserById(userId);

        // Nếu user muốn set đây là default, hãy unset các địa chỉ khác
        if (request.isDefault()) {
            unsetAllDefaultAddresses(userId);
        }

        UserAddress newAddress = new UserAddress();
        request.toEntity(newAddress);
        newAddress.setUser(user);
        UserAddress savedAddress = userAddressRepository.save(newAddress);
        return UserAddressResponseDTO.fromEntity(savedAddress);
    }

    @Override
    @Transactional
    public UserAddressResponseDTO updateAddress(UUID userId, Long addressId, UserAddressSaveRequestDTO request) {
        UserAddress address = findAddressByIdAndUser(addressId, userId);

        // Logic tương tự create
        if (request.isDefault()) {
            unsetAllDefaultAddresses(userId);
        }
        request.toEntity(address);
        UserAddress updatedAddress = userAddressRepository.save(address);
        return UserAddressResponseDTO.fromEntity(updatedAddress);
    }

    @Override
    @Transactional
    public void deleteAddress(UUID userId, Long addressId) {
        UserAddress address = findAddressByIdAndUser(addressId, userId);

        // Cẩn thận: Nếu xóa địa chỉ mặc định, nên chọn 1 cái khác làm mặc định (hoặc không)
        // Hiện tại: Chỉ xóa
        userAddressRepository.delete(address);
    }

    @Override
    @Transactional
    public void setDefaultAddress(UUID userId, Long addressId) {
        UserAddress address = findAddressByIdAndUser(addressId, userId);

        // 1. Bỏ tất cả default cũ
        unsetAllDefaultAddresses(userId);

        // 2. Set default mới
        address.setDefault(true);
        userAddressRepository.save(address);
    }

    // ==================================================================
    // --- Private Helper Methods ---
    // ==================================================================

    /**
     * Tìm địa chỉ (ném 404 nếu không thấy HOẶC không thuộc user)
     */
    private UserAddress findAddressByIdAndUser(Long addressId, UUID userId) {
        return userAddressRepository.findByIdAndUser_UserId(addressId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy địa chỉ với ID: " + addressId + " hoặc địa chỉ không thuộc về bạn."
                ));
    }

    /**
     * Tìm user (ném 404 nếu không thấy)
     */
    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy user: " + userId));
    }

    /**
     * Hàm quan trọng: Bỏ check "default" cho mọi địa chỉ của user.
     */
    private void unsetAllDefaultAddresses(UUID userId) {
        List<UserAddress> addresses = userAddressRepository.findByUser_UserId(userId);
        for (UserAddress addr : addresses) {
            addr.setDefault(false);
        }
        userAddressRepository.saveAllAndFlush(addresses); // Cập nhật ngay
    }
}