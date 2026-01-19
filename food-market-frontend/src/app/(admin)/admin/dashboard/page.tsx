'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DollarSign, ShoppingBag, Users, AlertCircle, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import styles from '@/styles/admin/Dashboard.module.css';
import { 
  DashboardSummary, ChartData, OrderStatusStat, TopProduct, UrgentOrder 
} from '@/app/type/Dashboard';
import Link from 'next/link';

export default function AdminDashboard() {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // --- States for Data ---
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]); // Dữ liệu biểu đồ mới
  const [statusData, setStatusData] = useState<OrderStatusStat[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [newUsersCount, setNewUsersCount] = useState<number>(0);
  const [urgentOrders, setUrgentOrders] = useState<UrgentOrder[]>([]);

  // --- Filter State ---
  const [timeFilter, setTimeFilter] = useState<'1D' | '1W' | '1M'>('1W');

  // --- Logic tính toán ngày (Memoized) ---
  const { startDateIso, endDateIso, labelCurrent, labelPrev } = useMemo(() => {
    const now = new Date();
    let start, end;
    let lblCur = "", lblPrev = "";

    end = endOfDay(now);

    if (timeFilter === '1D') {
      start = startOfDay(now);
      lblCur = "Hôm nay";
      lblPrev = "Hôm qua";
    } else if (timeFilter === '1W') {
      start = startOfDay(subDays(now, 6));
      lblCur = "7 ngày qua";
      lblPrev = "7 ngày trước";
    } else {
      start = startOfDay(subDays(now, 29));
      lblCur = "30 ngày qua";
      lblPrev = "30 ngày trước";
    }

    return {
      startDateIso: start.toISOString(),
      endDateIso: end.toISOString(),
      labelCurrent: lblCur,
      labelPrev: lblPrev
    };
  }, [timeFilter]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const query = `?startDate=${startDateIso}&endDate=${endDateIso}`;

        const summaryPromise = authedFetch(`/api/v1/admin/dashboard/summary${query}`);
        
        const chartPromise = authedFetch(`/api/v1/admin/dashboard/revenue-chart${query}`);

        const statusPromise = authedFetch('/api/v1/admin/dashboard/order-status');
        const topProductsPromise = authedFetch(`/api/v1/admin/dashboard/top-products${query}&size=5`);
        const newUserPromise = authedFetch('/api/v1/admin/dashboard/new-users-count');
        const urgentOrderPromise = authedFetch('/api/v1/admin/orders/urgent?size=5');

        const responses = await Promise.all([
          summaryPromise, chartPromise, statusPromise, 
          topProductsPromise, newUserPromise, urgentOrderPromise
        ]);

        const [sumRes, chartRes, statRes, topRes, userRes, urgentRes] = responses;

        if (sumRes.ok) setSummary(await sumRes.json());
        if (chartRes.ok) setChartData(await chartRes.json());
        if (statRes.ok) setStatusData(await statRes.json());
        if (topRes.ok) setTopProducts(await topRes.json());
        if (userRes.ok) setNewUsersCount(await userRes.json());
        if (urgentRes.ok) setUrgentOrders(await urgentRes.json());

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authedFetch, startDateIso, endDateIso]);

  // --- Helpers ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

  const GrowthBadge = ({ percent }: { percent: number }) => {
    const isPositive = percent >= 0;
    return (
      <div className={`${styles.growthBadge} ${isPositive ? styles.growthUp : styles.growthDown}`}>
        {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        <span>{Math.abs(percent).toFixed(1)}%</span>
        <span className={styles.growthLabel}>vs kỳ trước</span>
      </div>
    );
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d32f2f'];

  if (loading) return <div style={{padding: 20}}>Đang tải dữ liệu thống kê...</div>;

  return (
    <div className={styles.container}>
      {/* Header & Filter */}
      <div className={styles.header}>
        <h1>Tổng quan Dashboard</h1>
        
        {/* Bộ lọc mới dạng Buttons */}
        <div className={styles.filterBox}>
          <button 
            className={timeFilter === '1D' ? styles.activeBtn : ''} 
            onClick={() => setTimeFilter('1D')}
          >
            Hôm nay
          </button>
          <button 
            className={timeFilter === '1W' ? styles.activeBtn : ''} 
            onClick={() => setTimeFilter('1W')}
          >
            7 Ngày
          </button>
          <button 
            className={timeFilter === '1M' ? styles.activeBtn : ''} 
            onClick={() => setTimeFilter('1M')}
          >
            30 Ngày
          </button>
        </div>
      </div>

      {/* 1. KPI Cards Row */}
      <div className={styles.statsGrid}>
        {/* Doanh thu */}
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Tổng doanh thu</h3>
            <div className={styles.value}>
              {summary ? formatCurrency(summary.currentRevenue) : '0 ₫'}
            </div>
            {/* Badge so sánh */}
            {summary && <GrowthBadge percent={summary.revenueGrowth} />}
          </div>
          <div className={`${styles.iconBox} ${styles.green}`}>
            <DollarSign size={24} />
          </div>
        </div>

        {/* Đơn hàng */}
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Tổng đơn hàng</h3>
            <div className={styles.value}>{summary?.currentOrders || 0}</div>
             {/* Badge so sánh */}
             {summary && <GrowthBadge percent={summary.ordersGrowth} />}
          </div>
          <div className={`${styles.iconBox} ${styles.blue}`}>
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Khách hàng mới */}
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Khách hàng mới (24h)</h3>
            <div className={styles.value}>{newUsersCount}</div>
          </div>
          <div className={`${styles.iconBox} ${styles.purple}`}>
            <Users size={24} />
          </div>
        </div>

        {/* Đơn gấp */}
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Đơn cần xử lý gấp</h3>
            <div className={styles.value} style={{color: '#d32f2f'}}>
              {urgentOrders.length}
            </div>
          </div>
          <div className={`${styles.iconBox} ${styles.orange}`}>
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* 2. Charts Row */}
      <div className={styles.chartsGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
             Biểu đồ doanh thu ({labelCurrent})
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  style={{ fontSize: '0.8rem' }}
                  tick={{fill: '#666'}}
                />
                <YAxis 
                  tickFormatter={(val) => val >= 1000000 ? `${val/1000000}M` : `${val/1000}k`} 
                  style={{ fontSize: '0.8rem' }}
                  tick={{fill: '#666'}}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                
                <Line 
                  name={labelCurrent}
                  type="monotone" 
                  dataKey="currentRevenue" 
                  stroke="#2e7d32" 
                  strokeWidth={3} 
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }} 
                />
                
                <Line 
                  name={labelPrev}
                  type="monotone" 
                  dataKey="previousRevenue" 
                  stroke="#999" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Trạng thái đơn hàng */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>Trạng thái đơn hàng</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row (Tables) */}
      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>Top 5 Sản phẩm bán chạy</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Đã bán</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.productId}>
                  <td>
                    <div className={styles.productCell}>
                      <img 
                        src={product.productImage || '/placeholder-food.png'} 
                        alt={product.productName} 
                        className={styles.productImg} 
                      />
                      <span>{product.productName}</span>
                    </div>
                  </td>
                  <td>{product.totalSold}</td>
                  <td>{formatCurrency(product.totalRevenue)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr><td colSpan={3}>Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>Đơn hàng cần xử lý ngay</div>
          <div>
            {urgentOrders.map((order) => (
              <div key={order.orderId} className={styles.urgentItem}>
                <div className={styles.urgentInfo}>
                  <h4>#{order.orderId.slice(0, 8)}... - {formatCurrency(order.totalAmount)}</h4>
                  <p>{format(new Date(order.createdAt), 'HH:mm dd/MM', { locale: vi })} • {order.deliveryTimeSlot}</p>
                </div>
                <Link 
                  href={`/admin/orders/${order.orderId}`}
                  className={styles.urgentAction}
                >
                  Xem ngay
                </Link>
              </div>
            ))}
            {urgentOrders.length === 0 && (
              <p style={{color: '#666', textAlign: 'center', marginTop: 20}}>
                Tuyệt vời! Không có đơn gấp.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}