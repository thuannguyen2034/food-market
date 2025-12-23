'use client';

import { useState, useEffect } from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ImportStockRequestDTO } from '../types';
import styles from '../InventoryPage.module.css';
const formStyles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '12px'
    },
    fullWidth: {
        gridColumn: '1 / -1'
    },
    label: {
        display: 'block',
        fontSize: '0.8rem',
        marginBottom: '4px',
        fontWeight: 500,
        color: '#4b5563'
    },
    input: {
        width: '100%',
        padding: '6px',
        fontSize: '0.9rem',
        border: '1px solid #d1d5db',
        borderRadius: '4px'
    }
};
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
        <div className={styles.tableContainer}>
            <div style={{padding: '12px', borderBottom: '1px solid #eee'}}>
                <h3 style={{margin:0, fontSize:'1rem'}}>Nhập hàng vào kho</h3>
            </div>
            
            <form onSubmit={handleSubmit} style={formStyles.grid}>
                {/* Product Select - Full width */}
                <div style={formStyles.fullWidth}>
                    <label style={formStyles.label}>Sản phẩm <span style={{color:'red'}}>*</span></label>
                    <select
                        value={formData.productId}
                        onChange={(e) => handleChange('productId', Number(e.target.value))}
                        style={formStyles.input}
                    >
                        <option value={0}>-- Chọn sản phẩm --</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Row 2: Batch Code & Quantity */}
                <div>
                    <label style={formStyles.label}>Mã lô (Batch Code)</label>
                    <input
                        type="text"
                        value={formData.batchCode}
                        onChange={(e) => handleChange('batchCode', e.target.value)}
                        placeholder="VD: #L001"
                        style={formStyles.input}
                    />
                </div>

                <div>
                    <label style={formStyles.label}>Số lượng <span style={{color:'red'}}>*</span></label>
                    <input
                        type="number"
                        min="1"
                        value={formData.quantityReceived}
                        onChange={(e) => handleChange('quantityReceived', Number(e.target.value))}
                        style={formStyles.input}
                    />
                </div>

                {/* Row 3: Expiration Date */}
                <div>
                    <label style={formStyles.label}>Ngày hết hạn <span style={{color:'red'}}>*</span></label>
                    <input
                        type="date"
                        value={formData.expirationDate}
                        onChange={(e) => handleChange('expirationDate', e.target.value)}
                        style={formStyles.input}
                    />
                </div>

                {/* Actions - Full width */}
                <div style={{...formStyles.fullWidth, marginTop: '8px', display: 'flex', justifyContent: 'flex-end'}}>
                   <button 
                        type="submit" 
                        disabled={loading}
                        className={styles.refreshButton} // Re-use style
                        style={{background: '#2563eb', color: 'white', borderColor: '#2563eb'}}
                   >
                        {loading ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
                   </button>
                </div>
            </form>
        </div>
    );
}
