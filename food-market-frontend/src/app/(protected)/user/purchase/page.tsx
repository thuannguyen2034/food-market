'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import OrderCard from './OrderCard';
import { OrderDTO, OrderStatus, PageResponse } from '@/app/type/Order';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag } from 'lucide-react';

// Danh sách Tabs
const TABS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ xử lý', value: OrderStatus.PENDING },
  { label: 'Đã xác nhận', value: OrderStatus.CONFIRMED },
  { label: 'Đang đóng gói', value: OrderStatus.PROCESSING },
  { label: 'Đang giao', value: OrderStatus.OUT_FOR_DELIVERY },
  { label: 'Hoàn thành', value: OrderStatus.DELIVERED },
  { label: 'Đã hủy', value: OrderStatus.CANCELLED },
];

export default function PurchasePage() {
  const router = useRouter();
  const { authedFetch } = useAuth(); // Dùng authedFetch từ context của bạn
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý tab hiện tại
  const [activeTab, setActiveTab] = useState<string>('ALL');

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Build URL params
      const params = new URLSearchParams();
      params.append('page', '0');
      params.append('size', '20'); // Lấy 20 đơn gần nhất
      
      // Nếu không phải ALL thì thêm param status
      if (activeTab !== 'ALL') {
        params.append('status', activeTab);
      }

      const response = await authedFetch(`/api/v1/orders?${params.toString()}`);
      
      if (response.ok) {
        const data: PageResponse<OrderDTO> = await response.json();
        setOrders(data.content);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Đơn hàng của tôi</h1>

      {/* TABS NAVIGATION */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              className={`${styles.tab} ${activeTab === tab.value ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS LIST */}
      {loading ? (
        <div className={styles.loader}>Đang tải đơn hàng...</div>
      ) : (
        <>
          {orders.length > 0 ? (
            <div>
              {orders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Chưa có đơn hàng nào trong mục này.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}