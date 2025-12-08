'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, X, AlertTriangle, Check } from 'lucide-react';
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

    const [selectedRole, setSelectedRole] = useState<Role>(user.role);

    const handleConfirm = async () => {
        if (selectedRole === user.role) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            const response = await authedFetch(`/api/v1/admin/users/${user.userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole }),
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

    const getBadgeClass = (role: Role) => {
        if (role === Role.ADMIN) return styles.adminBadge;
        if (role === Role.STAFF) return styles.staffBadge;
        return styles.customerBadge;
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2><RefreshCw size={20} style={{ marginRight: 8, display: 'inline', marginBottom: -3 }} /> Phân quyền User</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.confirmBox}>
                        <p>Chọn quyền hạn mới cho user:</p>

                        <div className={styles.userInfo}>
                            <div className={styles.userInfoRow}>
                                <strong>Tên:</strong> {user.fullName}
                            </div>
                            <div className={styles.userInfoRow}>
                                <strong>Email:</strong> {user.email}
                            </div>
                            <div className={styles.userInfoRow}>
                                <strong>Quyền hiện tại:</strong>{' '}
                                <span className={`${styles.roleBadge} ${getBadgeClass(user.role)}`}>
                                    {user.role}
                                </span>
                            </div>

                            {/* Khu vực chọn Role mới */}
                            <div className={styles.userInfoRow} style={{ marginTop: 15 }}>
                                <strong>Chọn quyền mới:</strong>
                                <select
                                    className={styles.filterSelect} // Tái sử dụng class input
                                    style={{ width: '100%', marginTop: 8, padding: 8 }}
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                                >
                                    <option value={Role.CUSTOMER}>CUSTOMER (Khách hàng)</option>
                                    <option value={Role.STAFF}>STAFF (Nhân viên)</option>
                                    <option value={Role.ADMIN}>ADMIN (Quản trị viên)</option>
                                </select>
                            </div>
                        </div>

                        {/* Cảnh báo khi chọn ADMIN */}
                        {selectedRole === Role.ADMIN && selectedRole !== user.role && (
                            <div className={styles.warningText}>
                                <AlertTriangle size={16} style={{ marginRight: 4, display: 'inline', marginBottom: -2 }} />
                                Lưu ý: User này sẽ có toàn quyền hệ thống!
                            </div>
                        )}

                        {/* Thông báo khi chọn STAFF */}
                        {selectedRole === Role.STAFF && selectedRole !== user.role && (
                            <div className={styles.infoNote} style={{ marginTop: 10, fontSize: 13, color: '#2563eb' }}>
                                <Check size={16} style={{ marginRight: 4, display: 'inline', marginBottom: -2 }} />
                                User sẽ có quyền truy cập trang quản trị đơn hàng và chat hỗ trợ.
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
                        disabled={loading || selectedRole === user.role}
                    >
                        {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
}