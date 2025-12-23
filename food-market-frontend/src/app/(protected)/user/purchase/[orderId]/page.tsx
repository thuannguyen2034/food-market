'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Calendar, Clock, AlertTriangle, CreditCard, Banknote, AlertCircle,CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import styles from './CustomerOrderDetail.module.css';
import { useAuth } from '@/context/AuthContext';
import { OrderDTO, OrderStatus, PaymentStatus, PaymentMethod } from '@/app/type/Order';
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
  const [isPayLoading, setIsPayLoading] = useState(false);
  const [error, setError] = useState('');

  // Lấy chi tiết đơn hàng
  useEffect(() => {
    if (!orderId) return;
    fetchOrderDetail();
    const interval = setInterval(() => {
      if (order?.status === OrderStatus.PENDING && order?.paymentMethod === 'VNPAY' && order?.paymentStatus !== 'PAID') {
        fetchOrderDetail(true); // true = silent reload (không hiện loading)
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId, order?.status, order?.paymentMethod, order?.paymentStatus]);

  const fetchOrderDetail = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await authedFetch(`/api/v1/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        if (!silent) setError('Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.');
      }
    } catch (err) {
      if (!silent) setError('Đã xảy ra lỗi kết nối.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Xử lý Hủy đơn hàng
  const handleCancelOrder = async () => {
    if (!order) return;
    // Chặn hủy nếu đã thanh toán (Logic business)
    if (order.paymentStatus === PaymentStatus.PAID) {
      alert('Đơn hàng đã thanh toán. Vui lòng liên hệ CSKH để được hỗ trợ hủy và hoàn tiền.');
      return;
    }
    const reason = window.prompt('Vui lòng nhập lý do hủy đơn hàng:', 'Đổi ý không muốn mua nữa');

    if (reason === null) return;
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
        alert(`Không thể hủy đơn: ${errorData.message || 'Lỗi không xác định'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi hủy đơn.');
    }
  };
  // 2. Xử lý Thanh toán lại (Retry Payment)
  const handleRetryPayment = async () => {
    if (!order) return;
    setIsPayLoading(true);
    try {
      // Gọi API lấy link thanh toán
      const res = await authedFetch(`/api/payment/create_payment?orderId=${order.orderId}`);
      if (res.ok) {
        const data = await res.json();
        // Redirect sang VNPAY
        window.location.href = data.url;
      } else {
        const err = await res.json();
        toast.error(err.message || 'Không thể tạo link thanh toán');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    } finally {
      setIsPayLoading(false);
    }
  };
  if (loading) return <div className={styles.container}>Đang tải...</div>;
  if (error) return <div className={styles.container}>{error}</div>;
  if (!order) return null;

  const statusStyle = getStatusColor(order.status);

  // Logic check điều kiện hiển thị
  const isVnPay = order.paymentMethod === 'VNPAY';
  const isUnpaid = order.paymentStatus !== PaymentStatus.PAID;
  const isCancelled = order.status === OrderStatus.CANCELLED;

  // Điều kiện hiện nút Thanh toán lại: Là VNPAY + Chưa trả + Chưa hủy
  const showRetryPayment = isVnPay && isUnpaid && !isCancelled;

  // Điều kiện hiện nút Hủy: PENDING/CONFIRMED + Chưa trả tiền (Nếu trả rồi thì ẩn)
  const canCancel = [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status) && !isCancelled && order.paymentStatus !== PaymentStatus.PAID;
  return (
    <div className={styles.container}>
      {/* Nút Back */}
      <Link href="/user/purchase" className={styles.backLink}>
        <ChevronLeft size={16} /> Trở lại danh sách
      </Link>

      {/* HEADER ĐƠN HÀNG */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.orderId}>Đơn hàng #{order.orderId.substring(0, 8).toUpperCase()}</h1>
          <span className={styles.metaDate}>Ngày đặt: {formatDate(order.createdAt)}</span>
        </div>
        <div className={styles.statusBadge} style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
          {statusStyle.label}
        </div>
      </div>

      {/* --- BANNER TRẠNG THÁI THANH TOÁN (MỚI) --- */}
      <div className={styles.paymentBanner}>
        {/* Case 1: VNPAY + Đã thanh toán */}
        {isVnPay && order.paymentStatus === 'PAID' && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <CheckCircle2 size={20} />
            <span>Đơn hàng đã được thanh toán thành công qua VNPAY.</span>
          </div>
        )}

        {/* Case 2: VNPAY + Chưa thanh toán + Chưa hủy */}
        {showRetryPayment && (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            <AlertTriangle size={20} />
            <div className="flex flex-col">
              <span className="font-bold">Đơn hàng chưa được thanh toán!</span>
              <span className="text-sm">Vui lòng thanh toán trong vòng 15 phút để tránh bị hệ thống tự động hủy.</span>
            </div>
            {/* Nút thanh toán nhanh trên banner */}
            <button
              onClick={handleRetryPayment}
              disabled={isPayLoading}
              className={styles.retryButtonSmall}
            >
              {isPayLoading ? 'Đang xử lý...' : 'Thanh toán ngay'}
            </button>
          </div>
        )}

        {/* Case 3: VNPAY + Đã Hủy + Chưa thanh toán (Case khách hủy hoặc timeout) */}
        {isVnPay && isCancelled && isUnpaid && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <AlertCircle size={20} />
            <span>Đơn hàng đã bị hủy do chưa hoàn tất thanh toán.</span>
          </div>
        )}

        {/* Case 4: COD */}
        {!isVnPay && (
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            <Banknote size={20} />
            <span>Phương thức thanh toán: Tiền mặt khi nhận hàng (COD).</span>
          </div>
        )}
      </div>


      {/* INFO GRID (GIỮ NGUYÊN) */}
      <div className={styles.infoGrid}>
        {/* ... (Code hiển thị địa chỉ giống cũ) ... */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Thông tin thanh toán</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><CreditCard size={14} /> Phương thức:</span>
            <span className={styles.infoValue}>{isVnPay ? 'VNPAY (Ví/Thẻ)' : 'Tiền mặt (COD)'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Trạng thái:</span>
            <span className={styles.infoValue} style={{
              color: order.paymentStatus === 'PAID' ? 'green' :
                order.paymentStatus === 'FAILED' ? 'red' : 'orange',
              fontWeight: 600
            }}>
              {order.paymentStatus === 'PAID' ? 'Đã thanh toán' :
                order.paymentStatus === 'FAILED' ? 'Thất bại' :
                  order.paymentStatus === 'CANCELLED' ? 'Đã hủy' : 'Chờ thanh toán'}
            </span>
          </div>
          {order.paymentDate && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Ngày thanh toán:</span>
              <span className={styles.infoValue}>{formatDate(order.paymentDate)}</span>
            </div>
          )}
        </div>

        {/* ... (Code hiển thị thời gian giao hàng giống cũ) ... */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Thời gian giao hàng</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><Calendar size={14} /> Ngày giao:</span>
            <span className={styles.infoValue}>{order.deliveryDate}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}><Clock size={14} /> Khung giờ:</span>
            <span className={styles.infoValue}>{order.deliveryTimeSlot}</span>
          </div>
        </div>
      </div>

      {/* ITEMS SECTION (GIỮ NGUYÊN) */}
      <div className={styles.itemsSection}>
        {/* ... */}
        <h3 className={styles.cardTitle}>Sản phẩm ({order.items.length})</h3>
        {order.items.map((item) => (
          <OrderItem key={item.id} item={item} orderId={order.orderId} orderStatus={order.status} />
        ))}
      </div>

      {/* FOOTER ACTIONS (CẬP NHẬT) */}
      <div className={styles.footer}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Nút Hủy Đơn */}
          {canCancel && (
            <button onClick={handleCancelOrder} className={styles.cancelButton}>
              Hủy đơn hàng
            </button>
          )}

          {/* Nút Thanh Toán Lại (Nằm ở footer) */}
          {showRetryPayment && (
            <button
              onClick={handleRetryPayment}
              disabled={isPayLoading}
              className={styles.payNowButton}
            >
              <CreditCard size={16} style={{ marginRight: '5px' }} />
              {isPayLoading ? 'Đang chuyển hướng...' : 'Thanh toán lại ngay'}
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