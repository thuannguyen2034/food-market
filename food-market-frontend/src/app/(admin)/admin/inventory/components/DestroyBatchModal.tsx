'use client';

import { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InventoryBatchDTO, DESTROY_REASONS } from '../types';
import styles from './InventoryModals.module.css';

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
        if (!reason) return setError('Vui lòng chọn lý do hủy');
        
        // Native confirm cho chắc chắn
        if (!window.confirm(`XÁC NHẬN: Bạn muốn hủy toàn bộ ${batch.currentQuantity} sản phẩm của lô #${batch.batchId}?`)) return;

        setLoading(true);
        try {
            const res = await authedFetch(`/api/v1/admin/inventory/${batch.batchId}/destroy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                setError(await res.text());
            }
        } catch (err) {
            console.error(err);
            setError('Lỗi hệ thống khi hủy lô hàng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <div className={styles.header} style={{background:'#fee2e2', color:'#991b1b'}}>
                    <h2><Trash2 size={18} /> Hủy lô hàng #{batch.batchId}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.body}>
                    <div className={styles.warningBox}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                            <AlertTriangle size={16} /> <strong>Hành động không thể hoàn tác!</strong>
                        </div>
                        <span style={{fontSize:'0.8rem'}}>
                            Bạn sắp hủy toàn bộ <b>{batch.currentQuantity}</b> sản phẩm trong kho.
                            Số lượng sẽ về 0.
                        </span>
                    </div>

                    <div className={styles.grid}>
                        <div><span className={styles.label}>Sản phẩm</span><div className={styles.value}>{batch.productName}</div></div>
                        <div><span className={styles.label}>Hạn sử dụng</span><div className={styles.value}>{new Date(batch.expirationDate).toLocaleDateString('vi-VN')}</div></div>
                    </div>

                    <div>
                        <label className={styles.label}>Lý do hủy <span style={{color:'red'}}>*</span></label>
                        <select
                            className={`${styles.select} ${error ? styles.errorInput : ''}`}
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(''); }}
                        >
                            <option value="">-- Chọn lý do --</option>
                            {DESTROY_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        {error && <span className={styles.errorText}>{error}</span>}
                    </div>
                </form>

                <div className={styles.footer}>
                    <button type="button" onClick={onClose} disabled={loading} className={`${styles.btn} ${styles.btnCancel}`}>
                        Thoát
                    </button>
                    <button type="submit" onClick={handleSubmit} disabled={loading} className={`${styles.btn} ${styles.btnDanger}`}>
                        {loading ? 'Đang hủy...' : <><Trash2 size={14} /> Xác nhận hủy</>}
                    </button>
                </div>
            </div>
        </div>
    );
}