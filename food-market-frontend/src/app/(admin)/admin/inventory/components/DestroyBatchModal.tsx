'use client';

import { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InventoryBatchDTO, DESTROY_REASONS } from '../types';
import styles from '@/styles/admin/Inventory.module.css';

type Props = {
    batch: InventoryBatchDTO;
    onClose: () => void;
    onSuccess: () => void;
};

export default function DestroyBatchModal({ batch, onClose, onSuccess }: Props) {
    const { authedFetch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason) {
            setError('Vui lòng chọn lý do hủy');
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn HỦY lô hàng #${batch.batchId}?\nHành động này KHÔNG THỂ hoàn tác!`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await authedFetch(`/api/v1/admin/inventory/${batch.batchId}/destroy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });

            if (response.ok) {
                alert('✅ Đã hủy lô hàng thành công!');
                onSuccess();
                onClose();
            } else {
                const errorText = await response.text();
                alert(`❌ Lỗi: ${errorText}`);
            }
        } catch (error) {
            console.error('Failed to destroy batch:', error);
            alert('❌ Có lỗi xảy ra khi hủy lô hàng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2><Trash2 size={24} /> Hủy lô hàng</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.warningBox}>
                            <p><AlertTriangle size={18} /> <strong>Cảnh báo:</strong> Bạn sắp hủy lô hàng sau:</p>
                            <ul>
                                <li><strong>Mã lô:</strong> {batch.batchCode || 'N/A'}</li>
                                <li><strong>Lô ID:</strong> #{batch.batchId}</li>
                                <li><strong>Sản phẩm:</strong> Product #{batch.productId}</li>
                                <li><strong>Số lượng:</strong> {batch.currentQuantity} / {batch.quantityReceived}</li>
                                <li><strong>Hạn sử dụng:</strong> {new Date(batch.expirationDate).toLocaleDateString('vi-VN')}</li>
                            </ul>
                            <p className={styles.dangerText}>
                                Hành động này KHÔNG THỂ hoàn tác!
                            </p>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="reason">
                                Lý do hủy <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="reason"
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    setError('');
                                }}
                                className={error ? styles.inputError : ''}
                            >
                                <option value="">-- Chọn lý do --</option>
                                {DESTROY_REASONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            {error && <span className={styles.errorText}>{error}</span>}
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelButton}
                            disabled={loading}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className={styles.destroyButton}
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : <><Trash2 size={16} /> Xác nhận hủy</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
