package com.foodmarket.food_market.inventory.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String message) {
        super(message);
    }

    public InsufficientStockException(String productName, int quantityRequested, int quantityLeft) {
        super("Kho hàng không đủ cho sản phẩm: " + productName + ". Yêu cầu: " + quantityRequested + ". Hàng còn: " + quantityLeft);
    }
}