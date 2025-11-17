package com.foodmarket.food_market.user.dto;

import com.foodmarket.food_market.user.model.entity.UserAddress;
import com.foodmarket.food_market.user.model.enums.AddressType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserAddressSaveRequestDTO {

    @NotBlank(message = "Người nhận không được để trống")
    private String recipientName;
    @NotBlank(message = "Số điện thoại không được để trống")
    private String recipientPhone;
    @NotBlank(message = "Địa chỉ không được để trống")
    private String province;
    @NotBlank(message = "Địa chỉ không được để trống")
    private String district;
    @NotBlank(message = "Địa chỉ không được để trống")
    private String ward;
    @NotBlank(message = "Địa chỉ không được để trống")
    private String streetAddress;
    private String addressType;
    // Mặc định là 'false' nếu không được cung cấp
    private boolean isDefault = false;

    public void toEntity(UserAddress userAddress) {
        userAddress.setRecipientName(recipientName);
        userAddress.setRecipientPhone(recipientPhone);
        userAddress.setProvince(province);
        userAddress.setDistrict(district);
        userAddress.setWard(ward);
        userAddress.setStreetAddress(streetAddress);
        userAddress.setAddressType(AddressType.valueOf(addressType));
        userAddress.setDefault(isDefault);
    }
}