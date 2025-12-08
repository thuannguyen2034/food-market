'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import styles from './Notifications.module.css'; 

interface NotificationItem {
    id: string;
    message: string;
    isRead: boolean;
    type: string;
    linkTo: string;
    createdAt: string;
}

export default function NotificationsPage() {
    const { authedFetch } = useAuth();
    const { refetchUnread } = useNotification(); 
    const router = useRouter();

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initPage = async () => {
            try {
                setLoading(true);

                // 1. Lấy danh sách thông báo
                const resList = await authedFetch('/api/v1/notifications?size=30');
                if (resList.ok) {
                    const data = await resList.json();
                    setNotifications(data.content);
                }

                // 2. Gọi API đánh dấu "Đã đọc tất cả" ngầm bên dưới
                // Không cần chờ kết quả (await) để render nhanh hơn, nhưng cần để update UI chuông
                await authedFetch('/api/v1/notifications/read-all', { method: 'PUT' });

                // 3. Bảo Navbar cập nhật lại số (về 0)
                refetchUnread();

            } catch (err) {
                console.error('Lỗi tải thông báo', err);
            } finally {
                setLoading(false);
            }
        };

        initPage();
    }, []);

    const handleItemClick = (linkTo: string) => {
        if (linkTo) {
            router.push(linkTo);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Thông báo của bạn</h1>

            {notifications.length === 0 ? (
                <div className={styles.empty}>Bạn chưa có thông báo nào.</div>
            ) : (
                <ul className={styles.list}>
                    {notifications.map((noti) => (
                        <li
                            key={noti.id}
                            className={`${styles.item}`}
                            onClick={() => handleItemClick(noti.linkTo)}
                        >
                            <span className={styles.message}>{noti.message}</span>
                            <span className={styles.time}>
                                {formatDistanceToNow(new Date(noti.createdAt), {
                                    addSuffix: true,
                                    locale: vi,
                                })}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}