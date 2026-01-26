'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Search, RefreshCw, Eye, ChevronLeft, ChevronRight,
    ShoppingBag, Clock, CheckCircle, ArrowUp, ArrowDown
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
    const [date, setDate] = useState('');
    const [statusTab, setStatusTab] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 25;

    // Time Range for Stats AND Order Filtering
    const [timeRange, setTimeRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

    // Sorting
    const [sortField, setSortField] = useState<'createdAt' | 'totalAmount' | 'status'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders(0, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword, date, statusTab]);

    // Re-fetch when page changes
    useEffect(() => {
        fetchOrders(page, true);
    }, [page]);

    // Re-fetch when sorting changes (no loading flash)
    useEffect(() => {
        fetchOrders(0, false);
    }, [sortField, sortDirection]);

    // Re-fetch when time range changes
    useEffect(() => {
        fetchOrders(0, true);
        fetchStats();
    }, [timeRange]);

    const fetchOrders = async (pageIndex: number, showLoading: boolean = true) => {
        if (showLoading) setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', pageIndex.toString());
            params.append('size', PAGE_SIZE.toString());
            if (keyword) params.append('keyword', keyword);

            // Time range filter (if not ALL and no specific date selected)
            if (timeRange !== 'ALL' && !date) {
                const now = new Date();
                let fromDate: Date;

                switch (timeRange) {
                    case 'TODAY':
                        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'WEEK':
                        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'MONTH':
                        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        fromDate = now;
                }

                const formatDate = (d: Date) => d.toISOString().split('T')[0];
                params.append('dateFrom', formatDate(fromDate));
                params.append('dateTo', formatDate(now));
            } else if (date) {
                params.append('dateFrom', date);
                params.append('dateTo', date);
            }

            if (statusTab) params.append('statuses', statusTab);

            // Dynamic sorting
            params.append('sort', `${sortField},${sortDirection}`);

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
            const res = await authedFetch(`/api/v1/admin/orders/stats?timeRange=${timeRange}`);
            if (res.ok) {
                const data = await res.json();
                setStats({
                    totalToday: data.totalOrders,
                    pending: data.pendingOrders,
                    delivered: data.deliveredOrders
                });
            }
        } catch (e) { console.error(e); }
    };

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, default to descending
            setSortField(field);
            setSortDirection('desc');
        }
        setPage(0); // Reset to first page when sorting changes
    };

    const renderSortIcon = (field: typeof sortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ?
            <ArrowUp className={styles.sortIcon} size={12} /> :
            <ArrowDown className={styles.sortIcon} size={12} />;
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

                {/* Time Range Selector */}
                <div className={styles.timeRangeSelector}>
                    <button
                        className={`${styles.timeRangeBtn} ${timeRange === 'ALL' ? styles.active : ''}`}
                        onClick={() => setTimeRange('ALL')}
                    >
                        Tất cả
                    </button>
                    <button
                        className={`${styles.timeRangeBtn} ${timeRange === 'TODAY' ? styles.active : ''}`}
                        onClick={() => setTimeRange('TODAY')}
                    >
                        Hôm nay
                    </button>
                    <button
                        className={`${styles.timeRangeBtn} ${timeRange === 'WEEK' ? styles.active : ''}`}
                        onClick={() => setTimeRange('WEEK')}
                    >
                        7 ngày
                    </button>
                    <button
                        className={`${styles.timeRangeBtn} ${timeRange === 'MONTH' ? styles.active : ''}`}
                        onClick={() => setTimeRange('MONTH')}
                    >
                        30 ngày
                    </button>
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
                        <span className={styles.statLabel}>Tổng:</span>
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

            {/* 3. MAIN TABLE*/}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loadingOverlay}>Đang tải dữ liệu...</div>
                ) : orders.length === 0 ? (
                    <div className={styles.emptyState}>Không tìm thấy đơn hàng nào.</div>
                ) : (
                    <table className={styles.compactTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '90px' }}>Mã đơn</th>
                                <th
                                    className={styles.sortableHeader}
                                    style={{ width: '110px' }}
                                    onClick={() => handleSort('createdAt')}
                                >
                                    Ngày tạo {renderSortIcon('createdAt')}
                                </th>
                                <th style={{ width: '180px' }}>Khách hàng</th>
                                <th style={{ width: 'auto' }}>Sản phẩm (Tóm tắt)</th>
                                <th
                                    className={styles.sortableHeader}
                                    style={{ width: '120px', textAlign: 'right' }}
                                    onClick={() => handleSort('totalAmount')}
                                >
                                    Tổng tiền {renderSortIcon('totalAmount')}
                                </th>
                                <th
                                    className={styles.sortableHeader}
                                    style={{ width: '110px', textAlign: 'center' }}
                                    onClick={() => handleSort('status')}
                                >
                                    Trạng thái {renderSortIcon('status')}
                                </th>
                                <th style={{ width: '50px', textAlign: 'center' }}>#</th>
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