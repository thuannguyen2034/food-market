'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    MapPin,
    Phone,
    Calendar,
    FileText,
    DollarSign,
    Package
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import styles from '@/styles/admin/Orders.module.css';
import { OrderDTO, OrderStatus, getOrderStatusLabel, getValidNextStatuses } from '@/app/type/Order';
import OrderStatusBadge from '../components/OrderStatusBadge';

export default function OrderDetailPage() {
    const { authedFetch } = useAuth();
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<OrderDTO | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        setLoading(true);
        try {
            const response = await authedFetch(`/api/v1/admin/orders/${orderId}`);
            if (response.ok) {
                const data: OrderDTO = await response.json();
                setOrder(data);
                setSelectedStatus('');
            } else {
                console.error('Order not found');
            }
        } catch (error) {
            console.error('Error fetching order detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedStatus || !order) return;

        const confirmed = window.confirm(
            `Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "${getOrderStatusLabel(selectedStatus)}"?`
        );

        if (!confirmed) return;

        setUpdating(true);
        try {
            const response = await authedFetch(`/api/v1/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newStatus: selectedStatus })
            });

            if (response.ok) {
                alert('Cập nhật trạng thái thành công!');
                fetchOrderDetail(); // Refresh order data
            } else {
                alert('Cập nhật thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setUpdating(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(val);

    if (loading) {
        return (
            <div className={styles.detailContainer}>
                <div className={styles.loadingState}>
                    <p>Đang tải chi tiết đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={styles.detailContainer}>
                <div className={styles.emptyState}>
                    <Package size={48} />
                    <h3>Không tìm thấy đơn hàng</h3>
                    <Link href="/admin/orders" className={styles.backBtn}>
                        <ArrowLeft size={16} />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    const validNextStatuses = getValidNextStatuses(order.status);

    return (
        <div className={styles.detailContainer}>
            {/* Header */}
            <div className={styles.detailHeader}>
                <div>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin/orders">Đơn hàng</Link>
                        <span>/</span>
                        <span>#{order.orderId.slice(0, 8)}</span>
                    </div>
                    <h1 className={styles.orderTitle}>Chi tiết đơn hàng #{order.orderId.slice(0, 8)}</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <OrderStatusBadge status={order.status} />
                    <Link href="/admin/orders" className={styles.backBtn}>
                        <ArrowLeft size={16} />
                        Quay lại
                    </Link>
                </div>
            </div>

            {/* Order Information Cards */}
            <div className={styles.infoGrid}>
                {/* Order Info Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Package size={18} style={{ display: 'inline', marginRight: 8 }} />
                        Thông tin đơn hàng
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Mã đơn hàng</span>
                        <span className={styles.infoValue}>#{order.orderId}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>
                            <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                            Ngày tạo
                        </span>
                        <span className={styles.infoValue}>
                            {format(new Date(order.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                        </span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Khung giờ giao</span>
                        <span className={styles.infoValue}>{order.deliveryTimeSlot}</span>
                    </div>
                    {order.note && (
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>
                                <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
                                Ghi chú
                            </span>
                            <span className={styles.infoValue}>{order.note}</span>
                        </div>
                    )}
                </div>

                {/* Delivery Info Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <MapPin size={18} style={{ display: 'inline', marginRight: 8 }} />
                        Thông tin giao hàng
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>
                            <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
                            Số điện thoại
                        </span>
                        <span className={styles.infoValue}>{order.deliveryPhone}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>
                            <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                            Địa chỉ
                        </span>
                        <span className={styles.infoValue} style={{ textAlign: 'right', maxWidth: '60%' }}>
                            {order.deliveryAddress}
                        </span>
                    </div>
                </div>

                {/* Summary Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <DollarSign size={18} style={{ display: 'inline', marginRight: 8 }} />
                        Tổng quan
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Trạng thái</span>
                        <span className={styles.infoValue}>
                            {getOrderStatusLabel(order.status)}
                        </span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Tổng số sản phẩm</span>
                        <span className={styles.infoValue}>
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                        </span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel} style={{ fontSize: '1rem', fontWeight: 700 }}>
                            Tổng tiền
                        </span>
                        <span className={styles.infoValue} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2e7d32' }}>
                            {formatCurrency(order.totalAmount)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Order Items Table */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>Sản phẩm trong đơn hàng</div>
                <table className={styles.itemsTable}>
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Batch Code</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div className={styles.productCell}>
                                        <img
                                            src={item.productThumbnailSnapshot || '/placeholder-food.png'}
                                            alt={item.productNameSnapshot}
                                            className={styles.productImg}
                                        />
                                        <span className={styles.productName}>{item.productNameSnapshot}</span>
                                    </div>
                                </td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.priceAtPurchase)}</td>
                                <td>
                                    <code style={{
                                        fontSize: '0.85rem',
                                        background: '#f1f1f1',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        {item.batchCode}
                                    </code>
                                </td>
                                <td style={{ fontWeight: 600, color: '#2e7d32' }}>
                                    {formatCurrency(item.priceAtPurchase * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Status Update Section */}
            {validNextStatuses.length > 0 && (
                <div className={styles.statusUpdateCard}>
                    <div className={styles.cardHeader}>Cập nhật trạng thái đơn hàng</div>
                    <div className={styles.statusUpdateForm}>
                        <div className={styles.formGroup}>
                            <label>Chọn trạng thái mới</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                                disabled={updating}
                            >
                                <option value="">-- Chọn trạng thái --</option>
                                {validNextStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {getOrderStatusLabel(status)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            className={styles.btnUpdate}
                            onClick={handleUpdateStatus}
                            disabled={!selectedStatus || updating}
                        >
                            {updating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                        </button>
                    </div>
                </div>
            )}

            {validNextStatuses.length === 0 && (
                <div className={styles.card}>
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        <p>Đơn hàng đã ở trạng thái cuối. Không thể cập nhật thêm.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
