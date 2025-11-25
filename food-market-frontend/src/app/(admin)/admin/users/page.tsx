'use client';

import { useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import UserStats from './components/UserStats';
import UserTable from './components/UserTable';
import styles from '@/styles/admin/Users.module.css';

export default function UsersPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div className={styles.usersContainer}>
            {/* Page Header */}
            <div className={styles.header}>
                <h1><Users className="inline-icon" size={32} style={{ marginBottom: -6, marginRight: 10 }} /> Quản lý Users</h1>
                <button onClick={handleRefresh} className={styles.refreshButton}>
                    <RefreshCw size={18} style={{ marginRight: 8 }} /> Làm mới
                </button>
            </div>

            {/* Dashboard Stats */}
            <UserStats key={refreshTrigger} />

            {/* User Table */}
            <UserTable refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
        </div>
    );
}
