'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin, Phone, Calendar, Clock, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';
import { useAuth } from '@/context/AuthContext';
import { OrderDTO, OrderStatus } from '@/app/type/Order';
import OrderItem from '../OrderItem';
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
// Map màu sắc status
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return { bg: '#fff7ed', color: '#c2410c', label: 'Chờ xử lý' };
    case OrderStatus.CONFIRMED: return { bg: '#eff6ff', color: '#1d4ed8', label: 'Đã xác nhận' };
    case OrderStatus.PROCESSING: return { bg: '#e0e7ff', color: '#4338ca', label: 'Đang đóng gói' };
    case OrderStatus.OUT_FOR_DELIVERY: return { bg: '#f3e8ff', color: '#7e22ce', label: 'Đang giao hàng' };
    case OrderStatus.DELIVERED: return { bg: '#ecfdf5', color: '#047857', label: 'Giao thành công' };
    case OrderStatus.CANCELLED: return { bg: '#f3f4f6', color: '#4b5563', label: 'Đã hủy' };
    default: return { bg: '#f3f4f6', color: '#000', label: status };
  }
};

export default function OrderDetailPage() {
  const { orderId } = useParams(); // Lấy orderId từ URL
  const router = useRouter();
  const { authedFetch } = useAuth();
  
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lấy chi tiết đơn hàng
  useEffect(() => {
    if (!orderId) return;
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await authedFetch(`/api/v1/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setError('Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Hủy đơn hàng
  const handleCancelOrder = async () => {
    if (!order) return;

    // Prompt đơn giản để lấy lý do (có thể nâng cấp lên Modal đẹp hơn sau)
    const reason = window.prompt('Vui lòng nhập lý do hủy đơn hàng:', 'Đổi ý không muốn mua nữa');
    
    if (reason === null) return; // User ấn Cancel
    if (reason.trim() === '') {
      alert('Vui lòng nhập lý do!');
      return;
    }

    try {
      const res = await authedFetch(`/api/v1/orders/${order.orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        alert('Hủy đơn hàng thành công!');
        fetchOrderDetail(); // Reload lại data
      } else {
        const errorData = await res.json();
        // Backend có thể trả về lỗi logic (VD: Đã thanh toán online)
        alert(`Không thể hủy đơn: ${errorData.message || 'Lỗi không xác định'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi hủy đơn.');
    }
  };

  if (loading) return <div className={styles.container}>Đang tải...</div>;
  if (error) return <div className={styles.container}>{error}</div>;
  if (!order) return null;

  const statusStyle = getStatusColor(order.status);
  
  // Logic hiển thị nút hủy: Chỉ PENDING hoặc CONFIRMED
  const canCancel = [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);

  return (
    <div className={styles.container}>
      {/* 1. Nút Back */}
      <Link href="/user/purchase" className={styles.backLink}>
        <ChevronLeft size={16} />
        Trở lại danh sách
      </Link>

      {/* 2. Header: Mã đơn + Trạng thái */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.orderId}>Đơn hàng #{order.orderId.substring(0, 8).toUpperCase()}</h1>
          <span className={styles.metaDate}>Ngày đặt: {formatDate(order.createdAt)}</span>
        </div>
        <div 
          className={styles.statusBadge}
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {statusStyle.label}
        </div>
      </div>

      {/* 3. Thông tin giao hàng & Người nhận */}
      <div className={styles.infoGrid}>
        {/* Cột trái: Thông tin giao hàng */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Địa chỉ nhận hàng</h3>
          
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><MapPin size={14}/> Địa chỉ:</span>
            <span className={styles.infoValue}>{order.deliveryAddress}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><Phone size={14}/> Số điện thoại:</span>
            <span className={styles.infoValue}>{order.deliveryPhone}</span>
          </div>
           {/* Note nếu có */}
           {order.note && (
            <div className={styles.infoRow} style={{marginTop: '0.5rem', fontStyle: 'italic', color: '#666'}}>
               <span className={styles.infoLabel}>Ghi chú:</span>
               <span>{order.note}</span>
            </div>
          )}
        </div>

        {/* Cột phải: Thời gian giao dự kiến */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Thời gian giao hàng</h3>
          
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><Calendar size={14}/> Ngày giao:</span>
            <span className={styles.infoValue}>{order.deliveryDate}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><Clock size={14}/> Khung giờ:</span>
            <span className={styles.infoValue}>{order.deliveryTimeSlot}</span>
          </div>
           <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#f59e0b', display: 'flex', gap: '5px' }}>
              <AlertTriangle size={16} />
              <span>Vui lòng chú ý điện thoại vào thời gian này.</span>
           </div>
        </div>
      </div>

      {/* 4. Danh sách sản phẩm */}
      <div className={styles.itemsSection}>
        <h3 className={styles.cardTitle}>Sản phẩm ({order.items.length})</h3>
        {order.items.map((item) => (
          <OrderItem key={item.id}
            item={item}
            orderId={order.orderId}
            orderStatus={order.status}
          />
        ))}
      </div>

      {/* 5. Footer: Tổng tiền & Action */}
      <div className={styles.footer}>
        <div>
          {/* Nút hủy chỉ hiện khi trạng thái hợp lệ */}
          {canCancel && (
            <button onClick={handleCancelOrder} className={styles.cancelButton}>
              Hủy đơn hàng
            </button>
          )}
        </div>

        <div className={styles.totalSection}>
          <span className={styles.totalLabel}>Tổng tiền thanh toán</span>
          <span className={styles.totalAmount}>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}