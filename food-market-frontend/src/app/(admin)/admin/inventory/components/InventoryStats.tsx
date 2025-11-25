'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Boxes, TrendingDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/admin/Inventory.module.css';

type StatsData = {
    totalBatches: number;
    expiringSoon: number;
    totalValue: number;
    lowStock: number;
};

export default function InventoryStats() {
    const { authedFetch } = useAuth();
    const [stats, setStats] = useState<StatsData>({
        totalBatches: 0,
        expiringSoon: 0,
        totalValue: 0,
        lowStock: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch all batches to calculate stats
            const response = await authedFetch('/api/v1/admin/inventory?size=1000');
            if (response.ok) {
                const data = await response.json();
                const batches = data.content || [];

                // Calculate statistics
                const totalBatches = batches.length;
                const expiringSoon = batches.filter((batch: any) => {
                    const daysUntilExpiry = Math.ceil(
                        (new Date(batch.expirationDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
                }).length;

                const lowStock = batches.filter(
                    (batch: any) => batch.currentQuantity < 10
                ).length;

                // For demo purposes, calculate a simple total value
                // In production, you'd need product prices multiplied by quantity
                const totalValue = batches.reduce(
                    (sum: number, batch: any) => sum + batch.currentQuantity,
                    0
                );

                setStats({
                    totalBatches,
                    expiringSoon,
                    totalValue,
                    lowStock,
                });
            }
        } catch (error) {
            console.error('Failed to fetch inventory stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={styles.skeleton}></div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.skeleton}></div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.skeleton}></div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.skeleton}></div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.statsContainer}>
            <div className={`${styles.statCard} ${styles.primary}`}>
                <div className={styles.statIcon}><Package size={24} /></div>
                <div className={styles.statContent}>
                    <div className={styles.statValue}>{stats.totalBatches}</div>
                    <div className={styles.statLabel}>Tổng số lô hàng</div>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.warning}`}>
                <div className={styles.statIcon}><AlertTriangle size={24} /></div>
                <div className={styles.statContent}>
                    <div className={styles.statValue}>{stats.expiringSoon}</div>
                    <div className={styles.statLabel}>Sắp hết hạn (&lt; 7 ngày)</div>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.success}`}>
                <div className={styles.statIcon}><Boxes size={24} /></div>
                <div className={styles.statContent}>
                    <div className={styles.statValue}>
                        {new Intl.NumberFormat('vi-VN').format(stats.totalValue)}
                    </div>
                    <div className={styles.statLabel}>Tổng số lượng</div>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.danger}`}>
                <div className={styles.statIcon}><TrendingDown size={24} /></div>
                <div className={styles.statContent}>
                    <div className={styles.statValue}>{stats.lowStock}</div>
                    <div className={styles.statLabel}>Tồn kho thấp (&lt; 10)</div>
                </div>
            </div>
        </div>
    );
}
