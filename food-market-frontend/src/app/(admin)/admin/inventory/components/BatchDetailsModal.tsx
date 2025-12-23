'use client';

import { useEffect, useState } from 'react';
import { Package, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InventoryBatchDTO } from '../types';
import styles from './InventoryModals.module.css'; // Dùng file css chung

type Props = {
    batch: InventoryBatchDTO;
    onClose: () => void;
};

export default function BatchDetailsModal({ batch, onClose }: Props) {
    const { authedFetch } = useAuth();
    const [detailedBatch, setDetailedBatch] = useState<InventoryBatchDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBatchDetails = async () => {
            try {
                const response = await authedFetch(`/api/v1/admin/inventory/${batch.batchId}`);
                if (response.ok) {
                    const data = await response.json();
                    setDetailedBatch(data);
                }
            } catch (error) {
                console.error('Failed to fetch details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBatchDetails();
    }, [batch.batchId, authedFetch]);

    const getDaysText = (dateStr: string) => {
        const days = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (86400000));
        return days < 0 ? `(Hết hạn ${Math.abs(days)} ngày)` : `(Còn ${days} ngày)`;
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2><Package size={18} /> Chi tiết lô #{batch.batchId}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
                </div>

                <div className={styles.body}>
                    {loading ? (
                        <div style={{textAlign:'center', padding:'20px'}}>Đang tải...</div>
                    ) : detailedBatch ? (
                        <>
                            {/* Grid Info Compact */}
                            <div className={styles.grid}>
                                <div><span className={styles.label}>Mã lô</span><div className={styles.value}>{detailedBatch.batchCode || 'N/A'}</div></div>
                                <div><span className={styles.label}>Sản phẩm</span><div className={styles.value} title={detailedBatch.productName}>{detailedBatch.productName}</div></div>
                                
                                <div>
                                    <span className={styles.label}>Tồn kho / Tổng nhập</span>
                                    <div className={styles.value}>
                                        <span className={styles.highlight}>{detailedBatch.currentQuantity}</span> 
                                        <span style={{color:'#9ca3af'}}> / {detailedBatch.quantityReceived}</span>
                                    </div>
                                </div>
                                <div><span className={styles.label}>Ngày nhập</span><div className={styles.value}>{new Date(detailedBatch.entryDate).toLocaleDateString('vi-VN')}</div></div>
                                
                                <div className={styles.fullWidth}>
                                    <span className={styles.label}>Hạn sử dụng</span>
                                    <div className={styles.value}>
                                        {new Date(detailedBatch.expirationDate).toLocaleDateString('vi-VN')} 
                                        <span style={{marginLeft:'8px', fontSize:'0.8em', color: getDaysText(detailedBatch.expirationDate).includes('Hết')?'red':'green'}}>
                                            {getDaysText(detailedBatch.expirationDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Adjustment History Scrollable Area */}
                            {detailedBatch.adjustments && detailedBatch.adjustments.length > 0 && (
                                <div style={{marginTop:'8px'}}>
                                    <span className={styles.label}>Lịch sử điều chỉnh gần đây</span>
                                    <div className={styles.scrollArea}>
                                        <table className={styles.miniTable}>
                                            <thead>
                                                <tr>
                                                    <th>SL</th>
                                                    <th>Lý do</th>
                                                    <th>Ngày</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailedBatch.adjustments.map((adj, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{color: adj.adjustmentQuantity > 0 ? '#10b981' : '#ef4444', fontWeight:600}}>
                                                            {adj.adjustmentQuantity > 0 ? '+' : ''}{adj.adjustmentQuantity}
                                                        </td>
                                                        <td>{adj.reason}</td>
                                                        <td>{new Date(adj.adjustmentDate).toLocaleDateString('vi-VN')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{textAlign:'center'}}>Không có dữ liệu.</div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`}>Đóng</button>
                </div>
            </div>
        </div>
    );
}