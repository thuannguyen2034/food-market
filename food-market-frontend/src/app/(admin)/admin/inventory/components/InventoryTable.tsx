'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InventoryBatchDTO, PageResponse } from '../types';
import BatchDetailsModal from './BatchDetailsModal';
import AdjustStockModal from './AdjustStockModal';
import DestroyBatchModal from './DestroyBatchModal';
import styles from '../InventoryPage.module.css'; 

type Props = {
    refreshTrigger?: number;
    onRefresh?: () => void;
};

export default function InventoryTable({ refreshTrigger, onRefresh }: Props) {
    const { authedFetch } = useAuth();
    const [dataPage, setDataPage] = useState<PageResponse<InventoryBatchDTO> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [daysThreshold, setDaysThreshold] = useState<string>('');
    
    // Modal states
    const [selectedBatch, setSelectedBatch] = useState<InventoryBatchDTO | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showDestroyModal, setShowDestroyModal] = useState(false);

    const pageSize = 20; // Tăng size vì bảng đã compact

    const fetchBatches = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', pageSize.toString());
            // Backend hỗ trợ filter theo daysThreshold
            if (daysThreshold) {
                params.append('daysThreshold', daysThreshold);
            }

            const response = await authedFetch(`/api/v1/admin/inventory?${params.toString()}`);

            if (response.ok) {
                const data: PageResponse<InventoryBatchDTO> = await response.json();
                setDataPage(data);
            }
        } catch (error) {
            console.error('Failed to fetch inventory batches:', error);
        }
        setLoading(false);
    }, [authedFetch, page, daysThreshold]);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches, refreshTrigger]);

    // Handlers
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchBatches();
    };

    const handleRefresh = () => {
        fetchBatches();
        onRefresh?.();
    };

    // Helper logic tính ngày hết hạn
    const getDaysUntilExpiry = (expirationDate: string) => {
        return Math.ceil(
            (new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
    };

    // Helper xác định class màu sắc cho dòng
    const getRowClass = (expirationDate: string) => {
        const days = getDaysUntilExpiry(expirationDate);
        if (days < 0) return styles.expired; // Đỏ nhạt nền (định nghĩa trong css chung)
        if (days <= 3) return styles.criticalExpiry; // Chữ đỏ
        if (days <= 7) return styles.warningExpiry; // Chữ cam
        return '';
    };

    const renderTableBody = () => {
        if (loading) return <tr><td colSpan={7} style={{textAlign:'center'}}>Đang tải dữ liệu...</td></tr>;
        if (!dataPage || dataPage.content.length === 0) return <tr><td colSpan={7} style={{textAlign:'center'}}>Không tìm thấy lô hàng nào.</td></tr>;

        return dataPage.content.map((batch) => {
            const daysLeft = getDaysUntilExpiry(batch.expirationDate);
            const rowClass = getRowClass(batch.expirationDate);

            return (
                <tr key={batch.batchId} className={rowClass}>
                    <td>{batch.batchId}</td>
                    
                    {/* Kết hợp Mã lô và icon cảnh báo nếu sắp hết hạn */}
                    <td>
                        <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                            {batch.batchCode || '-'}
                            {daysLeft <= 3 && <AlertCircle size={14} color="#ef4444" />}
                        </div>
                    </td>
                    
                    <td title={batch.productName} style={{maxWidth:'200px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {batch.productName}
                    </td>
                    
                    {/* Cột số lượng gộp: Hiện tại / Tổng nhập */}
                    <td>
                        <span style={{fontWeight: 600}}>{batch.currentQuantity}</span>
                        <span style={{color: '#9ca3af', fontSize: '0.8em'}}> / {batch.quantityReceived}</span>
                    </td>
                    
                    <td>{new Date(batch.entryDate).toLocaleDateString('vi-VN')}</td>
                    
                    {/* Hạn sử dụng với Tooltip */}
                    <td title={daysLeft < 0 ? `Đã hết hạn ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`}>
                        {new Date(batch.expirationDate).toLocaleDateString('vi-VN')}
                    </td>
                    
                    <td className={styles.actions}>
                        <button 
                            onClick={() => { setSelectedBatch(batch); setShowDetailsModal(true); }}
                            className={styles.actionBtn} title="Xem chi tiết"
                        >
                            <Eye size={16} />
                        </button>
                        <button 
                            onClick={() => { setSelectedBatch(batch); setShowAdjustModal(true); }}
                            className={styles.actionBtn} title="Điều chỉnh kho"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            onClick={() => { setSelectedBatch(batch); setShowDestroyModal(true); }}
                            className={`${styles.actionBtn} ${styles.destroy}`} title="Hủy lô hàng"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                </tr>
            );
        });
    };

    return (
        <div className={styles.tableContainer}>
            {/* Compact Filter Bar */}
            <form onSubmit={handleFilterSubmit} className={styles.filterBar}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <span style={{fontSize:'0.85rem', fontWeight:500}}>Lọc hạn sử dụng:</span>
                    <select
                        value={daysThreshold}
                        onChange={(e) => {
                            setDaysThreshold(e.target.value);
                            setPage(0); // Auto reset page khi đổi filter
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="">-- Tất cả --</option>
                        <option value="3">Hết hạn &lt; 3 ngày</option>
                        <option value="7">Hết hạn &lt; 7 ngày</option>
                        <option value="14">Hết hạn &lt; 14 ngày</option>
                        <option value="30">Hết hạn &lt; 30 ngày</option>
                        <option value="-1">Đã hết hạn</option> {/* Backend cần handle logic -1 nếu chưa có */}
                    </select>
                    <button type="submit" className={styles.refreshButton}>Áp dụng</button>
                </div>
            </form>

            {/* Scrollable Table Wrapper */}
            <div className={styles.tableWrapper}>
                <table className={styles.compactTable}>
                    <thead>
                        <tr>
                            <th style={{width: '60px'}}>ID</th>
                            <th style={{width: '120px'}}>Mã lô</th>
                            <th>Sản phẩm</th>
                            <th style={{width: '120px'}}>Tồn / Tổng</th>
                            <th style={{width: '100px'}}>Ngày nhập</th>
                            <th style={{width: '100px'}}>HSD</th>
                            <th style={{width: '100px'}}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>{renderTableBody()}</tbody>
                </table>
            </div>

            {/* Pagination Compact */}
            {!loading && dataPage && dataPage.totalPages > 1 && (
                <div className={styles.pagination}>
                    <span>Trang {dataPage.number + 1} / {dataPage.totalPages}</span>
                    <div style={{display:'flex', gap: '4px'}}>
                        <button 
                            className={styles.pageBtn} 
                            disabled={dataPage.first} 
                            onClick={() => setPage(p => p - 1)}
                        >
                            &lt;
                        </button>
                        <button 
                            className={styles.pageBtn} 
                            disabled={dataPage.last} 
                            onClick={() => setPage(p => p + 1)}
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            )}

            {/* Modals - Giữ nguyên logic gọi modal */}
            {showDetailsModal && selectedBatch && (
                <BatchDetailsModal
                    batch={selectedBatch}
                    onClose={() => setShowDetailsModal(false)}
                />
            )}

            {showAdjustModal && selectedBatch && (
                <AdjustStockModal
                    batch={selectedBatch}
                    onClose={() => setShowAdjustModal(false)}
                    onSuccess={handleRefresh}
                />
            )}

            {showDestroyModal && selectedBatch && (
                <DestroyBatchModal
                    batch={selectedBatch}
                    onClose={() => setShowDestroyModal(false)}
                    onSuccess={handleRefresh}
                />
            )}
        </div>
    );
}