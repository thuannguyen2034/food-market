'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InventoryBatchDTO, PageResponse } from '../types';
import BatchDetailsModal from './BatchDetailsModal';
import AdjustStockModal from './AdjustStockModal';
import DestroyBatchModal from './DestroyBatchModal';
import styles from '@/styles/admin/Inventory.module.css';

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
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [selectedBatch, setSelectedBatch] = useState<InventoryBatchDTO | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showDestroyModal, setShowDestroyModal] = useState(false);

    const pageSize = 20;

    const fetchBatches = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', pageSize.toString());
            if (daysThreshold) {
                params.append('daysThreshold', daysThreshold);
            }

            const response = await authedFetch(`/api/v1/admin/inventory?${params.toString()}`);

            if (response.ok) {
                const data: PageResponse<InventoryBatchDTO> = await response.json();
                setDataPage(data);
            } else {
                console.error('Failed to fetch batches:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch inventory batches:', error);
        }
        setLoading(false);
    }, [authedFetch, page, daysThreshold]);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches, refreshTrigger]);

    const handleRefresh = () => {
        fetchBatches();
        onRefresh?.();
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && (!dataPage || newPage < dataPage.totalPages)) {
            setPage(newPage);
        }
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchBatches();
    };

    const getDaysUntilExpiry = (expirationDate: string) => {
        const days = Math.ceil(
            (new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return days;
    };

    const getExpiryClassName = (expirationDate: string) => {
        const days = getDaysUntilExpiry(expirationDate);
        if (days < 0) return styles.expired;
        if (days <= 3) return styles.criticalExpiry;
        if (days <= 7) return styles.warningExpiry;
        return '';
    };

    const openDetailsModal = (batch: InventoryBatchDTO) => {
        setSelectedBatch(batch);
        setShowDetailsModal(true);
    };

    const openAdjustModal = (batch: InventoryBatchDTO) => {
        setSelectedBatch(batch);
        setShowAdjustModal(true);
    };

    const openDestroyModal = (batch: InventoryBatchDTO) => {
        setSelectedBatch(batch);
        setShowDestroyModal(true);
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan={7} className={styles.centerText}>
                        Đang tải dữ liệu...
                    </td>
                </tr>
            );
        }

        if (!dataPage || dataPage.content.length === 0) {
            return (
                <tr>
                    <td colSpan={7} className={styles.centerText}>
                        Không tìm thấy lô hàng nào.
                    </td>
                </tr>
            );
        }

        return dataPage.content.map((batch) => {
            const daysLeft = getDaysUntilExpiry(batch.expirationDate);
            return (
                <tr key={batch.batchId} className={getExpiryClassName(batch.expirationDate)}>
                    <td>{batch.batchId}</td>
                    <td>{batch.batchCode || 'N/A'}</td>
                    <td>{batch.productName}</td>
                    <td>
                        <div className={styles.quantityCell}>
                            <span>{batch.currentQuantity}</span>
                            <small>/ {batch.quantityReceived}</small>
                        </div>
                    </td>
                    <td>{new Date(batch.entryDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                        <div className={styles.expiryCell}>
                            {new Date(batch.expirationDate).toLocaleDateString('vi-VN')}
                            {daysLeft >= 0 && daysLeft <= 7 && (
                                <small className={styles.expiryWarning}>
                                    ({daysLeft} ngày)
                                </small>
                            )}
                            {daysLeft < 0 && (
                                <small className={styles.expiryWarning}>
                                    Đã hết hạn
                                </small>
                            )}
                        </div>
                    </td>
                    <td className={styles.actions}>
                        <button
                            onClick={() => openDetailsModal(batch)}
                            className={styles.viewButton}
                            title="Xem chi tiết"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            onClick={() => openAdjustModal(batch)}
                            className={styles.adjustButton}
                            title="Điều chỉnh"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => openDestroyModal(batch)}
                            className={styles.destroyButton}
                            title="Hủy lô"
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
            {/* Filters */}
            <form onSubmit={handleFilterSubmit} className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Lọc theo hạn sử dụng:</label>
                    <select
                        value={daysThreshold}
                        onChange={(e) => setDaysThreshold(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">Tất cả</option>
                        <option value="3">Hết hạn trong 3 ngày</option>
                        <option value="7">Hết hạn trong 7 ngày</option>
                        <option value="14">Hết hạn trong 14 ngày</option>
                        <option value="30">Hết hạn trong 30 ngày</option>
                    </select>
                </div>
                <button type="submit" className={styles.filterButton}>
                    Áp dụng
                </button>
            </form>

            {/* Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.inventoryTable}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Mã lô</th>
                            <th>Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Ngày nhập</th>
                            <th>Hạn sử dụng</th>
                            <th>Hành động</th>
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

            {/* Modals */}
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
