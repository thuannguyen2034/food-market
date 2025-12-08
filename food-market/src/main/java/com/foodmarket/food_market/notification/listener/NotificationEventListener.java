package com.foodmarket.food_market.notification.listener;

import com.foodmarket.food_market.notification.model.enums.NotificationType;
import com.foodmarket.food_market.notification.service.NotificationService;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.payment.event.PaymentSuccessfulEvent;
import com.foodmarket.food_market.order.event.OrderStatusChangedEvent;
import com.pusher.rest.Pusher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final Pusher pusher;
    /**
     * Lắng nghe sự kiện PaymentSuccessfulEvent
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
                    "/user/purchase/" + order.getId()
            );

        } catch (Exception e) {
            log.error("LỖI khi xử lý sự kiện thanh toán thành công: ", e);
            // (Trong Giai đoạn 3, chúng ta sẽ dùng Dead Letter Queue (DLQ) ở đây)
        }
    }

    /**
     * (MỚI) Lắng nghe sự kiện thay đổi trạng thái Order
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderStatusChange(OrderStatusChangedEvent event) {
        try {
            Order order = event.getOrder();
            OrderStatus status = event.getNewStatus();
            log.info("Đang xử lý sự kiện OrderStatusChanged cho Order ID: {}, Status: {}", order.getId(), status);

            // Dùng switch để tạo Message (nội dung)
            String message = switch (status) {
                case OUT_FOR_DELIVERY -> "Shipper đang trên đường giao hàng cho bạn. Hãy chú ý điện thoại";
                case DELIVERED -> "Đơn hàng đã được giao thành công. Cảm ơn bạn!";
                case CANCELLED -> "Đơn hàng của bạn đã bị hủy.";
                default -> null; // (PENDING không cần thông báo)
            };

            if (message != null) {
                notificationService.createNotification(
                        order.getUser().getUserId(),
                        message,
                        NotificationType.ORDER,
                        "/user/purchase/" + order.getId()
                );
                try {
                    String channelName = "user-" + order.getUser().getUserId();
                    Map<String, String> pushData = new HashMap<>();
                    pushData.put("message", message);
                    pushData.put("link", "/user/purchase/" + order.getId());

                    pusher.trigger(channelName, "notification-event", pushData);
                } catch (Exception ex) {
                    log.error("Lỗi gửi Pusher: " + ex.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("LỖI khi xử lý sự kiện OrderStatusChanged: ", e);
        }
    }
}