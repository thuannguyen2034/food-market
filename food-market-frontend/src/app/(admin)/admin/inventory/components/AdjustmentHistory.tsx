'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { InventoryAdjustmentDTO, PageResponse } from '../types';
import styles from '../InventoryPage.module.css'; // Dùng styles chung

export default function AdjustmentHistory() {
    const { authedFetch } = useAuth();
    const [dataPage, setDataPage] = useState<PageResponse<InventoryAdjustmentDTO> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    
    // Tăng page size vì view compact
    const pageSize = 20;

    const fetchAdjustments = useCallback(async () => {
        setLoading(true);
        try {
            let url;
            // LOGIC FIX: Gọi đúng endpoint backend đã có
            if (selectedBatchId) {
                url = `/api/v1/admin/inventory/${selectedBatchId}/adjustments?page=${page}&size=${pageSize}`;
            } else {
                url = `/api/v1/admin/inventory/adjustments?page=${page}&size=${pageSize}`;
            }

            const response = await authedFetch(url);
            if (response.ok) {
                const data = await response.json();
                setDataPage(data);
            }
        } catch (error) {
            console.error('Failed to fetch adjustments:', error);
        }
        setLoading(false);
    }, [authedFetch, page, selectedBatchId]);

    useEffect(() => {
        fetchAdjustments();
    }, [fetchAdjustments]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0); // Reset về trang 0 khi search
        fetchAdjustments();
    };

    // Helper render màu sắc cho số lượng
    const renderQuantity = (qty: number) => {
        const color = qty > 0 ? '#10b981' : qty < 0 ? '#ef4444' : '#6b7280';
        return <span style={{ color, fontWeight: 600 }}>{qty > 0 ? `+${qty}` : qty}</span>;
    };

    return (
        <div className={styles.tableContainer}>
            {/* Filter Bar Compact */}
            <form onSubmit={handleFilterSubmit} className={styles.filterBar}>
                <input
                    type="text"
                    placeholder="Lọc theo ID lô hàng..."
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className={styles.filterInput}
                    style={{ width: '200px' }}
                />
                <button type="submit" className={styles.refreshButton}>Tìm kiếm</button>
                {selectedBatchId && (
                    <button 
                        type="button" 
                        onClick={() => { setSelectedBatchId(''); setPage(0); }}
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        Xóa lọc
                    </button>
                )}
            </form>

            {/* Table Area */}
            <div className={styles.tableWrapper}>
                <table className={styles.compactTable}>
                    <thead>
                        <tr>
                            <th style={{width: '60px'}}>ID</th>
                            <th style={{width: '100px'}}>Lô hàng</th>
                            <th style={{width: '100px'}}>Thay đổi</th>
                            <th>Lý do</th>
                            <th style={{width: '150px'}}>Người thực hiện</th>
                            <th style={{width: '140px'}}>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{textAlign: 'center'}}>Đang tải...</td></tr>
                        ) : (!dataPage || dataPage.content.length === 0) ? (
                            <tr><td colSpan={6} style={{textAlign: 'center'}}>Chưa có dữ liệu</td></tr>
                        ) : (
                            dataPage.content.map((adj) => (
                                <tr key={adj.adjustmentId}>
                                    <td>#{adj.adjustmentId}</td>
                                    <td>
                                        <span 
                                            style={{cursor: 'pointer', color: '#2563eb'}}
                                            onClick={() => {setSelectedBatchId(adj.batchId.toString()); setPage(0);}}
                                            title="Click để lọc theo lô này"
                                        >
                                            #{adj.batchId}
                                        </span>
                                    </td>
                                    <td>{renderQuantity(adj.adjustmentQuantity)}</td>
                                    <td>{adj.reason}</td>
                                    <td>
                                        {/* Ưu tiên hiện tên, fallback về ID */}
                                        <small>{adj.adjustedByUserName || adj.adjustedByUserId?.substring(0,8)}</small>
                                    </td>
                                    <td>
                                        {new Date(adj.adjustmentDate).toLocaleString('vi-VN', {
                                            hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Logic similar to other tables */}
            {!loading && dataPage && (
                <div className={styles.pagination}>
                   <span>Trang {dataPage.number + 1} / {dataPage.totalPages}</span>
                   <div style={{display:'flex', gap: '4px'}}>
                       <button className={styles.pageBtn} disabled={dataPage.first} onClick={() => setPage(p => p-1)}>&lt;</button>
                       <button className={styles.pageBtn} disabled={dataPage.last} onClick={() => setPage(p => p+1)}>&gt;</button>
                   </div>
                </div>
            )}
        </div>
    );
}