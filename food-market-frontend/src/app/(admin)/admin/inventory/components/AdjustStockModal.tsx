'use client';

import { useState } from 'react';
import { Edit, X, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InventoryBatchDTO, AdjustStockRequestDTO, ADJUSTMENT_REASONS } from '../types';
import styles from './InventoryModals.module.css';

type Props = {
    batch: InventoryBatchDTO;
    onClose: () => void;
    onSuccess: () => void;
};

export default function AdjustStockModal({ batch, onClose, onSuccess }: Props) {
    const { authedFetch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ adjustmentQuantity: 0, reason: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.adjustmentQuantity === 0) return setError('Số lượng phải khác 0');
        if (!formData.reason) return setError('Vui lòng chọn lý do');
        if (batch.currentQuantity + formData.adjustmentQuantity < 0) return setError('Tồn kho không thể âm');

        setLoading(true);
        try {
            const body: AdjustStockRequestDTO = {
                batchId: batch.batchId,
                adjustmentQuantity: formData.adjustmentQuantity,
                reason: formData.reason,
            };
            const res = await authedFetch('/api/v1/admin/inventory/adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                setError(await res.text());
            }
        } catch (err) {
            console.error(err);
            setError('Lỗi hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const newQty = batch.currentQuantity + formData.adjustmentQuantity;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2><Edit size={18} /> Điều chỉnh kho #{batch.batchId}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.body}>
                    <div className={styles.grid}>
                        <div><span className={styles.label}>Sản phẩm</span><div className={styles.value}>{batch.productName}</div></div>
                        <div><span className={styles.label}>Tồn hiện tại</span><div className={styles.value}>{batch.currentQuantity}</div></div>
                    </div>

                    <div style={{borderTop:'1px dashed #eee', margin:'4px 0'}}></div>

                    <div>
                        <label className={styles.label}>Số lượng điều chỉnh (+ thêm / - giảm) <span style={{color:'red'}}>*</span></label>
                        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                            <input
                                type="number"
                                className={styles.input}
                                autoFocus
                                value={formData.adjustmentQuantity}
                                onChange={e => setFormData({...formData, adjustmentQuantity: Number(e.target.value)})}
                            />
                            <div style={{whiteSpace:'nowrap', fontSize:'0.85rem'}}>
                                ➔ Mới: <strong style={{color: newQty < 0 ? 'red' : '#2563eb'}}>{newQty}</strong>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={styles.label}>Lý do <span style={{color:'red'}}>*</span></label>
                        <select
                            className={styles.select}
                            value={formData.reason}
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                        >
                            <option value="">-- Chọn lý do --</option>
                            {ADJUSTMENT_REASONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {error && <div className={styles.errorText} style={{fontSize:'0.9rem'}}>⚠️ {error}</div>}
                </form>

                <div className={styles.footer}>
                    <button onClick={onClose} disabled={loading} className={`${styles.btn} ${styles.btnCancel}`}>Hủy</button>
                    <button onClick={handleSubmit} disabled={loading} className={`${styles.btn} ${styles.btnPrimary}`}>
                        {loading ? '...' : <><Check size={14}/> Xác nhận</>}
                    </button>
                </div>
            </div>
        </div>
    );
}