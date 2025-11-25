'use client';

import { useEffect, useState } from 'react';
import { Package, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InventoryBatchDTO } from '../types';
import styles from '@/styles/admin/Inventory.module.css';

type Props = {
    batch: InventoryBatchDTO;
    onClose: () => void;
};

export default function BatchDetailsModal({ batch, onClose }: Props) {
    const { authedFetch } = useAuth();
    const [detailedBatch, setDetailedBatch] = useState<InventoryBatchDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBatchDetails();
    }, [batch.batchId]);

    const fetchBatchDetails = async () => {
        try {
            const response = await authedFetch(`/api/v1/admin/inventory/${batch.batchId}`);
            if (response.ok) {
                const data = await response.json();
                setDetailedBatch(data);
            }
        } catch (error) {
            console.error('Failed to fetch batch details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysUntilExpiry = (expirationDate: string) => {
        return Math.ceil(
            (new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2><Package size={24} /> Chi tiết lô hàng #{batch.batchId}</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.centerText}>Đang tải...</div>
                    ) : detailedBatch ? (
                        <>
                            <div className={styles.detailsGrid}>
                                <div className={styles.detailItem}>
                                    <label>Mã lô:</label>
                                    <span>{detailedBatch.batchCode || 'N/A'}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Sản phẩm:</label>
                                    <span>Product #{detailedBatch.productId}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Số lượng nhập:</label>
                                    <span>{detailedBatch.quantityReceived}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Số lượng hiện tại:</label>
                                    <span className={styles.highlight}>
                                        {detailedBatch.currentQuantity}
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Ngày nhập:</label>
                                    <span>
                                        {new Date(detailedBatch.entryDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Hạn sử dụng:</label>
                                    <span>
                                        {new Date(detailedBatch.expirationDate).toLocaleDateString('vi-VN')}
                                        {' '}
                                        <small>
                                            ({getDaysUntilExpiry(detailedBatch.expirationDate)} ngày)
                                        </small>
                                    </span>
                                </div>
                            </div>

                            {/* Adjustments History */}
                            {detailedBatch.adjustments && detailedBatch.adjustments.length > 0 && (
                                <div className={styles.adjustmentsSection}>
                                    <h3>Lịch sử điều chỉnh</h3>
                                    <table className={styles.miniTable}>
                                        <thead>
                                            <tr>
                                                <th>Thay đổi</th>
                                                <th>Lý do</th>
                                                <th>Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailedBatch.adjustments.map((adj, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <span
                                                            className={
                                                                adj.adjustmentQuantity > 0
                                                                    ? styles.positiveAdjustment
                                                                    : styles.negativeAdjustment
                                                            }
                                                        >
                                                            {adj.adjustmentQuantity > 0 ? '+' : ''}
                                                            {adj.adjustmentQuantity}
                                                        </span>
                                                    </td>
                                                    <td>{adj.reason}</td>
                                                    <td>
                                                        {new Date(adj.adjustmentDate).toLocaleString('vi-VN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.centerText}>Không tìm thấy dữ liệu.</div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.cancelButton}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
