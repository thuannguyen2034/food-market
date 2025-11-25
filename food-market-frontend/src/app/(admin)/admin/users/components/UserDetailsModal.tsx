'use client';

import { User, X, Info } from 'lucide-react';
import { UserResponseDTO } from '../types';
import styles from '@/styles/admin/Users.module.css';

type Props = {
    user: UserResponseDTO;
    onClose: () => void;
};

export default function UserDetailsModal({ user, onClose }: Props) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2><User size={20} style={{ marginRight: 8, display: 'inline', marginBottom: -3 }} /> Chi tiết User</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Avatar Section */}
                    <div className={styles.detailsHeader}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className={styles.detailAvatar} />
                        ) : (
                            <div className={styles.detailAvatarPlaceholder}>
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className={styles.detailsHeaderInfo}>
                            <h3>{user.fullName}</h3>
                            <span className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.adminBadge : styles.customerBadge
                                }`}>
                                {user.role}
                            </span>
                        </div>
                    </div>

                    {/* User Information Grid */}
                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <label>User ID:</label>
                            <span>{user.userId}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Email:</label>
                            <span>{user.email}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Số điện thoại:</label>
                            <span>{user.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <label>Ngày tạo:</label>
                            <span>{new Date(user.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className={styles.infoNote}>
                        <p>
                            <Info size={16} style={{ marginRight: 4, display: 'inline', marginBottom: -2 }} /> <strong>Lưu ý:</strong> User có thể quản lý địa chỉ của mình trong trang profile.
                            Admin không thể chỉnh sửa thông tin cá nhân của user.
                        </p>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.cancelButton}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
