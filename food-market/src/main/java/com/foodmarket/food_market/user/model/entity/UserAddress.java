package com.foodmarket.food_market.user.model.entity;

import com.foodmarket.food_market.user.model.enums.AddressType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_addresses")
@Getter
@Setter
@NoArgsConstructor
public class UserAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // BIGSERIAL
    @Column(name = "address_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "recipient_name", nullable = false, length = 255)
    private String recipientName; // Tên người nhận (Họ và tên)

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone; // Số điện thoại người nhận

    @Column(name = "province", nullable = false, length = 100)
    private String province; // Tỉnh/Thành phố

    @Column(name = "district", nullable = false, length = 100)
    private String district; // Quận/Huyện

    @Column(name = "ward", nullable = false, length = 100)
    private String ward; // Phường/Xã

    @Column(name = "street_address", nullable = false, length = 255)
    private String streetAddress; // Địa chỉ cụ thể (Số nhà, tên đường, thôn xóm)

    @Column(name = "address_type", length = 20)
    @Enumerated(EnumType.STRING)
    private AddressType addressType; // Enum: HOME, OFFICE

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;
}