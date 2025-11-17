package com.foodmarket.food_market.user.service;

import com.foodmarket.food_market.user.dto.UserAddressResponseDTO;
import com.foodmarket.food_market.user.dto.UserAddressSaveRequestDTO;

import java.util.List;
import java.util.UUID;

public interface UserAddressService {

    List<UserAddressResponseDTO> getMyAddresses(UUID userId);

    UserAddressResponseDTO getAddressById(UUID userId, Long addressId);

    UserAddressResponseDTO createAddress(UUID userId, UserAddressSaveRequestDTO request);

    UserAddressResponseDTO updateAddress(UUID userId, Long addressId, UserAddressSaveRequestDTO request);

    void deleteAddress(UUID userId, Long addressId);

    void setDefaultAddress(UUID userId, Long addressId);
}