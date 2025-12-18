'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, getHours, isSameDay } from 'date-fns';
import { Plus, X, CheckCircle2 } from 'lucide-react'; // Import thêm icon
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

import AddressCard from '@/components/Address/AddressCard';
import AddressModal from '@/components/Address/AddressModal';
import { UserAddress } from '@/app/(protected)/user/address/page';

import styles from './CheckoutPage.module.css';

// Enum Time Slots
const TIME_SLOTS = [
    { value: 'SLOT_08_10', label: '08:00 - 10:00', startHour: 8 },
    { value: 'SLOT_10_12', label: '10:00 - 12:00', startHour: 10 },
    { value: 'SLOT_12_14', label: '12:00 - 14:00', startHour: 12 },
    { value: 'SLOT_14_16', label: '14:00 - 16:00', startHour: 14 },
    { value: 'SLOT_16_18', label: '16:00 - 18:00', startHour: 16 },
    { value: 'SLOT_18_20', label: '18:00 - 20:00', startHour: 18 },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { cartData, isLoadingCart, clearCartLocal } = useCart();
    const { user, authedFetch } = useAuth();

    // --- State Management ---
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    
    // UI State
    const [showSelectionModal, setShowSelectionModal] = useState(false); // Popup danh sách
    const [showAddressModal, setShowAddressModal] = useState(false);     // Popup Thêm/Sửa
    const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

    // Delivery & Note State
    const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Helpers ---
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const today = new Date();
    const tomorrow = addDays(today, 1);

    // 1. Fetch Addresses
    const fetchAddresses = async () => {
        try {
            const res = await authedFetch(`/api/v1/users/addresses`);
            if (res.ok) {
                const data: UserAddress[] = await res.json();
                setAddresses(data);
                
                // Nếu chưa chọn, tự động chọn Mặc định hoặc cái đầu tiên
                if (!selectedAddressId && data.length > 0) {
                    const defaultAddr = data.find(a => a.default);
                    setSelectedAddressId(defaultAddr ? defaultAddr.id : data[0].id);
                }
            }
        } catch (error) {
            console.error('Lỗi tải địa chỉ:', error);
        }
    };

    useEffect(() => {
        if (user) fetchAddresses();
        else router.push('/login?redirect=/checkout');
    }, [user, router]);

    // Check Cart Empty
    useEffect(() => {
        if (!isLoadingCart && cartData && cartData.items.length === 0) {
            router.replace('/');
        }
    }, [cartData, isLoadingCart, router]);

    // 2. Filter Time Slots
    const availableSlots = useMemo(() => {
        if (!isSameDay(deliveryDate, today)) return TIME_SLOTS;
        const currentHour = getHours(new Date());
        return TIME_SLOTS.filter(slot => slot.startHour > currentHour + 1);
    }, [deliveryDate]);

    useEffect(() => {
        const isSlotValid = availableSlots.some(s => s.value === selectedSlot);
        if (!isSlotValid) setSelectedSlot('');
    }, [availableSlots, selectedSlot]);

    // 3. Address CRUD Handlers
    const handleDeleteAddress = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
        try {
            const res = await authedFetch(`/api/v1/users/addresses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Xóa thành công');
                fetchAddresses();
                // Nếu xóa đúng cái đang chọn thì reset
                if (selectedAddressId === id) setSelectedAddressId(null);
            }
        } catch (error) { toast.error('Lỗi khi xóa'); }
    };

    const handleSetDefaultAddress = async (id: number) => {
        try {
            const res = await authedFetch(`/api/v1/users/addresses/${id}/default`, { method: 'PUT' });
            if (res.ok) {
                toast.success('Đã đặt làm mặc định');
                fetchAddresses();
            }
        } catch (error) { toast.error('Lỗi hệ thống'); }
    };

    const handleSaveAddress = (savedAddress: UserAddress) => {
        setShowAddressModal(false); 
        fetchAddresses();           
        setSelectedAddressId(savedAddress.id); 
        setShowSelectionModal(false); 
    };

    // 4. Place Order
    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            toast.error('Vui lòng chọn địa chỉ giao hàng.');
            return;
        }
        if (!selectedSlot) {
            toast.error('Vui lòng chọn khung giờ giao hàng.');
            return;
        }

        setIsSubmitting(true);
        const formattedDate = format(deliveryDate, 'yyyy-MM-dd');
        const payload = {
            addressId: selectedAddressId,
            paymentMethod: 'COD',
            deliveryDate: formattedDate,
            deliveryTimeslot: selectedSlot,
            note: note
        };

        try {
            const res = await authedFetch(`/api/v1/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const orderData = await res.json();
                if (clearCartLocal) clearCartLocal();
                toast.success('Đặt hàng thành công!');
                router.push(`/user/purchase/${orderData.orderId}`);
            } else {
                const errData = await res.json();
                if (res.status === 409 || errData.message?.includes('giá') || errData.message?.includes('kho')) {
                    toast.error('Dữ liệu sản phẩm thay đổi. Đang tải lại...');
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    toast.error(errData.message || 'Đặt hàng thất bại');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi kết nối');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingCart || !cartData) return <div className={styles.container}>Đang tải...</div>;

    // Tìm object địa chỉ đang được chọn để hiển thị
    const currentAddress = addresses.find(a => a.id === selectedAddressId);
    const savings = cartData.baseGrandTotal - cartData.grandTotal;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Thanh toán & Đặt hàng</h1>

            <div className={styles.layout}>
                {/* --- CỘT TRÁI --- */}
                <div className={styles.leftColumn}>
                    
                    {/* SECTION 1: ĐỊA CHỈ (UI Mới) */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>1. Địa chỉ nhận hàng</h2>
                        
                        {currentAddress ? (
                            // TRƯỜNG HỢP 1: Đã có địa chỉ được chọn
                            <div className={styles.selectedAddressContainer}>
                                {/* Hiển thị AddressCard nhưng ẩn bớt nút xóa/default nếu muốn, 
                                    ở đây ta dùng component có sẵn */}
                                <AddressCard 
                                    address={currentAddress}
                                    onEdit={() => {
                                        setEditingAddress(currentAddress);
                                        setShowAddressModal(true);
                                    }}
                                    onDelete={() => handleDeleteAddress(currentAddress.id)}
                                    onSetDefault={() => handleSetDefaultAddress(currentAddress.id)}
                                />
                                
                                {/* Nút Thay đổi -> Mở Popup List */}
                                <button 
                                    className={styles.changeAddressBtn}
                                    onClick={() => setShowSelectionModal(true)}
                                >
                                    Thay đổi địa chỉ khác
                                </button>
                            </div>
                        ) : (
                            // TRƯỜNG HỢP 2: Chưa có địa chỉ nào
                            <div style={{textAlign: 'center', padding: '1rem'}}>
                                <p style={{color: '#666', marginBottom: '1rem'}}>Bạn chưa có địa chỉ nhận hàng.</p>
                                <button 
                                    className={styles.addAddressBtn} 
                                    onClick={() => {
                                        setEditingAddress(null);
                                        setShowAddressModal(true);
                                    }}
                                >
                                    <Plus size={18} /> Thêm địa chỉ mới
                                </button>
                            </div>
                        )}
                    </section>

                    {/* SECTION 2: THỜI GIAN */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>2. Thời gian giao hàng</h2>
                        <div className={styles.dateSelection}>
                            <div 
                                className={`${styles.dateOption} ${isSameDay(deliveryDate, today) ? styles.active : ''}`}
                                onClick={() => setDeliveryDate(today)}
                            >
                                Hôm nay ({format(today, 'dd/MM')})
                            </div>
                            <div 
                                className={`${styles.dateOption} ${isSameDay(deliveryDate, tomorrow) ? styles.active : ''}`}
                                onClick={() => setDeliveryDate(tomorrow)}
                            >
                                Ngày mai ({format(tomorrow, 'dd/MM')})
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Khung giờ khả dụng:</label>
                            {availableSlots.length > 0 ? (
                                <select 
                                    className={styles.select}
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(e.target.value)}
                                >
                                    <option value="">-- Chọn khung giờ --</option>
                                    {availableSlots.map(slot => (
                                        <option key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p style={{color: '#d32f2f'}}>Hết khung giờ giao hôm nay. Vui lòng chọn ngày mai.</p>
                            )}
                        </div>
                    </section>

                    {/* SECTION 3: THANH TOÁN & NOTE */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>3. Thanh toán & Ghi chú</h2>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Phương thức thanh toán:</label>
                            <div className={styles.paymentOption}>
                                <input type="radio" checked readOnly style={{accentColor: '#0070f3'}} />
                                <span>Thanh toán khi nhận hàng (COD)</span>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Ghi chú:</label>
                            <textarea 
                                className={styles.textarea}
                                placeholder="Lời nhắn..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </section>
                </div>

                {/* --- CỘT PHẢI: SUMMARY --- */}
                <div className={styles.rightColumn}>
                    <div className={styles.summaryBox}>
                        <h3 className={styles.sectionTitle}>Đơn hàng ({cartData.items.length} món)</h3>
                        <div style={{maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem'}}>
                            {cartData.items.map(item => (
                                <div key={item.cartItemId} className={styles.summaryItem}>
                                    <div className={styles.itemName}>
                                        <b>{item.quantity}x</b> {item.product.name}
                                    </div>
                                    <div style={{textAlign: 'right'}}>
                                        {item.totalBasePrice > item.totalItemPrice && (
                                            <div style={{fontSize: '0.8rem', textDecoration: 'line-through', color: '#999'}}>
                                                {formatPrice(item.totalBasePrice)}
                                            </div>
                                        )}
                                        <div>{formatPrice(item.totalItemPrice)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.row}>
                            <span>Tạm tính:</span>
                            <span>{formatPrice(cartData.grandTotal)}</span>
                        </div>
                        {savings > 0 && (
                            <div className={styles.savingsRow}>
                                <span>Tiết kiệm được:</span>
                                <span>-{formatPrice(savings)}</span>
                            </div>
                        )}
                        <div className={styles.totalRow}>
                            <span>Tổng thanh toán:</span>
                            <span>{formatPrice(cartData.grandTotal)}</span>
                        </div>

                        <button 
                            className={styles.checkoutBtn} 
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting || !selectedAddressId || !selectedSlot}
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'ĐẶT HÀNG NGAY'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- POPUP 1: MODAL CHỌN ĐỊA CHỈ (Selection Modal) --- */}
            {showSelectionModal && (
                <div className={styles.modalOverlay} onClick={() => setShowSelectionModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Chọn địa chỉ nhận hàng</h3>
                            <button className={styles.closeBtn} onClick={() => setShowSelectionModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {addresses.map(addr => (
                                <div 
                                    key={addr.id}
                                    // Click vào card để chọn ngay
                                    className={`${styles.addressOption} ${selectedAddressId === addr.id ? styles.selected : ''}`}
                                    onClick={() => {
                                        setSelectedAddressId(addr.id);
                                        setShowSelectionModal(false); // Chọn xong đóng luôn popup
                                    }}
                                >
                                    {selectedAddressId === addr.id && (
                                        <div className={styles.checkIcon}>
                                            <CheckCircle2 size={20} fill="white" />
                                        </div>
                                    )}
                                    {/* Dùng lại AddressCard để hiển thị thông tin đẹp mắt */}
                                    {/* Chặn sự kiện click vào các nút Sửa/Xóa để không kích hoạt 'Chọn' */}
                                    <div onClick={e => e.stopPropagation()}>
                                        <AddressCard 
                                            address={addr}
                                            onEdit={() => {
                                                setEditingAddress(addr);
                                                setShowAddressModal(true);
                                                // setShowSelectionModal(false); // Tùy chọn: Đóng list khi mở edit
                                            }}
                                            onDelete={() => handleDeleteAddress(addr.id)}
                                            onSetDefault={() => handleSetDefaultAddress(addr.id)}
                                        />
                                    </div>
                                </div>
                            ))}

                            <button 
                                className={styles.addAddressBtn} 
                                onClick={() => {
                                    setEditingAddress(null);
                                    setShowAddressModal(true);
                                    // setShowSelectionModal(false); // Tùy chọn
                                }}
                            >
                                <Plus size={18} /> Thêm địa chỉ mới
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- POPUP 2: MODAL THÊM/SỬA (AddressModal) --- */}
            {showAddressModal && (
                <AddressModal 
                    initialData={editingAddress}
                    onClose={() => setShowAddressModal(false)}
                    onSave={handleSaveAddress}
                />
            )}
        </div>
    );
}