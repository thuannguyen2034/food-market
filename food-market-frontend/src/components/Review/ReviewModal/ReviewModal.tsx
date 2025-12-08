import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import styles from './ReviewModal.module.css';
import { useAuth } from '@/context/AuthContext';
import { CreateReviewRequest } from '@/app/type/Review';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback khi review thành công để update UI cha
  orderId: string;
  productId: number; // ID snapshot
  productName: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen, onClose, onSuccess, orderId, productId, productName
}) => {
  const { authedFetch } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateReviewRequest = {
        orderId,
        productId,
        rating,
        comment
      };

      const res = await authedFetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Cảm ơn bạn đã đánh giá!');
        onSuccess();
        onClose();
      } else {
        const error = await res.json();
        alert(error.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>
          Đánh giá sản phẩm <br />
          <span className={styles.productName}>{productName}</span>
        </h3>

        {/* Rating Stars */}
        <div className={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.starBtn} ${star <= rating ? styles.starFilled : ''}`}
              onClick={() => setRating(star)}
            >
              <Star size={32} fill={star <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          className={styles.textarea}
          placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={onClose} className={`${styles.btn} ${styles.cancelBtn}`}>
            Đóng
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`${styles.btn} ${styles.submitBtn}`}
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;