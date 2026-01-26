// src/app/type/Dashboard.ts

export type DashboardSummary = {
  // Doanh thu
  currentRevenue: number;
  previousRevenue: number;
  revenueGrowth: number; 

  // Đơn hàng
  currentOrders: number;
  previousOrders: number;
  ordersGrowth: number; 
};

export type ChartData = {
  label: string; 
  currentRevenue: number;
  previousRevenue: number;
};

export type OrderStatusStat = {
  status: string;
  count: number;
};

export type TopProduct = {
  productId: number;
  productName: string;
  productImage: string | null;
  totalSold: number;
  totalRevenue: number;
};

export type UrgentOrder = {
  orderId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  deliveryAddress: string;
  deliveryTimeSlot: string;
};