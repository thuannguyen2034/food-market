'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext'; // Giả sử bạn có AuthContext
import styles from './CheckoutPage.module.css';

// --- Type Definitions (Mapping với DTO Backend) ---

interface AddressDTO {
    id: number;
    recipientName: string;
    recipientPhone: string;
    province: string;
    district: string;
    ward: string;
    streetAddress: string;
    addressType: string;
    isDefault: boolean;
}

// Mapping Enum DeliveryTimeSlot từ Backend
const TIME_SLOTS = [
    { value: 'SLOT_08_10', label: '08:00 - 10:00' },
    { value: 'SLOT_10_12', label: '10:00 - 12:00' },
    { value: 'SLOT_12_14', label: '12:00 - 14:00' },
    { value: 'SLOT_14_16', label: '14:00 - 16:00' },
    { value: 'SLOT_16_18', label: '16:00 - 18:00' },
    { value: 'SLOT_18_20', label: '18:00 - 20:00' },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { cartData, isLoadingCart, clearCartLocal } = useCart(); // clearCartLocal: hàm clear context nếu cần
    const { user, authedFetch } = useAuth(); // authedFetch: wrapper của fetch có kèm header Authorization

    // State cho Form Checkout
    const [addresses, setAddresses] = useState<AddressDTO[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State cho việc thêm địa chỉ mới (Inline Form)
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        recipientName: '',
        recipientPhone: '',
        province: '',
        district: '',
        ward: '',
        streetAddress: '',
        addressType: 'HOME', // Default
        isDefault: false
    });

    // Format tiền tệ
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // 1. Fetch Addresses khi load trang
    useEffect(() => {
        if (!user) {
            router.push('/login?redirect=/checkout');
            return;
        }

        const fetchAddresses = async () => {
            try {
                const res = await authedFetch(`/api/v1/users/addresses`);
                if (res.ok) {
                    const data: AddressDTO[] = await res.json();
                    setAddresses(data);
                    
                    // Tự động chọn địa chỉ mặc định
                    const defaultAddr = data.find(a => a.isDefault);
                    if (defaultAddr) {
                        setSelectedAddressId(defaultAddr.id);
                    } else if (data.length > 0) {
                        setSelectedAddressId(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Lỗi tải địa chỉ:', error);
            }
        };

        fetchAddresses();
    }, [user, router, authedFetch]);

    // Check giỏ hàng rỗng -> Đá về trang chủ
    useEffect(() => {
        if (!isLoadingCart && cartData && cartData.items.length === 0) {
            router.replace('/');
        }
    }, [cartData, isLoadingCart, router]);

    // Xử lý thêm địa chỉ mới
    const handleSaveNewAddress = async () => {
        // Validate sơ bộ
        if (!newAddress.recipientName || !newAddress.recipientPhone || !newAddress.province) {
            alert('Vui lòng điền đầy đủ thông tin địa chỉ.');
            return;
        }

        try {
            const res = await authedFetch(`/api/v1/users/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress)
            });

            if (res.ok) {
                const savedAddr: AddressDTO = await res.json();
                // Cập nhật list và chọn luôn địa chỉ mới
                setAddresses([...addresses, savedAddr]);
                setSelectedAddressId(savedAddr.id);
                setIsAddingAddress(false); // Đóng form
                // Reset form
                setNewAddress({
                    recipientName: '', recipientPhone: '', province: '',
                    district: '', ward: '', streetAddress: '',
                    addressType: 'HOME', isDefault: false
                });
            } else {
                alert('Không thể lưu địa chỉ. Vui lòng kiểm tra lại.');
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi hệ thống khi lưu địa chỉ.');
        }
    };

    // Xử lý ĐẶT HÀNG (Checkout)
    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert('Vui lòng chọn địa chỉ giao hàng.');
            return;
        }
        if (!selectedSlot) {
            alert('Vui lòng chọn khung giờ nhận hàng mong muốn.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            addressId: selectedAddressId,
            paymentMethod: 'COD', // Hardcode theo yêu cầu
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
                // 1. Clear cart context (vì Backend đã xóa DB)
                if (clearCartLocal) clearCartLocal();
                
                // 2. Chuyển hướng đến trang thành công hoặc chi tiết đơn
                alert('Đặt hàng thành công! Mã đơn: ' + orderData.orderId);
                router.push(`/profile/orders/${orderData.orderId}`); // Ví dụ
            } else {
                const errData = await res.json();
                // Nếu lỗi do giá thay đổi (như ta đã bàn luận ở Backend)
                if (res.status === 409 || errData.message?.includes('giá')) {
                    alert('Lỗi: ' + (errData.message || 'Có thay đổi về giá/tồn kho. Vui lòng kiểm tra lại.'));
                    window.location.reload(); // Reload để lấy giá mới
                } else {
                    alert('Đặt hàng thất bại: ' + (errData.message || 'Lỗi không xác định'));
                }
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối đến máy chủ.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingCart || !cartData) {
        return <div className={styles.container}>Đang tải thông tin thanh toán...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Thanh toán & Đặt hàng</h1>

            <div className={styles.layout}>
                {/* --- CỘT TRÁI: THÔNG TIN --- */}
                <div className={styles.leftColumn}>
                    
                    {/* 1. Chọn Địa Chỉ */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>1. Địa chỉ nhận hàng</h2>
                        
                        <div className={styles.addressList}>
                            {addresses.length === 0 && !isAddingAddress && (
                                <p style={{color: '#666'}}>Bạn chưa có địa chỉ nào. Vui lòng thêm mới.</p>
                            )}

                            {addresses.map(addr => (
                                <div 
                                    key={addr.id} 
                                    className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedAddressId(addr.id)}
                                >
                                    <input 
                                        type="radio" 
                                        name="addressGroup"
                                        className={styles.radioInput}
                                        checked={selectedAddressId === addr.id}
                                        readOnly
                                    />
                                    <div className={styles.addressContent}>
                                        <strong>{addr.recipientName} ({addr.recipientPhone})</strong>
                                        <p>{addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}</p>
                                        <span style={{fontSize: '0.8rem', color: '#999'}}>
                                            {addr.addressType} {addr.isDefault ? '(Mặc định)' : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Nút mở form thêm địa chỉ */}
                        {!isAddingAddress ? (
                            <button className={styles.addAddressBtn} onClick={() => setIsAddingAddress(true)}>
                                + Thêm địa chỉ mới
                            </button>
                        ) : (
                            <div className={styles.newAddressForm}>
                                <h4>Thêm địa chỉ mới</h4>
                                <div className={styles.formGroup}>
                                    <input 
                                        className={styles.input} placeholder="Tên người nhận"
                                        value={newAddress.recipientName}
                                        onChange={e => setNewAddress({...newAddress, recipientName: e.target.value})}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <input 
                                        className={styles.input} placeholder="Số điện thoại"
                                        value={newAddress.recipientPhone}
                                        onChange={e => setNewAddress({...newAddress, recipientPhone: e.target.value})}
                                    />
                                </div>
                                <div className={styles.formGroup} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                    <input 
                                        className={styles.input} placeholder="Tỉnh/Thành phố"
                                        value={newAddress.province}
                                        onChange={e => setNewAddress({...newAddress, province: e.target.value})}
                                    />
                                    <input 
                                        className={styles.input} placeholder="Quận/Huyện"
                                        value={newAddress.district}
                                        onChange={e => setNewAddress({...newAddress, district: e.target.value})}
                                    />
                                </div>
                                <div className={styles.formGroup} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                    <input 
                                        className={styles.input} placeholder="Phường/Xã"
                                        value={newAddress.ward}
                                        onChange={e => setNewAddress({...newAddress, ward: e.target.value})}
                                    />
                                    <input 
                                        className={styles.input} placeholder="Số nhà, tên đường"
                                        value={newAddress.streetAddress}
                                        onChange={e => setNewAddress({...newAddress, streetAddress: e.target.value})}
                                    />
                                </div>
                                <div className={styles.formActions}>
                                    <button className={styles.btnPrimary} onClick={handleSaveNewAddress}>Lưu địa chỉ</button>
                                    <button className={styles.btnSecondary} onClick={() => setIsAddingAddress(false)}>Hủy</button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 2. Chọn Thời Gian */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>2. Thời gian giao hàng</h2>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Chọn khung giờ mong muốn:</label>
                            <select 
                                className={styles.select}
                                value={selectedSlot}
                                onChange={(e) => setSelectedSlot(e.target.value)}
                            >
                                <option value="">-- Vui lòng chọn --</option>
                                {TIME_SLOTS.map(slot => (
                                    <option key={slot.value} value={slot.value}>
                                        {slot.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>

                    {/* 3. Thanh toán & Ghi chú */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>3. Thanh toán & Ghi chú</h2>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Phương thức thanh toán:</label>
                            <div className={styles.paymentOption}>
                                <input type="radio" checked readOnly />
                                <span>Thanh toán khi nhận hàng (COD)</span>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Ghi chú cho đơn hàng (tùy chọn):</label>
                            <textarea 
                                className={styles.textarea}
                                placeholder="Ví dụ: Gọi trước khi giao, giao giờ hành chính..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </section>
                </div>

                {/* --- CỘT PHẢI: TÓM TẮT ĐƠN HÀNG --- */}
                <div className={styles.rightColumn}>
                    <div className={styles.summaryBox}>
                        <h3 className={styles.sectionTitle}>Đơn hàng ({cartData.items.length} món)</h3>
                        
                        {/* List Items rút gọn */}
                        <div style={{maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem'}}>
                            {cartData.items.map(item => (
                                <div key={item.cartItemId} className={styles.summaryItem}>
                                    <span className={styles.itemName}>
                                        {item.quantity}x {item.product.name}
                                    </span>
                                    <span>{formatPrice(item.totalItemPrice)}</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.row}>
                            <span>Tạm tính:</span>
                            <span>{formatPrice(cartData.grandTotal)}</span>
                        </div>
                        <div className={styles.row}>
                            <span>Phí vận chuyển:</span>
                            <span>Miễn phí</span>
                        </div>

                        <div className={styles.totalRow}>
                            <span>Tổng cộng:</span>
                            <span>{formatPrice(cartData.grandTotal)}</span>
                        </div>

                        <button 
                            className={styles.checkoutBtn} 
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting || !selectedAddressId || !selectedSlot}
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'ĐẶT HÀNG NGAY'}
                        </button>

                        <p style={{fontSize: '0.85rem', color: '#666', marginTop: '1rem', textAlign: 'center'}}>
                            Bằng việc đặt hàng, bạn đồng ý với điều khoản dịch vụ của Food Market.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}