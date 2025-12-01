package com.foodmarket.food_market.payment.service;

import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import com.foodmarket.food_market.order.repository.OrderRepository;
import com.foodmarket.food_market.payment.config.VnPayConfig;
import com.foodmarket.food_market.payment.dto.PaymentCreationRequestDTO;
import com.foodmarket.food_market.payment.dto.PaymentRequestDTO;
import com.foodmarket.food_market.payment.dto.PaymentResponseDTO;
import com.foodmarket.food_market.payment.event.PaymentSuccessfulEvent;
import com.foodmarket.food_market.payment.model.Payment;
import com.foodmarket.food_market.payment.repository.PaymentRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j // Dùng để log
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final VnPayConfig vnPayConfig; // Config đã tạo
    private final ApplicationEventPublisher eventPublisher;
    /**
     * (MỚI) Triển khai logic tạo thanh toán
     * Hàm này được gọi trong cùng 1 Transaction với placeOrder.
     */
    @Override
    public void createPendingPayment(PaymentCreationRequestDTO request) {
        Payment newPayment = new Payment();
        newPayment.setOrder(request.getOrder());
        newPayment.setAmount(request.getTotalAmount());
        newPayment.setMethod(request.getPaymentMethod());
        newPayment.setStatus(PaymentStatus.PENDING);

        paymentRepository.save(newPayment);
        log.info("Đã tạo thanh toán PENDING cho Order ID: {}", request.getOrder().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponseDTO createPaymentUrl(PaymentRequestDTO request, UUID userId, HttpServletRequest httpServletRequest) {
        UUID orderId = request.getOrderId();

        // 1. Tìm Order và Payment
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng: " + orderId));
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thanh toán cho đơn hàng: " + orderId));

        // 2. Kiểm tra bảo mật và logic
        if (!order.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Đơn hàng không thuộc về bạn.");
        }
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("Đơn hàng này đã được thanh toán.");
        }

        // 3. --- LOGIC GỌI VNPAY SDK (GIẢ LẬP) ---
        // (Đây là nơi bạn sẽ dùng thư viện của VNPay để build 1 URL phức tạp)

        log.info("Bắt đầu giả lập tạo URL VNPay...");

        // Lấy IP của client (VNPay yêu cầu)
        String vnpIpAddr = getClientIp(httpServletRequest);

        // Lấy thông tin từ config
        String tmnCode = vnPayConfig.getVnpTmnCode();
        String returnUrl = vnPayConfig.getVnpReturnUrl();
        String amount = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).toString(); // VNPay yêu cầu nhân 100

        // Tạo 1 URL giả lập (mocked)
        // URL thật sẽ chứa hash, tmncode, amount, orderInfo, ipAddr, v.v.
        String fakePaymentUrl = String.format("%s?vnp_TmnCode=%s&vnp_Amount=%s&vnp_OrderInfo=%s&vnp_ReturnUrl=%s&vnp_IpAddr=%s&vnp_TxnRef=%s",
                vnPayConfig.getVnpApiUrl(), // "https://sandbox.vnpay.vn/paymentv2/vpcpay.html"
                tmnCode,
                amount,
                encodeValue("Thanh toan don hang " + orderId.toString()),
                encodeValue(returnUrl),
                vnpIpAddr,
                orderId.toString() // Mã giao dịch của chúng ta
        );

        log.info("Tạo URL VNPay giả lập thành công: {}", fakePaymentUrl);
        //

        return new PaymentResponseDTO(fakePaymentUrl);
    }

    @Override
    @Transactional
    public String processVnPayCallback(Map<String, String> vnpayParams) {
        log.info("Nhận được callback IPN từ VNPay: {}", vnpayParams);

        // 1. --- LOGIC XÁC THỰC CHỮ KÝ (GIẢ LẬP) ---
        // (Đây là nơi bạn sẽ dùng vnp_HashSecret để kiểm tra vnp_SecureHash)
        // boolean isValidSignature = VnPayUtils.validateSignature(vnpayParams, vnPayConfig.getVnpHashSecret());

        boolean isValidSignature = true; // Giả lập là chữ ký luôn đúng
        log.info("Kết quả xác thực chữ ký (giả lập): {}", isValidSignature);
        //

        if (!isValidSignature) {
            log.warn("Chữ ký VNPay không hợp lệ!");
            return "{\"RspCode\":\"97\",\"Message\":\"Invalid Checksum\"}";
        }

        // 2. Lấy thông tin
        String orderIdStr = vnpayParams.get("vnp_TxnRef"); // Mã đơn hàng
        String responseCode = vnpayParams.get("vnp_ResponseCode"); // Mã kết quả
        String transactionNo = vnpayParams.get("vnp_TransactionNo"); // Mã giao dịch VNPay

        Payment payment = paymentRepository.findByOrderId(UUID.fromString(orderIdStr))
                .orElse(null);

        if (payment == null) {
            log.error("Không tìm thấy thanh toán cho đơn hàng: {}", orderIdStr);
            return "{\"RspCode\":\"01\",\"Message\":\"Order not found\"}";
        }

        // 3. Kiểm tra tính Idempotency (Tránh xử lý 2 lần)
        if (payment.getStatus() == PaymentStatus.PAID) {
            log.info("Đơn hàng {} đã được xử lý thanh toán trước đó.", orderIdStr);
            return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";
        }

        // 4. Xử lý kết quả
        if ("00".equals(responseCode)) {
            // Thanh toán thành công
            log.info("VNPay IPN: Thanh toán thành công cho đơn hàng {}", orderIdStr);
            payment.setStatus(PaymentStatus.PAID);
            payment.setTransactionCode(transactionNo);

            Order order = payment.getOrder();
            order.setStatus(OrderStatus.CONFIRMED); // Cập nhật trạng thái đơn hàng

            orderRepository.save(order);
            paymentRepository.save(payment);

            // (Sau này có thể bắn Event để gửi Email, SMS tại đây)
            // --- BẮN SỰ KIỆN (LA LÊN) ---
            // Event này sẽ được giữ lại cho đến khi transaction này COMMIT
            eventPublisher.publishEvent(new PaymentSuccessfulEvent(order));
            // -----------------------------
            return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";

        } else {
            // Thanh toán thất bại
            log.warn("VNPay IPN: Thanh toán thất bại cho đơn hàng {}. ResponseCode: {}", orderIdStr, responseCode);
            payment.setStatus(PaymentStatus.CANCEL);
            paymentRepository.save(payment);

            // Không cần cập nhật Order, vẫn là PENDING

            return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}"; // VNPay vẫn mong nhận "00"
        }
    }

    // Hàm tiện ích lấy IP (cần thiết cho VNPay)
    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = "";
        if (request != null) {
            remoteAddr = request.getHeader("X-FORWARDED-FOR");
            if (remoteAddr == null || "".equals(remoteAddr)) {
                remoteAddr = request.getRemoteAddr();
            }
        }
        return remoteAddr;
    }

    // Hàm tiện ích encode URL
    private String encodeValue(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }
}