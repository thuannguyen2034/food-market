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
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    @Column(name = "address_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "recipient_name", nullable = false, length = 255)
    private String recipientName; 

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone; 

    @Column(name = "province", nullable = false, length = 100)
    private String province; 

    @Column(name = "district", nullable = false, length = 100)
    private String district; 

    @Column(name = "ward", nullable = false, length = 100)
    private String ward; 

    @Column(name = "street_address", nullable = false, length = 255)
    private String streetAddress; 

    @Column(name = "address_type", length = 20)
    @Enumerated(EnumType.STRING)
    private AddressType addressType; 

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    public String getFullAddress() {
        return province + ", " + district + ", " + ward + ", " + streetAddress;
    }
}