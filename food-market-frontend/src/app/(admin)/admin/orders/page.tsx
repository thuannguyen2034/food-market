'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    ShoppingBag,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    RefreshCw,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import styles from '@/styles/admin/Orders.module.css';
import { OrderDTO, OrderFilter, OrderStatus } from '@/app/type/Order';
import OrderStatusBadge from './components/OrderStatusBadge';

type PageResponse = {
    content: OrderDTO[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
};

export default function OrdersPage() {
    const { authedFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<OrderDTO[]>([]);
    const [pageData, setPageData] = useState<PageResponse | null>(null);

    // Stats
    const [stats, setStats] = useState({
        totalToday: 0,
        pendingCount: 0,
        deliveredToday: 0,
        cancelledTotal: 0
    });

    // Filter & Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [filter, setFilter] = useState<OrderFilter>({
        keyword: '',
        dateFrom: '',
        dateTo: '',
        statuses: []
    });

    // Fetch orders
    const fetchOrders = async (page = 0) => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', '10');

            if (filter.keyword) params.append('keyword', filter.keyword);
            if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
            if (filter.dateTo) params.append('dateTo', filter.dateTo);
            if (filter.statuses && filter.statuses.length > 0) {
                filter.statuses.forEach(status => params.append('statuses', status));
            }

            const response = await authedFetch(`/api/v1/admin/orders?${params.toString()}`);
            if (response.ok) {
                const data: PageResponse = await response.json();
                setOrders(data.content);
                setPageData(data);
                setCurrentPage(data.number);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            // Get today's date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            // Fetch order status stats
            const statusRes = await authedFetch('/api/v1/admin/dashboard/order-status');
            if (statusRes.ok) {
                const statusData: { status: string; count: number }[] = await statusRes.json();

                setStats({
                    totalToday: statusData.reduce((sum, s) => sum + s.count, 0),
                    pendingCount: statusData.find(s => s.status === 'PENDING' || s.status === 'CONFIRMED')?.count || 0,
                    deliveredToday: statusData.find(s => s.status === 'DELIVERED')?.count || 0,
                    cancelledTotal: statusData.find(s => s.status === 'CANCELLED')?.count || 0
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, []);

    const handleSearch = () => {
        fetchOrders(0);
    };

    const handleReset = () => {
        setFilter({
            keyword: '',
            dateFrom: '',
            dateTo: '',
            statuses: []
        });
        setTimeout(() => fetchOrders(0), 100);
    };

    const handlePageChange = (newPage: number) => {
        fetchOrders(newPage);
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1>Quản lý Đơn hàng</h1>
                <button className={styles.btnSecondary} onClick={() => { fetchOrders(currentPage); fetchStats(); }}>
                    <RefreshCw size={16} />
                    Làm mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <h3>Tổng đơn hôm nay</h3>
                        <div className={styles.value}>{stats.totalToday}</div>
                    </div>
                    <div className={`${styles.iconBox} ${styles.blue}`}>
                        <ShoppingBag size={24} />
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <h3>Đang xử lý</h3>
                        <div className={styles.value}>{stats.pendingCount}</div>
                    </div>
                    <div className={`${styles.iconBox} ${styles.orange}`}>
                        <Clock size={24} />
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <h3>Hoàn thành hôm nay</h3>
                        <div className={styles.value}>{stats.deliveredToday}</div>
                    </div>
                    <div className={`${styles.iconBox} ${styles.green}`}>
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <h3>Đơn đã hủy</h3>
                        <div className={styles.value}>{stats.cancelledTotal}</div>
                    </div>
                    <div className={`${styles.iconBox} ${styles.red}`}>
                        <XCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Main Content: Table + Filter (2 columns) */}
            <div className={styles.mainContent}>
                {/* Order Table - Left Side */}
                <div className={styles.tableCard}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <p>Đang tải danh sách đơn hàng...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <ShoppingBag size={48} />
                            <h3>Không có đơn hàng nào</h3>
                            <p>Thử điều chỉnh bộ lọc của bạn</p>
                        </div>
                    ) : (
                        <>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Thời gian</th>
                                        <th>Khách hàng</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.orderId}>
                                            <td>
                                                <span className={styles.orderIdCell}>
                                                    #{order.orderId.slice(0, 8)}
                                                </span>
                                            </td>
                                            <td>
                                                {format(new Date(order.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                            </td>
                                            <td>
                                                <div className={styles.customerCell}>
                                                    <span className={styles.customerPhone}>{order.deliveryPhone}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#999' }}>
                                                        {order.deliveryAddress.slice(0, 30)}...
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.amountCell}>
                                                {formatCurrency(order.totalAmount)}
                                            </td>
                                            <td>
                                                <OrderStatusBadge status={order.status} />
                                            </td>
                                            <td>
                                                <Link href={`/admin/orders/${order.orderId}`}>
                                                    <button className={styles.btnPrimary}>
                                                        Xem chi tiết
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {pageData && pageData.totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <div className={styles.pageInfo}>
                                        Hiển thị {pageData.number * pageData.size + 1} - {Math.min((pageData.number + 1) * pageData.size, pageData.totalElements)} / {pageData.totalElements} đơn hàng
                                    </div>
                                    <div className={styles.pageControls}>
                                        <button
                                            className={styles.pageBtn}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 0}
                                        >
                                            Trước
                                        </button>
                                        {Array.from({ length: Math.min(5, pageData.totalPages) }, (_, i) => {
                                            const page = i + Math.max(0, currentPage - 2);
                                            if (page >= pageData.totalPages) return null;
                                            return (
                                                <button
                                                    key={page}
                                                    className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page + 1}
                                                </button>
                                            );
                                        })}
                                        <button
                                            className={styles.pageBtn}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= pageData.totalPages - 1}
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Filter Section - Right Side */}
                <div className={styles.filterCard}>
                    <h3 className={styles.filterTitle}>Bộ lọc</h3>
                    <div className={styles.filterGroup}>
                        <label>Tìm kiếm</label>
                        <input
                            type="text"
                            placeholder="Mã đơn, SĐT, tên khách..."
                            value={filter.keyword}
                            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Từ ngày</label>
                        <input
                            type="date"
                            value={filter.dateFrom}
                            onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Đến ngày</label>
                        <input
                            type="date"
                            value={filter.dateTo}
                            onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Trạng thái</label>
                        <select
                            multiple
                            value={filter.statuses || []}
                            onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value as OrderStatus);
                                setFilter({ ...filter, statuses: selected });
                            }}
                            style={{ height: '150px' }}
                        >
                            <option value={OrderStatus.PENDING}>Chờ xử lý</option>
                            <option value={OrderStatus.CONFIRMED}>Đã xác nhận</option>
                            <option value={OrderStatus.PROCESSING}>Đang đóng gói</option>
                            <option value={OrderStatus.OUT_FOR_DELIVERY}>Đang giao</option>
                            <option value={OrderStatus.DELIVERED}>Đã giao</option>
                            <option value={OrderStatus.CANCELLED}>Đã hủy</option>
                        </select>
                        <small style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                            Giữ Ctrl để chọn nhiều
                        </small>
                    </div>

                    <div className={styles.filterActions}>
                        <button className={styles.btnSecondary} onClick={handleReset}>
                            Đặt lại
                        </button>
                        <button className={styles.btnPrimary} onClick={handleSearch}>
                            <Search size={16} />
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
