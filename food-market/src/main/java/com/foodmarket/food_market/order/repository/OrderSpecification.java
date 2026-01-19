package com.foodmarket.food_market.order.repository;

import com.foodmarket.food_market.order.dto.OrderFilterDTO;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.OrderItem;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.user.model.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class OrderSpecification {

    public static Specification<Order> filterBy(OrderFilterDTO filter) {
        return Specification.allOf(hasStatusIn(filter.getStatuses()))
                .and(createdBetween(filter.getDateFrom(), filter.getDateTo()))
                .and(hasUserId(filter.getUserId()))
                .and(containsProducts(filter.getProductIds()))
                .and(containsKeyword(filter.getKeyword()));
    }


    /**
     * Lọc theo danh sách trạng thái (WHERE status IN (...))
     */
    private static Specification<Order> hasStatusIn(List<OrderStatus> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) {
                return null; // Bỏ qua điều kiện này
            }
            return root.get("status").in(statuses);
        };
    }

    /**
     * Lọc theo khoảng thời gian (WHERE createdAt BETWEEN ... AND ...)
     */
    private static Specification<Order> createdBetween(LocalDate dateFrom, LocalDate dateTo) {
        return (root, query, cb) -> {
            if (dateFrom == null && dateTo == null) {
                return null;
            }

            List<Predicate> predicates = new java.util.ArrayList<>();

            if (dateFrom != null) {
                LocalDateTime startOfDay = dateFrom.atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startOfDay));
            }

            if (dateTo != null) {
                LocalDateTime endOfDay = dateTo.atTime(23, 59, 59);
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endOfDay));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Lọc theo ID khách hàng cụ thể
     */
    private static Specification<Order> hasUserId(UUID userId) {
        return (root, query, cb) -> {
            if (userId == null) {
                return null;
            }
            return cb.equal(root.get("user").get("userId"), userId);
        };
    }

    /**
     * Lọc đơn hàng có chứa các sản phẩm nhất định (Cần JOIN bảng OrderItem)
     */
    private static Specification<Order> containsProducts(List<Long> productIds) {
        return (root, query, cb) -> {
            if (productIds == null || productIds.isEmpty()) {
                return null;
            }
            // Join Order -> OrderItems
            Join<Order, OrderItem> itemsJoin = root.join("items", JoinType.INNER);

            query.distinct(true);

            return itemsJoin.get("product").get("id").in(productIds);
        };
    }

    /**
     * Lọc theo từ khóa (Tìm trong Order ID, Tên KH, Email, SĐT)
     */
    private static Specification<Order> containsKeyword(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return null;
            }
            String likePattern = "%" + keyword.toLowerCase() + "%";

            // Join Order -> User để tìm tên/email
            Join<Order, User> userJoin = root.join("user", JoinType.LEFT);

            Predicate searchOrderId = cb.like(
                    cb.concat(root.get("id").as(String.class), cb.literal("")),
                    likePattern
            );
            Predicate searchOrderRecipePhone = cb.like(root.get("deliveryPhoneSnapshot").as(String.class), likePattern);
            Predicate searchName = cb.like(cb.lower(userJoin.get("fullName")), likePattern);
            Predicate searchEmail = cb.like(cb.lower(userJoin.get("email")), likePattern);

            return cb.or(searchOrderId, searchName, searchEmail,searchOrderRecipePhone);
        };
    }
}