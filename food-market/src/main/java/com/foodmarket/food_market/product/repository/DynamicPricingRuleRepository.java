package com.foodmarket.food_market.product.repository;

import com.foodmarket.food_market.product.model.DynamicPricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DynamicPricingRuleRepository extends JpaRepository<DynamicPricingRule, Long> {

    // Lấy các luật, sắp xếp theo số ngày trigger (ưu tiên luật có HSD ngắn nhất)
    @Query("SELECT r FROM DynamicPricingRule r ORDER BY r.daysRemainingTrigger ASC")
    List<DynamicPricingRule> findAllSortedByTriggerDay();
}