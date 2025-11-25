'use client';

import { useState } from 'react';
import { Package, RefreshCw, ClipboardList, Download } from 'lucide-react';
import InventoryStats from './components/InventoryStats';
import InventoryTable from './components/InventoryTable';
import ImportStockForm from './components/ImportStockForm';
import styles from '@/styles/admin/Inventory.module.css';

type TabType = 'batches' | 'import';

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState<TabType>('batches');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div className={styles.inventoryContainer}>
            {/* Page Header */}
            <div className={styles.header}>
                <h1><Package size={24} /> Quản lý Kho hàng</h1>
                <button onClick={handleRefresh} className={styles.refreshButton}>
                    <RefreshCw size={16} /> Làm mới
                </button>
            </div>

            {/* Dashboard Stats */}
            <InventoryStats key={refreshTrigger} />

            {/* Tab Navigation */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'batches' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('batches')}
                >
                    <ClipboardList size={18} /> Danh sách lô hàng
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'import' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('import')}
                >
                    <Download size={18} /> Nhập hàng
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'batches' && (
                    <InventoryTable refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
                )}
                {activeTab === 'import' && <ImportStockForm onSuccess={handleRefresh} />}
            </div>
        </div>
    );
}
