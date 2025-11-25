'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, X, AlertTriangle } from 'lucide-react';
import { UserResponseDTO, Role } from '../types';
import styles from '@/styles/admin/Users.module.css';

type Props = {
    user: UserResponseDTO;
    onClose: () => void;
    onSuccess: () => void;
};

export default function ChangeRoleModal({ user, onClose, onSuccess }: Props) {
    const { authedFetch } = useAuth();
    const [loading, setLoading] = useState(false);

    const newRole = user.role === Role.ADMIN ? Role.CUSTOMER : Role.ADMIN;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const response = await authedFetch(`/api/v1/admin/users/${user.userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                alert(`✅ Đã thay đổi role thành công!`);
                onSuccess();
                onClose();
            } else {
                const error = await response.text();
                alert(`❌ Lỗi: ${error}`);
            }
        } catch (error) {
            console.error('Failed to change role:', error);
            alert('❌ Có lỗi xảy ra khi thay đổi role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2><RefreshCw size={20} style={{ marginRight: 8, display: 'inline', marginBottom: -3 }} /> Thay đổi Role</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.confirmBox}>
                        <p>Bạn có chắc chắn muốn thay đổi role của user sau?</p>

                        <div className={styles.userInfo}>
                            <div className={styles.userInfoRow}>
                                <strong>Tên:</strong> {user.fullName}
                            </div>
                            <div className={styles.userInfoRow}>
                                <strong>Email:</strong> {user.email}
                            </div>
                            <div className={styles.userInfoRow}>
                                <strong>Role hiện tại:</strong>{' '}
                                <span className={`${styles.roleBadge} ${user.role === Role.ADMIN ? styles.adminBadge : styles.customerBadge
                                    }`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className={styles.userInfoRow}>
                                <strong>Role mới:</strong>{' '}
                                <span className={`${styles.roleBadge} ${newRole === Role.ADMIN ? styles.adminBadge : styles.customerBadge
                                    }`}>
                                    {newRole}
                                </span>
                            </div>
                        </div>

                        {newRole === Role.ADMIN && (
                            <div className={styles.warningText}>
                                <AlertTriangle size={16} style={{ marginRight: 4, display: 'inline', marginBottom: -2 }} /> Lưu ý: User này sẽ có toàn quyền admin sau khi thay đổi!
                            </div>
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
                        type="button"
                        onClick={handleConfirm}
                        className={styles.confirmButton}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
}
