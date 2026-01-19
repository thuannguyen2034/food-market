'use client';

import { useState } from 'react';
import { Package, RefreshCw, ClipboardList, Download, History } from 'lucide-react';
import InventoryStats from './components/InventoryStats';
import InventoryTable from './components/InventoryTable';
import ImportStockForm from './components/ImportStockForm';
import AdjustmentHistory from './components/AdjustmentHistory'; // Import mới
import styles from './InventoryPage.module.css';

type TabType = 'batches' | 'import' | 'history';

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState<TabType>('batches');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div className={styles.inventoryContainer}>
            {/* 1. Header & Stats combined area could be here, but distinct is cleaner */}
            <div className={styles.header}>
                <h1><Package size={20} /> Quản lý Kho hàng</h1>
                <button onClick={handleRefresh} className={styles.refreshButton}>
                    <RefreshCw size={14} /> Làm mới
                </button>
            </div>

            {/* 2. Compact Stats Ribbon */}
            <InventoryStats key={refreshTrigger} />

            {/* 3. Navigation Tabs */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'batches' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('batches')}
                >
                    <ClipboardList size={16} /> Danh sách lô hàng
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'import' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('import')}
                >
                    <Download size={16} /> Nhập hàng
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <History size={16} /> Lịch sử thay đổi
                </button>
            </div>

            {/* 4. Scrollable Content Area */}
            <div className={styles.tabContent}>
                {activeTab === 'batches' && (
                    <InventoryTable refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
                )}
                {activeTab === 'import' && <ImportStockForm onSuccess={() => {
                    handleRefresh();
                    setActiveTab('batches');
                }} />}
                {activeTab === 'history' && <AdjustmentHistory />}
            </div>
        </div>
    );
}