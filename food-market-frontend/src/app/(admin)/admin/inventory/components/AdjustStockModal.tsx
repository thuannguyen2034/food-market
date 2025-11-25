'use client';

import { useState } from 'react';
import { Edit, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InventoryBatchDTO, AdjustStockRequestDTO, ADJUSTMENT_REASONS } from '../types';
import styles from '@/styles/admin/Inventory.module.css';

type Props = {
    batch: InventoryBatchDTO;
    onClose: () => void;
    onSuccess: () => void;
};

export default function AdjustStockModal({ batch, onClose, onSuccess }: Props) {
    const { authedFetch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        adjustmentQuantity: 0,
        reason: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (formData.adjustmentQuantity === 0) {
            newErrors.adjustmentQuantity = 'Số lượng điều chỉnh không được bằng 0';
        }

        const newQuantity = batch.currentQuantity + formData.adjustmentQuantity;
        if (newQuantity < 0) {
            newErrors.adjustmentQuantity = `Không thể trừ nhiều hơn số lượng hiện có (${batch.currentQuantity})`;
        }

        if (!formData.reason) {
            newErrors.reason = 'Vui lòng chọn lý do điều chỉnh';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const requestData: AdjustStockRequestDTO = {
                batchId: batch.batchId,
                adjustmentQuantity: formData.adjustmentQuantity,
                reason: formData.reason,
            };

            const response = await authedFetch('/api/v1/admin/inventory/adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                alert('✅ Điều chỉnh kho thành công!');
                onSuccess();
                onClose();
            } else {
                const error = await response.text();
                alert(`❌ Lỗi: ${error}`);
            }
        } catch (error) {
            console.error('Failed to adjust stock:', error);
            alert('❌ Có lỗi xảy ra khi điều chỉnh kho');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const newQuantity = batch.currentQuantity + formData.adjustmentQuantity;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2><Edit size={24} /> Điều chỉnh tồn kho</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.batchInfo}>
                            <p><strong>Lô hàng:</strong> #{batch.batchId} - {batch.batchCode}</p>
                            <p><strong>Số lượng hiện tại:</strong> {batch.currentQuantity}</p>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="adjustmentQuantity">
                                Số lượng điều chỉnh <span className={styles.required}>*</span>
                            </label>
                            <input
                                id="adjustmentQuantity"
                                type="number"
                                value={formData.adjustmentQuantity}
                                onChange={(e) => handleChange('adjustmentQuantity', Number(e.target.value))}
                                placeholder="Nhập số dương để cộng, số âm để trừ"
                                className={errors.adjustmentQuantity ? styles.inputError : ''}
                            />
                            {errors.adjustmentQuantity && (
                                <span className={styles.errorText}>{errors.adjustmentQuantity}</span>
                            )}
                            <small className={styles.helpText}>
                                Số lượng mới sẽ là: <strong>{newQuantity}</strong>
                            </small>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="reason">
                                Lý do <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="reason"
                                value={formData.reason}
                                onChange={(e) => handleChange('reason', e.target.value)}
                                className={errors.reason ? styles.inputError : ''}
                            >
                                <option value="">-- Chọn lý do --</option>
                                {ADJUSTMENT_REASONS.map((reason) => (
                                    <option key={reason.value} value={reason.value}>
                                        {reason.label}
                                    </option>
                                ))}
                            </select>
                            {errors.reason && (
                                <span className={styles.errorText}>{errors.reason}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelButton}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
