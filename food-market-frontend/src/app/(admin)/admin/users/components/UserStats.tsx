'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, ShoppingCart, Shield, UserPlus } from 'lucide-react';
import styles from '@/styles/admin/Users.module.css';

type StatsData = {
    totalUsers: number;
    totalCustomers: number;
    totalAdmins: number;
    newUsersThisMonth: number;
};

export default function UserStats() {
    const { authedFetch } = useAuth();
    const [stats, setStats] = useState<StatsData>({
        totalUsers: 0,
        totalCustomers: 0,
        totalAdmins: 0,
        newUsersThisMonth: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch all users to calculate stats
            const response = await authedFetch('/api/v1/admin/users?size=1000');
            if (response.ok) {
                const data = await response.json();
                const users = data.content || [];

                const totalUsers = users.length;
                const totalCustomers = users.filter((u: any) => u.role === 'CUSTOMER').length;
                const totalAdmins = users.filter((u: any) => u.role === 'ADMIN').length;

                // Calculate new users this month
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const newUsersThisMonth = users.filter((u: any) => {
                    const createdDate = new Date(u.createdAt);
                    return createdDate >= firstDayOfMonth;
                }).length;

                setStats({
                    totalUsers,
                    totalCustomers,
                    totalAdmins,
                    newUsersThisMonth,
                });
            }
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.statsContainer}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.skeleton}></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={styles.statsContainer}>
            <div className={`${styles.statCard} ${styles.primary}`}>
                <div className={styles.statIcon}><Users size={24} /></div>
                <div className={styles.statContent}>
                    <div className={styles.statValue}>{stats.totalUsers}</div>
                    <div className={styles.statLabel}>Tổng số Users</div>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.success}`}>
                <div className={styles.statIcon}><ShoppingCart size={24} /></div>
                <div className={styles.statContent}>
                    <div className={styles.statValue}>{stats.totalCustomers}</div>
                    <div className={styles.statLabel}>Customers</div>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.danger}`}>
                <div className={styles.statIcon}><Shield size={24} /></div>
                <div className={styles.statContent}>
                    <div className={styles.statValue}>{stats.totalAdmins}</div>
                    <div className={styles.statLabel}>Admins</div>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.warning}`}>
                <div className={styles.statIcon}><UserPlus size={24} /></div>
                <div className={styles.statContent}>
                    <div className={styles.statValue}>{stats.newUsersThisMonth}</div>
                    <div className={styles.statLabel}>Mới tháng này</div>
                </div>
            </div>
        </div>
    );
}
