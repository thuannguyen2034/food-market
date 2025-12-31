'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import {
    ArrowLeft, MapPin, Phone, FileText, DollarSign, Package,
    CreditCard, CheckCircle, Wallet, Truck, User, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import styles from './OrderDetailAdmin.module.css';
import { OrderDTO, OrderStatus, PaymentStatus, getOrderStatusLabel, getValidNextStatuses } from '@/app/type/Order';
import OrderStatusBadge from '../components/OrderStatusBadge';

// Helper color
const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
        case PaymentStatus.PAID: return '#16a34a';
        case PaymentStatus.PENDING: return '#d97706';
        case PaymentStatus.FAILED: return '#dc2626';
        case PaymentStatus.CANCELLED: return '#4b5563';
        default: return '#000';
    }
};

const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
        case PaymentStatus.PAID: return 'Đã thanh toán';
        case PaymentStatus.PENDING: return 'Chờ thanh toán';
        case PaymentStatus.FAILED: return 'Thất bại';
        case PaymentStatus.CANCELLED: return 'Đã hủy';
        default: return status;
    }
};

export default function OrderDetailPage() {
    const { authedFetch } = useAuth();
    const params = useParams();
    const orderId = params.orderId as string;

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<OrderDTO | null>(null);

    // Update States
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
    const [updating, setUpdating] = useState(false);
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | ''>('');
    const [updatingPayment, setUpdatingPayment] = useState(false);

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
                setSelectedStatus(data.status);
                setSelectedPaymentStatus(data.paymentStatus);
            }
        } catch (error) {
            console.error('Error fetching order detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedStatus || !order) return;
        if (!window.confirm(`Xác nhận đổi trạng thái thành "${getOrderStatusLabel(selectedStatus)}"?`)) return;

        setUpdating(true);
        try {
            const response = await authedFetch(`/api/v1/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newStatus: selectedStatus })
            });
            if (response.ok) {
                fetchOrderDetail();
            } else {
                alert('Cập nhật thất bại.');
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePaymentStatus = async () => {
        if (!selectedPaymentStatus || !order) return;
        if (!window.confirm(`ADMIN WARNING: Cập nhật tiền thành "${getPaymentStatusLabel(selectedPaymentStatus)}"?`)) return;

        setUpdatingPayment(true);
        try {
            const response = await authedFetch(`/api/v1/admin/orders/${orderId}/payment-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus: selectedPaymentStatus })
            });
            if (response.ok) {
                fetchOrderDetail();
            } else {
                alert('Cập nhật thất bại.');
            }
        } finally {
            setUpdatingPayment(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

    if (loading) return <div className={styles.container}><div className={styles.loadingState}>Đang tải...</div></div>;

    if (!order) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <Package size={48} />
                    <h3>Không tìm thấy đơn hàng</h3>
                    <Link href="/admin/orders" className={styles.backBtn}><ArrowLeft size={16} /> Quay lại</Link>
                </div>
            </div>
        );
    }

    const validNextStatuses = getValidNextStatuses(order.status);
    const paymentStatusOptions: PaymentStatus[] = [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.FAILED];

    return (
        <div className={styles.container}>
            {/* 1. Header Compact */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin/orders">Đơn hàng</Link> / <span>#{order.orderId.slice(0, 8)}</span>
                    </div>
                    <h1>Chi tiết #{order.orderId.slice(0, 8)}</h1>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <OrderStatusBadge status={order.status} />
                    <Link href="/admin/orders" className={styles.backBtn}>
                        <ArrowLeft size={16} /> Thoát
                    </Link>
                </div>
            </div>

            <div className={styles.layoutGrid}>
                {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM (Chiếm diện tích lớn) --- */}
                <div className={styles.mainColumn}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Package size={16} /> Sản phẩm ({order.items.reduce((sum, item) => sum + item.quantity, 0)})
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.itemsTable}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '45%' }}>Sản phẩm</th>
                                        <th style={{ width: '15%' }}>Giá</th>
                                        <th style={{ width: '10%' }}>SL</th>
                                        <th style={{ width: '15%' }}>Batch</th>
                                        <th style={{ width: '15%', textAlign: 'right' }}>Tổng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className={styles.productCell}>
                                                    <img src={item.productThumbnailSnapshot || '/placeholder.png'} alt="" className={styles.productImg} />
                                                    <span className={styles.productName}>{item.productNameSnapshot}</span>
                                                </div>
                                            </td>
                                            <td>{formatCurrency(item.priceAtPurchase)}</td>
                                            <td>x{item.quantity}</td>
                                            <td><code>{item.batchCode}</code></td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatCurrency(item.priceAtPurchase * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Ghi chú nếu có (Để bên trái cho đỡ chật cột phải) */}
                    {order.note && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}><FileText size={16} /> Ghi chú khách hàng</div>
                            <div className={styles.cardBody} style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#475569' }}>
                                "{order.note}"
                            </div>
                        </div>
                    )}
                </div>

                {/* --- CỘT PHẢI: ACTIONS & INFO (Sidebar Compact) --- */}
                <div className={styles.sidebarColumn}>

                    {/* A. ACTION CARD - QUAN TRỌNG NHẤT */}
                    <div className={styles.card} style={{ borderColor: '#bfdbfe', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}>
                        <div className={styles.cardHeader} style={{ background: '#eff6ff', color: '#1e40af' }}>
                            <CheckCircle size={16} /> Xử lý đơn hàng
                        </div>
                        <div className={styles.cardBody}>
                            {/* 1. Status Update */}
                            <div className={styles.actionGroup}>
                                <label className={styles.actionLabel}>Tiến độ giao vận</label>
                                {validNextStatuses.length > 0 ? (
                                    <>
                                        <select
                                            className={styles.selectInput}
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                                            disabled={updating}
                                        >
                                            <option value="">-- Chọn tiếp theo --</option>
                                            {validNextStatuses.map(st => (
                                                <option key={st} value={st}>{getOrderStatusLabel(st)}</option>
                                            ))}
                                        </select>
                                        <button
                                            className={styles.updateBtn}
                                            onClick={handleUpdateStatus}
                                            disabled={!selectedStatus || updating}
                                        >
                                            <Truck size={14} /> {updating ? 'Đang lưu...' : 'Cập nhật tiến độ'}
                                        </button>
                                    </>
                                ) : (
                                    order.status === OrderStatus.DELIVERED ? (
                                        <div style={{ fontSize: '0.85rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <CheckCircle size={14} /> {getOrderStatusLabel(order.status)}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <XCircle size={14} /> {getOrderStatusLabel(order.status)}
                                        </div>
                                    )
                                )}
                            </div>

                            <hr style={{ margin: '12px 0', border: 0, borderTop: '1px dashed #cbd5e1' }} />

                            {/* 2. Payment Update */}
                            <div className={styles.actionGroup}>
                                <label className={styles.actionLabel}>Trạng thái thanh toán</label>
                                <select
                                    className={styles.selectInput}
                                    value={selectedPaymentStatus}
                                    onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
                                    disabled={updatingPayment}
                                >
                                    {paymentStatusOptions.map(st => (
                                        <option key={st} value={st}>{getPaymentStatusLabel(st)}</option>
                                    ))}
                                </select>
                                <button
                                    className={`${styles.updateBtn} ${styles.paymentBtn}`}
                                    onClick={handleUpdatePaymentStatus}
                                    disabled={!selectedPaymentStatus || selectedPaymentStatus === order.paymentStatus || updatingPayment}
                                >
                                    <Wallet size={14} /> {updatingPayment ? 'Lưu...' : 'Cập nhật tiền'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* B. SUMMARY CARD */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><DollarSign size={16} /> Tổng quan</div>
                        <div className={styles.cardBody}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Tạm tính</span>
                                <span className={styles.infoValue}>{formatCurrency(order.totalAmount)}</span>
                            </div>
                            {/* Thêm phí ship/discount nếu có logic đó sau này */}
                            <hr style={{ margin: '8px 0', borderColor: '#f1f5f9' }} />
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel} style={{ fontWeight: 700, color: '#0f172a' }}>Thành tiền</span>
                                <span className={styles.infoValue} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e72a2a' }}>
                                    {formatCurrency(order.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* C. CUSTOMER & DELIVERY CARD */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><User size={16} /> Khách hàng & Giao nhận</div>
                        <div className={styles.cardBody}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Ngày đặt</span>
                                <span className={styles.infoValue}>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Khung giờ</span>
                                <span className={styles.infoValue}>{order.deliveryTimeSlot}</span>
                            </div>
                            <hr style={{ margin: '8px 0', borderColor: '#f1f5f9' }} />
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}><Phone size={12} /> SĐT</span>
                                <span className={styles.infoValue}>{order.deliveryPhone}</span>
                            </div>
                            <div className={styles.infoRow} style={{ alignItems: 'flex-start' }}>
                                <span className={styles.infoLabel} style={{ marginTop: 2 }}><MapPin size={12} /> Đ/C</span>
                                <span className={styles.infoValue}>{order.deliveryAddress}</span>
                            </div>
                        </div>
                    </div>

                    {/* D. PAYMENT INFO CARD */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><CreditCard size={16} /> Thông tin thanh toán</div>
                        <div className={styles.cardBody}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Phương thức</span>
                                <span className={styles.infoValue}>
                                    {order.paymentMethod === 'VNPAY' ? 'VNPAY' : 'Tiền mặt (COD)'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Trạng thái</span>
                                <span className={styles.infoValue} style={{ color: getPaymentStatusColor(order.paymentStatus) }}>
                                    {getPaymentStatusLabel(order.paymentStatus)}
                                </span>
                            </div>
                            {order.paymentDate && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Ngày TT</span>
                                    <span className={styles.infoValue}>
                                        {format(new Date(order.paymentDate), 'HH:mm dd/MM/yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}