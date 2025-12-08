'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Eye, RotateCw, Search } from 'lucide-react';
import { UserResponseDTO, PageResponse, Role } from '../types';
import UserDetailsModal from './UserDetailsModal';
import ChangeRoleModal from './ChangeRoleModal';
import styles from '@/styles/admin/Users.module.css';

type Props = {
    refreshTrigger?: number;
    onRefresh?: () => void;
};

export default function UserTable({ refreshTrigger, onRefresh }: Props) {
    const { authedFetch } = useAuth();
    const [dataPage, setDataPage] = useState<PageResponse<UserResponseDTO> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);

    // Separate input value from actual search keyword
    const [searchInput, setSearchInput] = useState(''); // What user types
    const [searchKeyword, setSearchKeyword] = useState(''); // What we actually search for
    const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

    // Modal states
    const [selectedUser, setSelectedUser] = useState<UserResponseDTO | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);

    const pageSize = 15;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', pageSize.toString());
            if (searchKeyword) {
                params.append('keyword', searchKeyword);
            }
            if (roleFilter !== 'ALL') {
                params.append('role', roleFilter);
            }
            const response = await authedFetch(`/api/v1/admin/users?${params.toString()}`);

            if (response.ok) {
                let data: PageResponse<UserResponseDTO> = await response.json();
                setDataPage(data);
            } else {
                console.error('Failed to fetch users:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
        setLoading(false);
    }, [authedFetch, page, searchKeyword, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, refreshTrigger]);

    const handleRefresh = () => {
        fetchUsers();
        onRefresh?.();
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && (!dataPage || newPage < dataPage.totalPages)) {
            setPage(newPage);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchKeyword(searchInput); 
        setPage(0);
    };

    const openDetailsModal = (user: UserResponseDTO) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
    };

    const openRoleModal = (user: UserResponseDTO) => {
        setSelectedUser(user);
        setShowRoleModal(true);
    };

    const getRoleBadgeClass = (role: Role) => {
        if (role === Role.ADMIN) return styles.adminBadge;
        if (role === Role.STAFF) return styles.staffBadge;
        return styles.customerBadge;
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
                        Không tìm thấy user nào.
                    </td>
                </tr>
            );
        }

        return dataPage.content.map((user) => (
            <tr key={user.userId}>
                <td>
                    <div className={styles.avatarCell}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </td>
                <td>
                    <div className={styles.nameCell}>
                        <div className={styles.fullName}>{user.fullName}</div>
                        <div className={styles.userId}>{user.userId.substring(0, 8)}...</div>
                    </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone || 'N/A'}</td>
                <td>
                    <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                    </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className={styles.actions}>
                    <button
                        onClick={() => openDetailsModal(user)}
                        className={styles.viewButton}
                        title="Xem chi tiết"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => openRoleModal(user)}
                        className={styles.roleButton}
                        title="Thay đổi role"
                    >
                        <RotateCw size={16} />
                    </button>
                </td>
            </tr>
        ));
    };

    return (
        <div className={styles.tableContainer}>
            {/* Filters */}
            <div className={styles.filterBar}>
                <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, số điện thoại..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton}>
                        <Search size={18} style={{ marginRight: 8 }} /> Tìm kiếm
                    </button>
                </form>

                <div className={styles.filterGroup}>
                    <label>Lọc theo Role:</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value as 'ALL' | Role);
                            setPage(0);
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="ALL">Tất cả</option>
                        <option value={Role.CUSTOMER}>Customer</option>
                        <option value={Role.ADMIN}>Admin</option>
                        <option value={Role.STAFF}>Staff</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.userTable}>
                    <thead>
                        <tr>
                            <th>Avatar</th>
                            <th>Tên</th>
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>Role</th>
                            <th>Ngày tạo</th>
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
            {showDetailsModal && selectedUser && (
                <UserDetailsModal
                    user={selectedUser}
                    onClose={() => setShowDetailsModal(false)}
                />
            )}

            {showRoleModal && selectedUser && (
                <ChangeRoleModal
                    user={selectedUser}
                    onClose={() => setShowRoleModal(false)}
                    onSuccess={handleRefresh}
                />
            )}
        </div>
    );
}
