package com.foodmarket.food_market.notification.listener;

import com.foodmarket.food_market.notification.model.enums.NotificationType;
import com.foodmarket.food_market.notification.service.NotificationService;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.payment.event.PaymentSuccessfulEvent;
import com.foodmarket.food_market.order.event.OrderStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;

    /**
     * Lắng nghe sự kiện PaymentSuccessfulEvent
     * CHỈ CHẠY SAU KHI TRANSACTION GỐC (của PaymentService) ĐÃ COMMIT THÀNH CÔNG.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePaymentSuccess(PaymentSuccessfulEvent event) {
        try {
            Order order = event.getOrder();
            log.info("Đang xử lý sự kiện thanh toán thành công cho Order ID: {}", order.getId());

            String message = String.format(
                    "Thanh toán cho đơn hàng #%s trị giá %,.0fđ đã thành công!",
                    order.getId().toString().substring(0, 8), // Lấy 8 ký tự đầu
                    order.getTotalAmount()
            );

            // Gọi service nội bộ (hàm này sẽ chạy trong 1 transaction MỚI)
            notificationService.createNotification(
                    order.getUser().getUserId(),
                    message,
                    NotificationType.PAYMENT,
                    "/orders/" + order.getId()
            );

        } catch (Exception e) {
            // Rất quan trọng: Phải bắt lỗi
            // Nếu không, lỗi ở đây có thể làm app crash mà không ai biết
            log.error("LỖI khi xử lý sự kiện thanh toán thành công: ", e);
            // (Trong Giai đoạn 3, chúng ta sẽ dùng Dead Letter Queue (DLQ) ở đây)
        }
    }
    /**
     * (MỚI) Lắng nghe sự kiện thay đổi trạng thái Order
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderStatusChange(OrderStatusChangedEvent event) {
        try {
            Order order = event.getOrder();
            OrderStatus status = event.getNewStatus();
            log.info("Đang xử lý sự kiện OrderStatusChanged cho Order ID: {}, Status: {}", order.getId(), status);

            // Dùng switch để tạo Message (nội dung)
            String message = switch (status) {
                case CONFIRMED -> "Đơn hàng của bạn đã được xác nhận. Chúng tôi đang chuẩn bị hàng.";
                case PROCESSING -> "Đơn hàng của bạn đã được đóng gói (đã xuất kho).";
                case OUT_FOR_DELIVERY -> "Shipper đang trên đường giao hàng cho bạn.";
                case DELIVERED -> "Đơn hàng đã được giao thành công. Cảm ơn bạn!";
                case CANCELLED -> "Đơn hàng của bạn đã bị hủy.";
                default -> null; // (PENDING không cần thông báo)
            };

            if (message != null) {
                // 1. Tạo thông báo (cho chuông 🔔)
                notificationService.createNotification(
                        order.getUser().getUserId(),
                        message,
                        NotificationType.ORDER,
                        "/orders/" + order.getId()
                );

                // 2. Đẩy WebSocket (cho "bản đồ" fake)
                // Chúng ta sẽ đẩy 1 object JSON chứa trạng thái mới
                String webSocketMessage = String.format("{\"status\": \"%s\", \"message\": \"%s\"}", status, message);

                // messagingTemplate.convertAndSend(
                //     "/topic/tracking/" + order.getId(),
                //     webSocketMessage
                // );
                log.info("FAKE PUSH WebSocket: {}", webSocketMessage); // (Tạm thời log ra)
            }

        } catch (Exception e) {
            log.error("LỖI khi xử lý sự kiện OrderStatusChanged: ", e);
        }
    }
}