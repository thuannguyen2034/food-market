
package com.foodmarket.food_market.product.controller;

import com.foodmarket.food_market.product.dto.HomePageDataDTO;
import com.foodmarket.food_market.product.service.StorefrontService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/storefront")
@RequiredArgsConstructor
public class StorefrontController {

    private final StorefrontService storefrontService;

    // API: GET /api/v1/storefront/home
    @GetMapping("/home")
    public ResponseEntity<HomePageDataDTO> getHomePageData() {
        return ResponseEntity.ok(storefrontService.getHomePageData());
    }
}