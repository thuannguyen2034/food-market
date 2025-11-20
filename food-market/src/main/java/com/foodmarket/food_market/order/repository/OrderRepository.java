package com.foodmarket.food_market.order.repository;

import com.foodmarket.food_market.admin.dashboard.projectionDto.DailyRevenueStat;
import com.foodmarket.food_market.admin.dashboard.projectionDto.OrderStatusStat;
import com.foodmarket.food_market.admin.dashboard.projectionDto.TopProductStat;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    List<Order> findByUser_UserIdOrderByCreatedAtDesc(UUID userId);
    // ----------------------------------------------------------
    // 1. KPI: DOANH THU & SỐ ĐƠN (Cho Card Doanh thu + Card Tổng đơn)
    // ----------------------------------------------------------

    // Tính tổng tiền trong một khoảng thời gian (Dùng để tính Today và Yesterday)
    // statusList: Thường chỉ tính đơn COMPLETED, DELIVERED (đơn thành công)
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
            "WHERE o.createdAt BETWEEN :start AND :end " +
            "AND o.status IN :statusList")
    BigDecimal sumRevenueBetween(@Param("start") LocalDateTime start,
                                 @Param("end") LocalDateTime end,
                                 @Param("statusList") List<OrderStatus> statusList);

    // Đếm số đơn hàng trong khoảng thời gian (Card Tổng số đơn)
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :start AND :end")
    long countOrdersBetween(@Param("start") LocalDateTime start,
                            @Param("end") LocalDateTime end);


    // ----------------------------------------------------------
    // 2. BIỂU ĐỒ LINE: DOANH THU 7 NGÀY + TUẦN TRƯỚC
    // ----------------------------------------------------------

    // Query này lấy dữ liệu thô theo ngày.
    // Lưu ý: Dùng Native Query để GROUP BY DATE dễ dàng hơn (Ví dụ cho MySQL/Postgres)
    // Chúng ta sẽ lấy luôn 14 ngày (7 ngày này + 7 ngày trước) một thể để Java tách ra.
    @Query(value = """
        SELECT DATE(o.created_at) as date, SUM(o.total_amount) as total 
        FROM orders o 
        WHERE o.created_at >= :startDate 
          AND o.status IN :statusList
        GROUP BY DATE(o.created_at) 
        ORDER BY DATE(o.created_at) ASC
        """, nativeQuery = true)
    List<DailyRevenueStat> getDailyRevenueStats(@Param("startDate") LocalDateTime startDate,
                                                @Param("statusList") List<String> statusList);


    // ----------------------------------------------------------
    // 3. BIỂU ĐỒ TRÒN: TỶ LỆ TRẠNG THÁI
    // ----------------------------------------------------------
    @Query("SELECT o.status AS status, COUNT(o) AS count " +
            "FROM Order o GROUP BY o.status")
    List<OrderStatusStat> countOrdersByStatus();


    // ----------------------------------------------------------
    // 4. TABLE: ĐƠN CẦN XỬ LÝ GẤP
    // ----------------------------------------------------------
    // Lấy top đơn cũ nhất đang chờ xử lý
    @Query("SELECT o FROM Order o WHERE o.status IN :urgentStatuses ORDER BY o.createdAt ASC")
    List<Order> findUrgentOrders(@Param("urgentStatuses") List<OrderStatus> urgentStatuses,
                                 Pageable pageable);


    // ----------------------------------------------------------
    // 5. TABLE: TOP SẢN PHẨM HOT (Join bảng OrderItem)
    // ----------------------------------------------------------
    // Tính tổng số lượng bán ra của từng sản phẩm trong đơn hàng thành công
    @Query("""
        SELECT p.id AS productId, 
               p.name AS productName, 
               SUM(i.quantity) AS totalSold, 
               SUM(i.quantity * i.priceAtPurchase) AS totalRevenue 
        FROM OrderItem i 
        JOIN i.order o 
        JOIN i.product p 
        WHERE o.status IN :statusList 
          AND o.createdAt BETWEEN :start AND :end 
        GROUP BY p.id, p.name 
        ORDER BY totalSold DESC
        """)
    List<TopProductStat> findTopSellingProducts(@Param("start") LocalDateTime start,
                                                @Param("end") LocalDateTime end,
                                                @Param("statusList") List<OrderStatus> statusList,
                                                Pageable pageable);

}