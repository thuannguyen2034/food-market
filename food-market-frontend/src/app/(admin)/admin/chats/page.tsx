'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pusherClient } from '@/utils/pusher';
import { Conversation, ChatMessage, ChatStats, ConversationStatus } from '@/types/chat';
import { Send, CheckCircle, RefreshCcw, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import styles from './AdminChat.module.css'; 

export default function AdminChatPage() {
  const { user, authedFetch } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'WAITING' | 'ACTIVE' | 'IDLE'>('WAITING');
  // State mới cho Admin: Lọc xem chat của mình hay xem tất cả
  const [adminFilter, setAdminFilter] = useState<'MY' | 'ALL'>('MY'); 
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats>({ waitingCount: 0, myActiveCount: 0 });
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. Fetch Data ---
  const fetchConversations = async () => {
    try {
      let url = '';
      if (activeTab === 'ACTIVE') {
        // Nếu là Admin và chọn xem ALL -> Gọi API lấy tất cả active (cần endpoint backend hỗ trợ hoặc dùng status=ACTIVE)
        // Hiện tại endpoint /admin/conversations?status=ACTIVE trả về ALL ACTIVE (của mọi staff)
        // Endpoint /admin/conversations/my trả về của riêng Staff
        if (user?.role === 'ADMIN' && adminFilter === 'ALL') {
             url = `/api/v1/chat/admin/conversations?status=ACTIVE`;
        } else {
             url = '/api/v1/chat/admin/conversations/my';
        }
      } else {
        url = `/api/v1/chat/admin/conversations?status=${activeTab}`;
      }

      const res = await authedFetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.content);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách chat:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await authedFetch('/api/v1/chat/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); }
  };

  // Re-fetch khi tab hoặc filter thay đổi
  useEffect(() => {
    fetchConversations();
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [activeTab, adminFilter]);

  // --- 2. Pusher Global Listener ---
  useEffect(() => {
    if (!user) return;
    const channel = pusherClient.subscribe('admin-chat-feed');

    channel.bind('session-updated', (updatedConv: Conversation) => {
      fetchStats();
      
      // Update logic list (Giữ nguyên logic cũ của bạn, chỉ thêm filter active)
      setConversations((prev) => {
        const exists = prev.some(c => c.id === updatedConv.id);
        
        // Logic hiển thị realtime phức tạp hơn một chút:
        // Nếu tab WAITING: chỉ hiện WAITING.
        // Nếu tab ACTIVE: 
        //    - Admin xem ALL: Hiện tất cả ACTIVE.
        //    - Staff/Admin xem MY: Chỉ hiện cái nào có staffId == user.id
        
        const isMyConv = updatedConv.staffId === user.userId;
        const shouldShowInActive = (adminFilter === 'ALL' || isMyConv);

        if (updatedConv.status === activeTab) {
           // Đang ở tab khớp status
           if (activeTab === 'ACTIVE' && !shouldShowInActive) return prev; // Không phải của mình thì thôi
           
           return exists 
             ? prev.map(c => c.id === updatedConv.id ? updatedConv : c)
             : [updatedConv, ...prev];
        } else {
           // Status thay đổi -> Xóa khỏi list hiện tại
           return exists ? prev.filter(c => c.id !== updatedConv.id) : prev;
        }
      });
    });

    return () => pusherClient.unsubscribe('admin-chat-feed');
  }, [activeTab, adminFilter, user]);

  // --- 3. Select & Load Messages ---
  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConv(conv); // UI highlight ngay
    setLoading(true);
    try {
      const res = await authedFetch(`/api/v1/chat/admin/conversations/${conv.id}/messages?size=50&sort=sentAt,asc`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.content);
        scrollToBottom();
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // --- 4. Pusher Message Listener ---
  useEffect(() => {
    if (!selectedConv) return;
    const channelName = `chat-${selectedConv.id}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('new-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [selectedConv]);

  const scrollToBottom = () => {
    // Timeout nhỏ để đảm bảo DOM đã render
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // --- 5. Actions ---

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedConv) return;
    try {
      await authedFetch(`/api/v1/chat/admin/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputMessage })
      });
      setInputMessage('');
    } catch (err) { alert('Lỗi gửi tin'); }
  };

  // FIX BUG: Tiếp nhận không nhảy
  const assignConversation = async () => {
    if (!selectedConv) return;
    try {
        await authedFetch(`/api/v1/chat/admin/conversations/${selectedConv.id}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        });

        // 1. Cập nhật ngay trạng thái cục bộ để UI đổi (Hiện input chat)
        const updatedConv = { ...selectedConv, status: 'ACTIVE' as ConversationStatus, staffId: user.userId };
        setSelectedConv(updatedConv);

        // 2. Chuyển Tab sang ACTIVE
        setActiveTab('ACTIVE');
        setAdminFilter('MY'); // Chắc chắn về tab của mình
        
        // Lưu ý: useEffect sẽ chạy lại và load list active, 
        // nhưng selectedConv đã được set nên khung chat bên phải vẫn hiện đúng.
    } catch(e) { alert('Lỗi nhận chat'); }
  };

  const finishConversation = async () => {
    if (!selectedConv) return;
    if (!confirm('Kết thúc phiên chat?')) return;
    try {
        await authedFetch(`/api/v1/chat/admin/conversations/${selectedConv.id}/finish`, { method: 'PATCH' });
        setSelectedConv(null);
        fetchStats();
        fetchConversations(); // Reload list để cái vừa finish biến mất
    } catch(e) { alert('Lỗi kết thúc'); }
  };

  const revokeConversation = async () => {
    if (!selectedConv) return;
    if (!confirm('Thu hồi hội thoại về hàng chờ?')) return;
    try {
        await authedFetch(`/api/v1/chat/admin/conversations/${selectedConv.id}/revoke`, { method: 'PATCH' });
        setSelectedConv(null);
        fetchStats();
        fetchConversations();
    } catch(e) { alert('Lỗi thu hồi'); }
  };

  // --- RENDER ---
  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'WAITING' ? styles.active : ''}`}
            onClick={() => setActiveTab('WAITING')}
          >
            Hàng chờ {stats.waitingCount > 0 && <span className={styles.badge}>{stats.waitingCount}</span>}
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'ACTIVE' ? styles.active : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Đang chat {stats.myActiveCount > 0 && <span className={styles.badge}>{stats.myActiveCount}</span>}
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'IDLE' ? styles.active : ''}`}
            onClick={() => setActiveTab('IDLE')}
          >
            Lịch sử
          </button>
        </div>
        
        {/* Bộ lọc cho Admin khi ở tab ACTIVE */}
        {user?.role === 'ADMIN' && activeTab === 'ACTIVE' && (
           <div className={styles.filterBar}>
             <select 
                className={styles.filterSelect}
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value as 'MY' | 'ALL')}
             >
                <option value="MY">Chat của tôi</option>
                <option value="ALL">Tất cả nhân viên (Giám sát)</option>
             </select>
           </div>
        )}

        <div className={styles.list}>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Không có dữ liệu</div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.id} 
                className={`${styles.conversationItem} ${selectedConv?.id === conv.id ? styles.selected : ''}`}
                onClick={() => handleSelectConversation(conv)}
              >
                <div className={styles.avatar}>
                   {conv.customerAvatar ? <img src={conv.customerAvatar} className="w-full h-full object-cover"/> : <User size={20}/>}
                </div>
                <div className={styles.info}>
                  <div className={styles.topRow}>
                    <span className={styles.name}>{conv.customerName}</span>
                    <span className={styles.time}>{conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { locale: vi })}</span>
                  </div>
                  <div className={`${styles.preview} ${conv.unreadCount > 0 ? styles.unread : ''}`}>
                    {conv.lastMessagePreview}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className={styles.chatWindow}>
        {!selectedConv ? (
          <div className={styles.emptyState}>Chọn hội thoại để bắt đầu</div>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.customerInfo}>
                <h3>{selectedConv.customerName}</h3>
                <span className={styles.statusText}>{selectedConv.status}</span>
              </div>
              <div className={styles.actions}>
                {selectedConv.status === 'WAITING' && (
                    <button onClick={assignConversation} className={`${styles.btnAction} ${styles.btnPrimary}`}>
                        <CheckCircle size={16} className="mr-1"/> Tiếp nhận
                    </button>
                )}
                {/* Nút Kết thúc chỉ hiện nếu là active CỦA MÌNH */}
                {selectedConv.status === 'ACTIVE' && selectedConv.staffId === user.userId && (
                    <button onClick={finishConversation} className={`${styles.btnAction} ${styles.btnSecondary}`}>
                         Kết thúc
                    </button>
                )}
                {/* Nút Revoke cho Admin */}
                {user?.role === 'ADMIN' && selectedConv.status === 'ACTIVE' && (
                    <button onClick={revokeConversation} className={`${styles.btnAction} ${styles.btnDanger}`}>
                        <RefreshCcw size={16} /> Thu hồi
                    </button>
                )}
              </div>
            </div>

            <div className={styles.messages}>
              {messages.map((msg) => (
                 <div key={msg.id} className={
                     msg.senderType === 'SYSTEM' ? styles.systemMessage :
                     (msg.senderType === 'STAFF' ? `${styles.messageRow} ${styles.right}` : `${styles.messageRow} ${styles.left}`)
                 }>
                    <div className={styles.bubble}>{msg.content}</div>
                    {msg.senderType !== 'SYSTEM' && <span className={styles.msgTime}>{formatDistanceToNow(new Date(msg.sentAt), { locale: vi })}</span>}
                 </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selectedConv.status === 'ACTIVE' && selectedConv.staffId === user.userId ? (
                <div className={styles.inputArea}>
                    <input 
                        className={styles.input}
                        placeholder="Nhập tin nhắn..."
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button className={styles.sendBtn} onClick={sendMessage}><Send size={18} /></button>
                </div>
            ) : (
                <div className="p-4 text-center bg-gray-50 text-gray-500 text-sm border-t">
                    {selectedConv.status === 'WAITING' ? 'Vui lòng tiếp nhận.' : 
                     (selectedConv.status === 'ACTIVE' ? 'Đang được nhân viên khác hỗ trợ.' : 'Đã kết thúc.')}
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}