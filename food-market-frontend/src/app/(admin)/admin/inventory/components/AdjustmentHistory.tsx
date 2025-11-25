'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { InventoryAdjustmentDTO, PageResponse } from '../types';
import styles from '@/styles/admin/Inventory.module.css';

export default function AdjustmentHistory() {
    const { authedFetch } = useAuth();
    const [dataPage, setDataPage] = useState<PageResponse<InventoryAdjustmentDTO> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');

    const pageSize = 10;

    const fetchAdjustments = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/api/v1/admin/inventory';

            // If specific batch selected, fetch adjustments for that batch
            if (selectedBatchId) {
                url = `/api/v1/admin/inventory/${selectedBatchId}/adjustments?page=${page}&size=${pageSize}`;
            } else {
                // For all adjustments, we need to fetch all batches and aggregate
                // This is a simplified approach - in production, you'd have a dedicated endpoint
                url = `/api/v1/admin/inventory?page=${page}&size=100`;
            }

            const response = await authedFetch(url);

            if (response.ok) {
                const data = await response.json();

                if (selectedBatchId) {
                    // Direct adjustment data
                    setDataPage(data);
                } else {
                    // Extract adjustments from batches
                    const allAdjustments: InventoryAdjustmentDTO[] = [];
                    data.content?.forEach((batch: any) => {
                        if (batch.adjustments && batch.adjustments.length > 0) {
                            allAdjustments.push(...batch.adjustments);
                        }
                    });

                    // Sort by date descending
                    allAdjustments.sort((a, b) =>
                        new Date(b.adjustmentDate).getTime() - new Date(a.adjustmentDate).getTime()
                    );

                    // Create pseudo-page response
                    setDataPage({
                        content: allAdjustments.slice(0, pageSize),
                        totalPages: Math.ceil(allAdjustments.length / pageSize),
                        totalElements: allAdjustments.length,
                        number: page,
                        size: pageSize,
                        first: page === 0,
                        last: page >= Math.ceil(allAdjustments.length / pageSize) - 1,
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch adjustments:', error);
        }
        setLoading(false);
    }, [authedFetch, page, selectedBatchId]);

    useEffect(() => {
        fetchAdjustments();
    }, [fetchAdjustments]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && (!dataPage || newPage < dataPage.totalPages)) {
            setPage(newPage);
        }
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchAdjustments();
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan={6} className={styles.centerText}>
                        Đang tải dữ liệu...
                    </td>
                </tr>
            );
        }

        if (!dataPage || dataPage.content.length === 0) {
            return (
                <tr>
                    <td colSpan={6} className={styles.centerText}>
                        Chưa có lịch sử điều chỉnh nào.
                    </td>
                </tr>
            );
        }

        return dataPage.content.map((adjustment, index) => (
            <tr key={adjustment.adjustmentId || index}>
                <td>{adjustment.adjustmentId || 'N/A'}</td>
                <td>Lô #{adjustment.batchId}</td>
                <td>
                    <span
                        className={
                            adjustment.adjustmentQuantity > 0
                                ? styles.positiveAdjustment
                                : styles.negativeAdjustment
                        }
                    >
                        {adjustment.adjustmentQuantity > 0 ? '+' : ''}
                        {adjustment.adjustmentQuantity}
                    </span>
                </td>
                <td>{adjustment.reason}</td>
                <td>
                    <small>{adjustment.adjustedByUserId.substring(0, 8)}...</small>
                </td>
                <td>
                    {new Date(adjustment.adjustmentDate).toLocaleString('vi-VN')}
                </td>
            </tr>
        ));
    };

    return (
        <div className={styles.historyContainer}>
            <h2 className={styles.formTitle}>📜 Lịch sử điều chỉnh</h2>

            {/* Filter */}
            <form onSubmit={handleFilterSubmit} className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Lọc theo lô hàng:</label>
                    <input
                        type="text"
                        placeholder="Nhập ID lô hàng"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className={styles.filterInput}
                    />
                </div>
                <button type="submit" className={styles.filterButton}>
                    Áp dụng
                </button>
                {selectedBatchId && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedBatchId('');
                            setPage(0);
                        }}
                        className={styles.clearButton}
                    >
                        Xóa bộ lọc
                    </button>
                )}
            </form>

            {/* Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.historyTable}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Lô hàng</th>
                            <th>Thay đổi</th>
                            <th>Lý do</th>
                            <th>Người thực hiện</th>
                            <th>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>{renderTableBody()}</tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && dataPage && dataPage.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={dataPage.first}
                        className={styles.pageButton}
                    >
                        &laquo; Trước
                    </button>
                    <span className={styles.pageInfo}>
                        Trang {dataPage.number + 1} / {dataPage.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={dataPage.last}
                        className={styles.pageButton}
                    >
                        Sau &raquo;
                    </button>
                </div>
            )}
        </div>
    );
}
