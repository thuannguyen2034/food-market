'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Search, RefreshCw, Eye, ChevronLeft, ChevronRight,
    ShoppingBag, Clock, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import styles from '@/styles/admin/Orders.module.css';
import { OrderDTO, OrderStatus } from '@/app/type/Order';
import OrderStatusBadge from './components/OrderStatusBadge';

type PageResponse = {
    content: OrderDTO[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
};

// Tab chọn nhanh trạng thái
const STATUS_TABS = [
    { label: 'Tất cả', value: '' },
    { label: 'Chờ xử lý', value: OrderStatus.PENDING },
    { label: 'Đang giao', value: OrderStatus.OUT_FOR_DELIVERY },
    { label: 'Đã giao', value: OrderStatus.DELIVERED },
    { label: 'Đã hủy', value: OrderStatus.CANCELLED },
];

export default function OrdersPage() {
    const { authedFetch } = useAuth();
    
    // Core Data
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<OrderDTO[]>([]);
    const [pageData, setPageData] = useState<PageResponse | null>(null);
    const [stats, setStats] = useState({ totalToday: 0, pending: 0, delivered: 0 });

    // Filter State
    const [keyword, setKeyword] = useState('');
    const [date, setDate] = useState(''); // Chỉ lọc theo 1 ngày cụ thể hoặc để trống
    const [statusTab, setStatusTab] = useState(''); // Single select cho nhanh
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 25; // Compact mode -> show more

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword, date, statusTab]);

    // Re-fetch when page changes
    useEffect(() => {
        fetchOrders(page);
    }, [page]);

    // Initial load
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchOrders = async (pageIndex: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', pageIndex.toString());
            params.append('size', PAGE_SIZE.toString());
            if (keyword) params.append('keyword', keyword);
            if (date) {
                // Nếu chọn ngày, lọc from = to = date
                params.append('dateFrom', date);
                params.append('dateTo', date);
            }
            if (statusTab) params.append('statuses', statusTab);
            
            // Mặc định sắp xếp mới nhất
            params.append('sort', 'createdAt,desc');

            const response = await authedFetch(`/api/v1/admin/orders?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setOrders(data.content);
                setPageData(data);
                setPage(data.number);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await authedFetch('/api/v1/admin/dashboard/order-status');
            if (res.ok) {
                const data: { status: string; count: number }[] = await res.json();
                // Tính toán đơn giản
                const total = data.reduce((s, i) => s + i.count, 0);
                const pending = data.find(s => s.status === 'PENDING')?.count || 0;
                const delivered = data.find(s => s.status === 'DELIVERED')?.count || 0;
                setStats({ totalToday: total, pending, delivered });
            }
        } catch (e) { console.error(e); }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

    return (
        <div className={styles.container}>
            {/* 1. COMPACT HEADER & STATS */}
            <div className={styles.topBar}>
                <div className={styles.pageTitle}>
                    <ShoppingBag size={20} /> Đơn hàng
                </div>
                
                {/* Mini Stats Strip */}
                <div className={styles.statsStrip}>
                    <div className={`${styles.miniStat} ${styles.statPending}`}>
                        <Clock size={14} className={styles.statLabel} />
                        <span className={styles.statLabel}>Chờ xử lý:</span>
                        <span className={styles.statValue}>{stats.pending}</span>
                    </div>
                    <div className={`${styles.miniStat} ${styles.statDone}`}>
                        <CheckCircle size={14} className={styles.statLabel} />
                        <span className={styles.statLabel}>Đã giao:</span>
                        <span className={styles.statValue}>{stats.delivered}</span>
                    </div>
                    <div className={styles.miniStat}>
                        <span className={styles.statLabel}>Tổng hôm nay:</span>
                        <span className={styles.statValue}>{stats.totalToday}</span>
                    </div>
                </div>
            </div>

            {/* 2. FILTER TOOLBAR (Horizontal) */}
            <div className={styles.filterToolbar}>
                {/* Search */}
                <div className={styles.searchBox}>
                    <Search className={styles.searchIcon} size={16} />
                    <input
                        className={styles.inputField}
                        placeholder="Tìm SĐT, Mã đơn, Tên..."
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                    />
                </div>

                {/* Quick Date */}
                <input 
                    type="date" 
                    className={styles.dateInput}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    title="Lọc theo ngày tạo"
                />

                {/* Status Tabs */}
                <div className={styles.statusTabs}>
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            className={`${styles.tabBtn} ${statusTab === tab.value ? styles.active : ''}`}
                            onClick={() => setStatusTab(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button className={styles.refreshBtn} onClick={() => { fetchOrders(0); fetchStats(); }}>
                    <RefreshCw size={14} /> Làm mới
                </button>
            </div>

            {/* 3. MAIN TABLE (Full height, scrollable) */}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loadingOverlay}>Đang tải dữ liệu...</div>
                ) : orders.length === 0 ? (
                    <div className={styles.emptyState}>Không tìm thấy đơn hàng nào.</div>
                ) : (
                    <table className={styles.compactTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '100px' }}>Mã đơn</th>
                                <th style={{ width: '130px' }}>Ngày tạo</th>
                                <th>Khách hàng</th>
                                <th>Sản phẩm (Tóm tắt)</th>
                                <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                <th className={styles.colAction}>#</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.orderId}>
                                    <td className={styles.colId}>
                                        #{order.orderId.slice(0, 8)}
                                    </td>
                                    <td>
                                        {format(new Date(order.createdAt), 'dd/MM HH:mm', { locale: vi })}
                                    </td>
                                    <td>
                                        <div className={styles.customerInfo}>
                                            <span style={{ fontWeight: 500 }}>{order.deliveryAddress.split(',').pop()?.trim() || 'Khách lẻ'}</span>
                                            <span className={styles.customerPhone}>{order.deliveryPhone}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#64748b', maxWidth: '300px' }} className="truncate">
                                        {/* Logic hiển thị tóm tắt sản phẩm */}
                                        {order.items.length} món: {order.items.map(i => i.productNameSnapshot).join(', ').slice(0, 50)}...
                                    </td>
                                    <td className={styles.colAmount}>
                                        {formatCurrency(order.totalAmount)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className={styles.colAction}>
                                        <Link href={`/admin/orders/${order.orderId}`}>
                                            <button className={styles.viewBtn} title="Xem chi tiết">
                                                <Eye size={18} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 4. PAGINATION COMPACT */}
            {pageData && (
                <div className={styles.paginationBar}>
                    <span>
                        Hiển thị <b>{orders.length}</b> / {pageData.totalElements} đơn
                    </span>
                    <div className={styles.pageControls}>
                        <button 
                            className={styles.pageBtn} 
                            disabled={pageData.number === 0}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ padding: '4px 8px', fontSize: '0.9rem' }}>
                            Trang {pageData.number + 1}
                        </span>
                        <button 
                            className={styles.pageBtn} 
                            disabled={pageData.number >= pageData.totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}