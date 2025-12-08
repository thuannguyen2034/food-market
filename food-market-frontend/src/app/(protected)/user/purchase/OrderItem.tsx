import React, { useState } from 'react'; import Link from 'next/link';
import styles from './OrderItem.module.css';
import { Star, CheckCircle } from 'lucide-react'; 
import { OrderItemDTO, OrderStatus } from '@/app/type/Order';
import ReviewModal from '@/components/Review/ReviewModal/ReviewModal';
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

interface OrderItemProps {
    item: OrderItemDTO;
    orderId: string;        // Thêm prop
    orderStatus: OrderStatus; // Thêm prop
}

const OrderItem: React.FC<OrderItemProps> = ({ item, orderId, orderStatus }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isReviewedLocal, setIsReviewedLocal] = useState(item.isReviewed);

  // Logic hiển thị nút Review:
  // 1. Đơn hàng phải là DELIVERED (Giao thành công)
  // 2. Chưa review (dựa trên props ban đầu hoặc state local sau khi review xong)
  const canReview = orderStatus === OrderStatus.DELIVERED && !isReviewedLocal;

  const handleReviewSuccess = () => {
    setIsReviewedLocal(true); // Cập nhật state để ẩn nút ngay lập tức
  };

  const productUrl = `/${item.categorySlug}/${item.productSlug}`;

  return (
    <>
      <div className={styles.container}>
        <Link href={productUrl} className={styles.linkWrapper}>
          <div className={styles.imageWrapper}>
            <img 
              src={item.productThumbnailSnapshot} 
              alt={item.productNameSnapshot} 
              className={styles.image}
            />
          </div>
          <div className={styles.info}>
            <h4 className={styles.name}>{item.productNameSnapshot}</h4>
            <div className={styles.meta}>
              <span className={styles.quantity}>x{item.quantity}</span>
              <span className={styles.price}>{formatCurrency(item.priceAtPurchase)}</span>
            </div>
          </div>
        </Link>

        {/* Phần nút Review nằm bên phải */}
        <div className={styles.actionArea}>
          {canReview && (
            <button 
              className={styles.reviewBtn}
              onClick={(e) => {
                e.preventDefault(); // Tránh click nhầm vào Link sản phẩm
                setShowReviewModal(true);
              }}
            >
              <Star size={14} style={{marginRight: 4}} />
              Đánh giá
            </button>
          )}
          
          {/* Nếu đã review rồi thì hiện label */}
          {isReviewedLocal && orderStatus === OrderStatus.DELIVERED && (
             <span className={styles.reviewedLabel}>
               <CheckCircle size={14} style={{marginRight: 4}}/>
               Đã đánh giá
             </span>
          )}
        </div>
      </div>

      {/* Modal nằm ngoài DOM của Link để tránh lỗi nesting */}
      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSuccess={handleReviewSuccess}
        orderId={orderId}
        productId={item.productIdSnapshot || 0} // Lưu ý: Backend phải map field này, nếu item.productIdSnapshot null thì cần check
        productName={item.productNameSnapshot}
      />
    </>
  );
};

export default OrderItem;