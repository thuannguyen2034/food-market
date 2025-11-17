package com.foodmarket.food_market.inventory.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String message) {
        super(message);
    }

    public InsufficientStockException(Long productId, int quantityRequested) {
        super("Insufficient stock for product ID: " + productId + ". Requested: " + quantityRequested);
    }
}