import React from 'react';
import Link from 'next/link';
import styles from './OrderCard.module.css';
import { OrderDTO, OrderStatus } from '@/app/type/Order';
import OrderItem from './OrderItem';
import { Truck, Package, Clock, XCircle, CheckCircle } from 'lucide-react';
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};
interface OrderCardProps {
    order: OrderDTO;
}

const statusMap: Record<OrderStatus, { label: string; icon: React.ElementType, style: string }> = {
    PENDING: { label: 'Chờ xác nhận', icon: Clock, style: styles.status_PENDING },
    CONFIRMED: { label: 'Đã xác nhận', icon: Package, style: styles.status_CONFIRMED },
    PROCESSING: { label: 'Đang đóng gói', icon: Package, style: styles.status_PROCESSING },
    OUT_FOR_DELIVERY: { label: 'Đang giao', icon: Truck, style: styles.status_OUT_FOR_DELIVERY },
    DELIVERED: { label: 'Hoàn thành', icon: CheckCircle, style: styles.status_DELIVERED },
    CANCELLED: { label: 'Đã hủy', icon: XCircle, style: styles.status_CANCELLED },
};

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    const statusConfig = statusMap[order.status];
    const StatusIcon = statusConfig.icon;

    return (
        <div className={styles.card}>
            {/* HEADER: Status & Date */}
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusIcon size={16} />
                    <span className={`${styles.status} ${statusConfig.style}`}>
                        {statusConfig.label}
                    </span>
                </div>
                <span style={{ color: '#6b7280' }}>
                    Giao ngày: {order.deliveryDate}
                </span>
            </div>

            {/* BODY: Order Items */}
            <div className={styles.body}>
                {order.items.map((item) => (
                    <OrderItem key={item.id}
                        item={item}
                        orderId={order.orderId}
                        orderStatus={order.status}
                     />
                ))}
            </div>

            {/* FOOTER: Total & Action */}
            <div className={styles.footer}>
                <div>
                    <span className={styles.totalLabel}>Thành tiền:</span>
                    <span className={styles.totalAmount}>{formatCurrency(order.totalAmount)}</span>
                </div>

                <Link href={`/user/purchase/${order.orderId}`} className={styles.detailButton}>
                    Xem chi tiết
                </Link>
            </div>
        </div>
    );
};

export default OrderCard;