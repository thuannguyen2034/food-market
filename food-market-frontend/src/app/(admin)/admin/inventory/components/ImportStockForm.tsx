'use client';

import { useState, useEffect } from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ImportStockRequestDTO } from '../types';
import styles from '@/styles/admin/Inventory.module.css';

type Props = {
    onSuccess?: () => void;
};

type Product = {
    id: number;
    name: string;
};

export default function ImportStockForm({ onSuccess }: Props) {
    const { authedFetch } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ImportStockRequestDTO>({
        productId: 0,
        batchCode: '',
        expirationDate: '',
        quantityReceived: 1,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            // Fetch products for dropdown - adjust endpoint as needed
            const response = await authedFetch('/api/v1/admin/products?size=1000');
            if (response.ok) {
                const data = await response.json();
                setProducts(data.content || []);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.productId || formData.productId === 0) {
            newErrors.productId = 'Vui lòng chọn sản phẩm';
        }

        if (!formData.expirationDate) {
            newErrors.expirationDate = 'Vui lòng chọn ngày hết hạn';
        } else {
            const expiryDate = new Date(formData.expirationDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expiryDate <= today) {
                newErrors.expirationDate = 'Ngày hết hạn phải trong tương lai';
            }
        }

        if (!formData.quantityReceived || formData.quantityReceived < 1) {
            newErrors.quantityReceived = 'Số lượng phải lớn hơn 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await authedFetch('/api/v1/admin/inventory/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert('✅ Nhập hàng thành công!');
                // Reset form
                setFormData({
                    productId: 0,
                    batchCode: '',
                    expirationDate: '',
                    quantityReceived: 1,
                });
                setErrors({});
                onSuccess?.();
            } else {
                const error = await response.text();
                alert(`❌ Lỗi: ${error}`);
            }
        } catch (error) {
            console.error('Failed to import stock:', error);
            alert('❌ Có lỗi xảy ra khi nhập hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof ImportStockRequestDTO, value: any) => {
        setFormData({ ...formData, [field]: value });
        // Clear error when user types
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2 className={styles.formTitle}><Package size={24} /> Nhập hàng mới</h2>

            <form onSubmit={handleSubmit} className={styles.importForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="productId">
                        Sản phẩm <span className={styles.required}>*</span>
                    </label>
                    <select
                        id="productId"
                        value={formData.productId}
                        onChange={(e) => handleChange('productId', Number(e.target.value))}
                        className={errors.productId ? styles.inputError : ''}
                    >
                        <option value={0}>-- Chọn sản phẩm --</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                    {errors.productId && (
                        <span className={styles.errorText}>{errors.productId}</span>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="batchCode">Mã lô (tùy chọn)</label>
                    <input
                        id="batchCode"
                        type="text"
                        value={formData.batchCode}
                        onChange={(e) => handleChange('batchCode', e.target.value)}
                        placeholder="Nhập mã lô từ nhà cung cấp"
                    />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="quantityReceived">
                            Số lượng <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="quantityReceived"
                            type="number"
                            min="1"
                            value={formData.quantityReceived}
                            onChange={(e) => handleChange('quantityReceived', Number(e.target.value))}
                            className={errors.quantityReceived ? styles.inputError : ''}
                        />
                        {errors.quantityReceived && (
                            <span className={styles.errorText}>{errors.quantityReceived}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="expirationDate">
                            Ngày hết hạn <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="expirationDate"
                            type="date"
                            value={formData.expirationDate}
                            onChange={(e) => handleChange('expirationDate', e.target.value)}
                            className={errors.expirationDate ? styles.inputError : ''}
                        />
                        {errors.expirationDate && (
                            <span className={styles.errorText}>{errors.expirationDate}</span>
                        )}
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading ? 'Đang xử lý...' : <><CheckCircle size={16} /> Nhập hàng</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
