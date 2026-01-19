package com.foodmarket.food_market.user.controller;

import com.foodmarket.food_market.user.dto.UserAddressResponseDTO;
import com.foodmarket.food_market.user.dto.UserAddressSaveRequestDTO;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.service.UserAddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/addresses") 
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')") 
public class UserAddressController {

    private final UserAddressService userAddressService;

    @GetMapping
    public ResponseEntity<List<UserAddressResponseDTO>> getMyAddresses(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userAddressService.getMyAddresses(user.getUserId()));
    }

    @PostMapping
    public ResponseEntity<UserAddressResponseDTO> createAddress(
            Authentication authentication,
            @Valid @RequestBody UserAddressSaveRequestDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        UserAddressResponseDTO newAddress = userAddressService.createAddress(user.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(newAddress);
    }

    @GetMapping("/{addressId}")
    public ResponseEntity<UserAddressResponseDTO> getAddressById(
            Authentication authentication,
            @PathVariable Long addressId
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userAddressService.getAddressById(user.getUserId(), addressId));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<UserAddressResponseDTO> updateAddress(
            Authentication authentication,
            @PathVariable Long addressId,
            @Valid @RequestBody UserAddressSaveRequestDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        UserAddressResponseDTO updatedAddress = userAddressService.updateAddress(user.getUserId(), addressId, request);
        return ResponseEntity.ok(updatedAddress);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            Authentication authentication,
            @PathVariable Long addressId
    ) {
        User user = (User) authentication.getPrincipal();
        userAddressService.deleteAddress(user.getUserId(), addressId);
        return ResponseEntity.noContent().build(); 
    }

    @PutMapping("/{addressId}/default")
    public ResponseEntity<Void> setDefaultAddress(
            Authentication authentication,
            @PathVariable Long addressId
    ) {
        User user = (User) authentication.getPrincipal();
        userAddressService.setDefaultAddress(user.getUserId(), addressId);
        return ResponseEntity.ok().build();
    }
}