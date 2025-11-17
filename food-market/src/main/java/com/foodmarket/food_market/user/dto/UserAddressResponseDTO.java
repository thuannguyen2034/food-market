package com.foodmarket.food_market.user.dto;

import com.foodmarket.food_market.user.model.entity.UserAddress;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserAddressResponseDTO {
    private Long id;
    private String recipientName;
    private String recipientPhone;
    private String province;
    private String district;
    private String ward;
    private String streetAddress;
    private String addressType;
    private boolean isDefault;

    /**
     * Hàm static để chuyển đổi từ Entity
     */
    public static UserAddressResponseDTO fromEntity(UserAddress address) {
        if (address == null) {
            return null;
        }
        return UserAddressResponseDTO.builder()
                .id(address.getId())
                .recipientName(address.getRecipientName())
                .recipientPhone(address.getRecipientPhone())
                .province(address.getProvince())
                .district(address.getDistrict())
                .ward(address.getWard())
                .streetAddress(address.getStreetAddress())
                .addressType(address.getAddressType().name())
                .isDefault(address.isDefault())
                .build();
    }
}