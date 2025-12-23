'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Cần bọc trong Suspense vì dùng useSearchParams
function PaymentResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { authedFetch } = useAuth();
    
    // Lấy các tham số VNPAY trả về
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    const vnp_TxnRef = searchParams.get('vnp_TxnRef'); // Đây là OrderID (UUID)
    const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');

    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('Đang xử lý kết quả...');

    useEffect(() => {
        if (!vnp_ResponseCode) {
            setStatus('failed');
            setMessage('Thông tin thanh toán không hợp lệ.');
            return;
        }

        // Logic hiển thị dựa trên ResponseCode
        // Lưu ý: Việc cập nhật DB đã được xử lý ngầm bởi IPN rồi.
        // Trang này chỉ có nhiệm vụ hiển thị cho User an tâm.
        
        if (vnp_ResponseCode === '00') {
            setStatus('success');
            setMessage('Thanh toán thành công! Đơn hàng của bạn đang được xử lý.');
        } else {
            setStatus('failed');
            // Mapping một số mã lỗi phổ biến
            if (vnp_ResponseCode === '24') setMessage('Bạn đã hủy giao dịch.');
            else if (vnp_ResponseCode === '11') setMessage('Giao dịch hết hạn chờ thanh toán.');
            else setMessage('Giao dịch thất bại. Vui lòng thử lại.');
        }
    }, [vnp_ResponseCode]);

    // Hàm thử lại thanh toán (Gọi lại API lấy link)
    const handleRetryPayment = async () => {
        if (!vnp_TxnRef) return;
        try {
            const res = await authedFetch(`/api/payment/create_payment?orderId=${vnp_TxnRef}`);
            if (res.ok) {
                const data = await res.json();
                window.location.href = data.url;
            } else {
                alert('Không thể tạo lại link. Vui lòng vào chi tiết đơn hàng.');
            }
        } catch (e) {
            alert('Lỗi kết nối.');
        }
    };

    return (
        <div style={{
            minHeight: '60vh', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px'
        }}>
            {status === 'loading' && (
                 <RefreshCw className="animate-spin" size={60} color="#0070f3" />
            )}

            {status === 'success' && (
                <>
                    <CheckCircle2 size={80} color="#22c55e" />
                    <h1 className="text-2xl font-bold text-green-600">Thanh toán thành công!</h1>
                    <p className="text-gray-600">{message}</p>
                    <p className="text-sm text-gray-500">Mã đơn: {vnp_TxnRef}</p>
                    
                    <div className="flex gap-4 mt-6">
                        <Link href="/" className="px-6 py-2 border rounded-full hover:bg-gray-50">
                            Về trang chủ
                        </Link>
                        <Link href={`/user/purchase/${vnp_TxnRef}`} className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                            Xem chi tiết đơn hàng
                        </Link>
                    </div>
                </>
            )}

            {status === 'failed' && (
                <>
                    <XCircle size={80} color="#ef4444" />
                    <h1 className="text-2xl font-bold text-red-600">Thanh toán thất bại</h1>
                    <p className="text-gray-600">{message}</p>
                    <p className="text-sm text-gray-500">Đơn hàng của bạn đã được tạo nhưng chưa thanh toán.</p>

                    <div className="flex gap-4 mt-6">
                         <Link href={`/user/purchase/${vnp_TxnRef}`} className="px-6 py-2 border rounded-full hover:bg-gray-50">
                            Xem đơn hàng
                        </Link>
                        <button 
                            onClick={handleRetryPayment}
                            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center gap-2"
                        >
                            <RefreshCw size={18} /> Thử thanh toán lại
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentResultContent />
        </Suspense>
    );
}