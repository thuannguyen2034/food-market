'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { pusherClient } from '@/utils/pusher';
interface NotificationContextType {
  unreadCount: number;
  decrementUnread: () => void;
  refetchUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  decrementUnread: () => {},
  refetchUnread: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, authedFetch } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await authedFetch('/api/v1/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Lỗi lấy thông báo:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [user]);

 useEffect(() => {
    if (!user) return;

    const channelName = `user-${user.userId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('notification-event', (data: any) => {
      console.log('Có thông báo mới:', data);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
}, [user]);

  const decrementUnread = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, decrementUnread, refetchUnread: fetchUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);