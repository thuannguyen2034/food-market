package com.foodmarket.food_market.order.repository;

import com.foodmarket.food_market.admin.dashboard.dto.projection.DailyRevenueStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.HourlyRevenueStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.OrderStatusStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.TopProductStat;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.model.enums.PaymentMethod;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    Page<Order> findByUser_UserIdOrderByCreatedAtDesc(UUID userId,Pageable pageable);

    // Tính tổng tiền trong một khoảng thời gian
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
            "WHERE o.createdAt BETWEEN :start AND :end " +
            "AND o.status IN :statusList")
    BigDecimal sumRevenueBetween(@Param("start") OffsetDateTime start,
                                 @Param("end") OffsetDateTime end,
                                 @Param("statusList") Set<OrderStatus> statusList);

    // Tính tổng doanh thu không lọc theo ngày (ALL)
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
            "WHERE o.status IN :statusList")
    BigDecimal sumTotalRevenue(@Param("statusList") Set<OrderStatus> statusList);

    //  Tổng số đơn
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :start AND :end")
    long countOrdersBetween(@Param("start") OffsetDateTime start,
                            @Param("end") OffsetDateTime end);


    // doanh thu
    @Query(value = """
            SELECT CAST(o.created_at AS DATE) as date, COALESCE(SUM(o.total_amount), 0) as totalRevenue 
            FROM orders o 
            WHERE o.created_at >= :startDate    
              AND o.created_at <= :endDate       
              AND o.status IN :statusList 
            GROUP BY CAST(o.created_at AS DATE)
            ORDER BY CAST(o.created_at AS DATE) ASC
            """, nativeQuery = true)
    List<DailyRevenueStat> getDailyRevenueStats(@Param("startDate") OffsetDateTime startDate,
                                                @Param("endDate") OffsetDateTime endDate,
                                                @Param("statusList") Set<String> statusList);

    @Query(value = """
            SELECT EXTRACT(HOUR FROM created_at) as hour, COALESCE(SUM(o.total_amount), 0) as totalRevenue 
            FROM orders o 
            WHERE o.created_at >= :startDate    
              AND o.created_at <= :endDate       
              AND o.status IN :statusList 
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour ASC
            """, nativeQuery = true)
    List<HourlyRevenueStat> getHourlyRevenueStats(@Param("startDate") OffsetDateTime startDate,
                                                  @Param("endDate") OffsetDateTime endDate,
                                                  @Param("statusList") Set<String> statusList);

    @Query("SELECT o.status AS status, COUNT(o) AS count " +
            "FROM Order o GROUP BY o.status")
    List<OrderStatusStat> countOrdersByStatus();

    // Đếm orders theo status trong khoảng thời gian
    @Query("SELECT o.status AS status, COUNT(o) AS count " +
            "FROM Order o " +
            "WHERE o.createdAt BETWEEN :start AND :end " +
            "GROUP BY o.status")
    List<OrderStatusStat> countOrdersByStatusBetween(
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end
    );


    // Lấy top đơn cũ nhất đang chờ xử lý
    @Query("SELECT o FROM Order o WHERE o.status IN :urgentStatuses ORDER BY o.createdAt ASC")
    List<Order> findUrgentOrders(@Param("urgentStatuses") Set<OrderStatus> urgentStatuses,
                                 Pageable pageable);


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
    List<TopProductStat> findTopSellingProducts(@Param("start") OffsetDateTime start,
                                                @Param("end") OffsetDateTime end,
                                                @Param("statusList") Set<OrderStatus> statusList,
                                                Pageable pageable);
    Page<Order> findByUser_UserIdAndStatus(UUID userId, OrderStatus status, Pageable pageable);
    boolean existsByIdAndUser_UserIdAndStatus(UUID orderId, UUID userId, OrderStatus status);
    //Tìm các order quá hạn thanh toán online
    @Query("SELECT o FROM Order o WHERE o.status = :status " +
            "AND o.paymentMethod = :method " +
            "AND o.paymentStatus <> :paidStatus " +
            "AND o.createdAt < :threshold")
    List<Order> findExpiredOrders(
            @Param("status") OrderStatus status,
            @Param("method") PaymentMethod method,
            @Param("paidStatus") PaymentStatus paidStatus,
            @Param("threshold") OffsetDateTime threshold
    );
}