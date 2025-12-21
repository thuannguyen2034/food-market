'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pusherClient } from '@/utils/pusher';
import { Conversation, ChatMessage, ChatStats, ConversationStatus } from '@/types/chat';
import { Send, CheckCircle, RefreshCcw, User, X, History, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import styles from './AdminChat.module.css';

// Interface phụ cho Staff List
interface StaffDTO {
  userId: string;
  fullName: string;
  email: string;
}

export default function AdminChatPage() {
  const { user, authedFetch } = useAuth();

  // --- STATE QUẢN LÝ UI ---
  const [activeTab, setActiveTab] = useState<'WAITING' | 'ACTIVE' | 'IDLE'>('WAITING');
  const [adminFilter, setAdminFilter] = useState<'MY' | 'ALL'>('MY');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE DỮ LIỆU ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats>({ waitingCount: 0, myActiveCount: 0 });
  const [staffList, setStaffList] = useState<StaffDTO[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // --- STATE INPUT & PAGINATION ---
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false); // Loading tổng quan
  const [page, setPage] = useState(0);           // Page hiện tại của tin nhắn
  const [hasMore, setHasMore] = useState(true);  // Còn tin cũ hơn không?
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Đang load thêm tin cũ?

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // Để bắt sự kiện scroll

  // ================= 1. FETCH CONVERSATIONS & STATS =================
  const fetchConversations = async () => {
    try {
      const queryParam = searchTerm ? `&keyword=${encodeURIComponent(searchTerm)}` : '';

      let url = '';
      if (activeTab === 'ACTIVE') {
        if (user?.role === 'ADMIN' && adminFilter === 'ALL') {
          url = `/api/v1/chat/admin/conversations?status=ACTIVE${queryParam}`;
        } else {
          url = `/api/v1/chat/admin/conversations/my?keyword=${encodeURIComponent(searchTerm)}`;
        }
      } else {
        url = `/api/v1/chat/admin/conversations?status=${activeTab}${queryParam}`;
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

  const fetchStaffList = async () => {
    // Chỉ fetch 1 lần nếu chưa có data
    if (staffList.length > 0) return;
    try {
      const res = await authedFetch('/api/v1/admin/users?role=STAFF&size=100');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.content);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [activeTab, adminFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, adminFilter]);
  // ================= 2. PUSHER LISTENERS =================
  useEffect(() => {
    if (!user) return;
    const channel = pusherClient.subscribe('admin-chat-feed');

    channel.bind('session-updated', (updatedConv: Conversation) => {
      fetchStats();

      setConversations((prev) => {
        const exists = prev.some(c => c.id === updatedConv.id);
        const isMyConv = updatedConv.staffId === user.userId;
        const shouldShowInActive = (adminFilter === 'ALL' || isMyConv);

        if (updatedConv.status === activeTab) {
          if (activeTab === 'ACTIVE' && !shouldShowInActive) return prev;
          return exists
            ? prev.map(c => c.id === updatedConv.id ? updatedConv : c)
            : [updatedConv, ...prev];
        } else {
          return exists ? prev.filter(c => c.id !== updatedConv.id) : prev;
        }
      });

      // Cập nhật status realtime cho đoạn chat đang mở (nếu có)
      if (selectedConv && selectedConv.id === updatedConv.id) {
        setSelectedConv(updatedConv);
      }
    });

    return () => pusherClient.unsubscribe('admin-chat-feed');
  }, [activeTab, adminFilter, user, selectedConv]);

  // ================= 3. MESSAGE LOGIC (Load & Infinite Scroll) =================

  // Hàm tải tin nhắn chung (dùng cho cả Init và Load More)
  const fetchMessages = async (convId: string, pageIndex: number, isLoadMore: boolean) => {
    try {
      if (isLoadMore) setIsLoadingHistory(true);
      else setLoading(true);

      const res = await authedFetch(`/api/v1/chat/admin/conversations/${convId}/messages?size=20&page=${pageIndex}&sort=sentAt,desc`);

      if (res.ok) {
        const data = await res.json();
        const newMessages = data.content.reverse(); // API trả về DESC (Mới -> Cũ), ta đảo lại để hiển thị (Cũ -> Mới)

        if (isLoadMore) {
          // Giữ vị trí scroll khi load thêm
          const container = messagesContainerRef.current;
          const oldScrollHeight = container ? container.scrollHeight : 0;

          setMessages(prev => [...newMessages, ...prev]);

          // Sau khi render, chỉnh lại scrollTop
          setTimeout(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - oldScrollHeight;
            }
          }, 0);
        } else {
          setMessages(newMessages);
          scrollToBottom();
        }

        // Update pagination state
        setPage(pageIndex);
        setHasMore(!data.last); // Nếu data.last = true -> hết tin
      }
    } catch (err) { console.error(err); }
    finally {
      setLoading(false);
      setIsLoadingHistory(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    // Reset state pagination
    setPage(0);
    setHasMore(true);
    setMessages([]);

    // Fetch trang đầu tiên (page 0)
    fetchMessages(conv.id, 0, false);
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Nếu cuộn lên đỉnh (scrollTop = 0) và còn tin cũ + không đang load
    if (container.scrollTop === 0 && hasMore && !isLoadingHistory) {
      fetchMessages(selectedConv!.id, page + 1, true);
    }
  };

  // Pusher message listener
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
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // ================= 4. ACTIONS (Send, Assign, Finish, Revoke) =================

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

  // Mở Modal Assign
  const openAssignModal = () => {
    if (user?.role === 'ADMIN') {
      fetchStaffList();
      setSelectedStaffId("");
      setShowAssignModal(true);
    }
  };

  // Thực thi Assign (Gọi API)
  const executeAssign = async (targetId: string | null) => {
    if (!selectedConv) return;
    try {
      const body = targetId ? JSON.stringify({ staffId: targetId }) : null;

      await authedFetch(`/api/v1/chat/admin/conversations/${selectedConv.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: body
      });

      // Optimistic UI Update
      const updatedConv = {
        ...selectedConv,
        status: 'ACTIVE' as ConversationStatus,
        staffId: targetId || user!.userId
      };
      setSelectedConv(updatedConv);
      setShowAssignModal(false);

      // Chuyển tab nếu cần
      setActiveTab('ACTIVE');
      if (user?.role === 'ADMIN' && targetId && targetId !== user.userId) {
        setAdminFilter('ALL'); // Nếu gán cho người khác thì chuyển filter ALL để thấy
      } else {
        setAdminFilter('MY');
      }
    } catch (e) { alert('Lỗi nhận chat'); }
  };

  const finishConversation = async () => {
    if (!selectedConv) return;
    if (!confirm('Lưu trữ hội thoại?')) return;
    try {
      await authedFetch(`/api/v1/chat/admin/conversations/${selectedConv.id}/finish`, { method: 'PATCH' });
      setSelectedConv(null);
      fetchStats();
      fetchConversations();
    } catch (e) { alert('Lỗi lưu trữ'); }
  };

  const revokeConversation = async () => {
    if (!selectedConv) return;
    if (!confirm('Đưa hội thoại về hàng chờ?')) return;
    try {
      await authedFetch(`/api/v1/chat/admin/conversations/${selectedConv.id}/revoke`, { method: 'PATCH' });
      setSelectedConv(null);
      fetchStats();
      fetchConversations();
    } catch (e) { alert('Lỗi đưa về hàng chờ'); }
  };

  // Re-open: Từ IDLE/History muốn chat tiếp -> Tự assign cho mình
  const reopenConversation = async () => {
    if (!selectedConv) return;
    // Re-open bản chất là Assign cho chính mình
    await executeAssign(user!.userId);
  };

  // ================= 5. RENDER =================
  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm tên, email..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />

            {/* Nút Clear nếu đang nhập */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
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

        {user?.role === 'ADMIN' && activeTab === 'ACTIVE' && (
          <div className={styles.filterBar}>
            <select
              className={styles.filterSelect}
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value as 'MY' | 'ALL')}
            >
              <option value="MY">Chat của tôi</option>
              <option value="ALL">Tất cả nhân viên</option>
            </select>
          </div>
        )}

        <div className={styles.list}>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500"></div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${selectedConv?.id === conv.id ? styles.selected : ''}`}
                onClick={() => handleSelectConversation(conv)}
              >
                <div className={styles.avatar}>
                  {conv.customerAvatar ? <img src={conv.customerAvatar} alt="" className="w-full h-full object-cover rounded-full" /> : <User size={20} />}
                </div>
                <div className={styles.info}>
                  <div className={styles.topRow}>
                    <span className={styles.name}>{conv.customerName}</span>
                    <span className={styles.time}>{conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { locale: vi })}</span>
                  </div>
                  {conv.staffName && (
                    <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                      <User size={12} /> {conv.staffName}
                    </div>
                  )}
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
                <h3 className="font-bold">{selectedConv.customerName}</h3>
                <span className={styles.statusText}>{selectedConv.status}</span>
                {selectedConv.customerEmail && <span className="text-xs text-gray-500 ml-2">({selectedConv.customerEmail})</span>}
              </div>
              <div className={styles.actions}>
                {/* Nút Tiếp nhận (WAITING) */}
                {selectedConv.status === 'WAITING' && (
                  <>
                    {/* Nút 1: Tự nhận (Nhanh) */}
                    <button
                      onClick={() => executeAssign(user?.userId!)}
                      className={`${styles.btnAction} ${styles.btnPrimary}`}
                      title="Gán cho bản thân"
                    >
                      <CheckCircle size={16} className="mr-1" /> Tiếp nhận
                    </button>

                    {/* Nút 2: Gán cho người khác (Chỉ Admin thấy) */}
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={openAssignModal}
                        className={`${styles.btnAction} bg-gray-100 text-gray-700 hover:bg-gray-200 ml-2`}
                        title="Chuyển cho nhân viên khác"
                      >
                        <User size={16} className="mr-1" /> Chỉ định...
                      </button>
                    )}
                  </>
                )}

                {/* Nút Kết thúc (ACTIVE + Của mình) */}
                {selectedConv.status === 'ACTIVE' && (
                  <div className="flex items-center gap-2">
                    {/* Hiển thị label ai đang chat ngay trên header */}
                    {selectedConv.staffName && (
                      <span className="text-sm text-gray-500 mr-2 bg-gray-100 px-2 py-1 rounded">
                        Nhân viên đang tiếp nhận: <b>{selectedConv.staffName}</b>
                      </span>
                    )}
                    {selectedConv.staffId === user?.userId && (
                      <button onClick={finishConversation} className={`${styles.btnAction} ${styles.btnSecondary}`}>
                        Lưu trữ
                      </button>
                    )}

                    {/* Nút Thu hồi (ACTIVE + Admin) */}
                    {selectedConv.status === 'ACTIVE' && (
                      <button onClick={revokeConversation} className={`${styles.btnAction} ${styles.btnDanger}`}>
                        <RefreshCcw size={16} /> Đưa về hàng chờ
                      </button>
                    )}
                  </div>
                )}

                {/* Nút Mở lại (IDLE) */}
                {selectedConv.status === 'IDLE' && (
                  <button onClick={reopenConversation} className={`${styles.btnAction} ${styles.btnPrimary}`}>
                    <History size={16} className="mr-1" /> Mở lại & Chat
                  </button>
                )}
              </div>
            </div>

            {/* MESSAGE LIST WITH SCROLL HANDLER */}
            <div
              className={styles.messages}
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              {isLoadingHistory && <div className={styles.loadingHistory}>Đang tải tin cũ...</div>}

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

            {selectedConv.status === 'ACTIVE' && selectedConv.staffId === user?.userId ? (
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
                {selectedConv.status === 'WAITING' ? 'Vui lòng tiếp nhận để chat.' :
                  (selectedConv.status === 'ACTIVE' ? `Đang được hỗ trợ bởi nhân viên tiếp nhận.` : 'Cuộc trò chuyện đã kết thúc.')}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL ASSIGN STAFF (Admin Only) */}
      {showAssignModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>Chọn nhân viên tiếp nhận</div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nhân viên:</label>
              <select
                className={styles.selectInput}
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="">-- Chọn nhân viên --</option>
                {staffList
                  .filter(s => s.userId !== user?.userId) // Lọc bỏ bản thân Admin
                  .map(staff => (
                    <option key={staff.userId} value={staff.userId}>
                      {staff.fullName}
                    </option>
                  ))}
              </select>

              {/* Disable nút nếu chưa chọn */}
              <button
                className={`${styles.btnConfirm} ${!selectedStaffId ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => selectedStaffId && executeAssign(selectedStaffId)}
                disabled={!selectedStaffId}
              >
                Gán việc
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}