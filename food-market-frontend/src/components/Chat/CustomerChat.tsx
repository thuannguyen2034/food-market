'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pusherClient } from '@/utils/pusher';
import { MessageCircle, X, Send, Minus } from 'lucide-react';
import styles from './CustomerChat.module.css';

// Định nghĩa kiểu dữ liệu nhanh (khớp với DTO backend)
interface ChatMessage {
    id: number;
    content: string;
    senderType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
    sentAt: string;
}

export default function CustomerChat() {
    const { user, authedFetch } = useAuth();

    // State
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0); // Badge đỏ ở bong bóng
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Scroll xuống cuối khi có tin mới
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // 2. Load lịch sử chat
    const fetchHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Backend: /api/v1/chat/customer/history?size=50
            const res = await authedFetch('/api/v1/chat/customer/history?size=50&sort=sentAt,desc');
            if (res.ok) {
                const data = await res.json();
                setMessages(data.content.reverse());
                scrollToBottom();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 3. Effect: Lắng nghe Pusher (Realtime)
    useEffect(() => {
        if (!user) {
            setMessages([]);
            setIsOpen(false);
            setUnreadCount(0);
            setInput('');
            return;
        }

        // Subscribe vào kênh riêng của User: user-{uuid}
        const channelName = `user-${user.userId}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind('new-message', (data: ChatMessage) => {
            // Nếu là tin của chính mình vừa gửi (từ thiết bị khác) hoặc tin staff
            setMessages((prev) => [...prev, data]);
            scrollToBottom();

            // Nếu cửa sổ đang đóng -> Tăng số chưa đọc
            if (!isOpen) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(channelName);
        };
    }, [user, isOpen]);

    // 4. Xử lý mở Chat
    const toggleChat = () => {
        if (!isOpen) {
            setIsOpen(true);
            setUnreadCount(0); // Mở ra thì reset badge
            // Nếu chưa có tin nhắn nào trong state thì mới load lại (đỡ spam API)
            if (messages.length === 0) {
                fetchHistory();
            } else {
                scrollToBottom();
            }
        } else {
            setIsOpen(false);
        }
    };

    // 5. Gửi tin nhắn
    const handleSend = async () => {
        if (!input.trim() || !user) return;

        const tempContent = input;
        setInput(''); // Xóa ô nhập ngay cho mượt

        try {
            // Gọi API gửi tin
            const res = await authedFetch('/api/v1/chat/customer/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: tempContent }),
            });

            if (!res.ok) {
                // Nếu lỗi thì restore lại text (hoặc báo lỗi)
                setInput(tempContent);
                alert('Gửi lỗi, vui lòng thử lại');
            }
            // Không cần setMessages thủ công ở đây vì Pusher sẽ bắn event về ngay lập tức
        } catch (e) {
            console.error(e);
        }
    };

    // Nếu chưa đăng nhập -> Không hiện gì (hoặc hiện nút dẫn tới Login tùy bạn)
    // Với yêu cầu "dễ code", ta ẩn đi cho gọn.
    if (!user || user.role === 'ADMIN' || user.role === 'STAFF') return null;

    return (
        <div className={styles.container}>
            {/* Cửa sổ Chat */}
            {isOpen && (
                <div className={styles.window}>
                    <div className={styles.header}>
                        <span>Hỗ trợ khách hàng</span>
                        <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                            <Minus size={20} />
                        </button>
                    </div>

                    <div className={styles.messages}>
                        {loading && <div className="text-center text-gray-400 text-sm">Đang tải...</div>}

                        {messages.length === 0 && !loading && (
                            <div className="text-center text-gray-400 text-sm mt-4">
                                Xin chào! Bạn cần hỗ trợ gì không?
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`${styles.messageRow} ${msg.senderType === 'CUSTOMER' ? styles.right : styles.left
                                    }`}
                            >
                                <div className={styles.bubble}>{msg.content}</div>
                                {/* Format giờ đơn giản */}
                                <span className={styles.time}>
                                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.footer}>
                        <input
                            className={styles.input}
                            placeholder="Nhập tin nhắn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            className={styles.sendBtn}
                            onClick={handleSend}
                            disabled={!input.trim()}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Nút Bong bóng */}
            <button className={styles.bubbleBtn} onClick={toggleChat}>
                {isOpen ? (
                    <X size={28} />
                ) : (
                    <>
                        <MessageCircle size={28} />
                        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                    </>
                )}
            </button>
        </div>
    );
}