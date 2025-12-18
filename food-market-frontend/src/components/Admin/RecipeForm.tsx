'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Upload, X, Loader2, Sparkles, Save, ArrowLeft, Search, Plus } from 'lucide-react';
import styles from '@/styles/admin/RecipeForm.module.css'; // Sẽ tạo sau

// Định nghĩa Props
interface RecipeFormProps {
    initialData?: {
        id?: number;
        name: string;
        cookingSteps: string;
        ingredients: string;
        tags: string;
        productIds: number[];
        imageUrl?: string;
    };
    isEditMode?: boolean;
}

// Interface cho sản phẩm từ API
interface ProductSearchResult {
    id: number;
    name: string;
    images: { imageUrl: string; displayOrder: number }[];
}

export default function RecipeForm({ initialData, isEditMode = false }: RecipeFormProps) {
    const router = useRouter();
    const { authedFetch } = useAuth();

    // State Form
    const [name, setName] = useState(initialData?.name || '');
    const [ingredientsList, setIngredientsList] = useState<string[]>(
        initialData?.ingredients ? initialData.ingredients.split('|').filter(i => i.trim()) : []
    );
    const [newIngredient, setNewIngredient] = useState('');
    const [cookingSteps, setCookingSteps] = useState(initialData?.cookingSteps || '');
    const [tags, setTags] = useState(initialData?.tags || '');

    // State cho Product Selection
    const [selectedProducts, setSelectedProducts] = useState<ProductSearchResult[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productSearchResults, setProductSearchResults] = useState<ProductSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // State Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);

    // State Loading
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    // Load initial products nếu có initialData
    useEffect(() => {
        if (initialData?.productIds && initialData.productIds.length > 0) {
            loadInitialProducts(initialData.productIds);
        }
    }, []);

    // Load thông tin sản phẩm ban đầu (khi edit)
    const loadInitialProducts = async (productIds: number[]) => {
        try {
            const promises = productIds.map(id =>
                authedFetch(`/api/v1/admin/products/${id}`).then(res => res.json())
            );
            const products = await Promise.all(promises);
            setSelectedProducts(products);
        } catch (error) {
            console.error('Error loading initial products:', error);
        }
    };

    // Tìm kiếm sản phẩm
    const handleProductSearch = async (searchTerm: string) => {
        setProductSearchTerm(searchTerm);

        if (!searchTerm.trim()) {
            setProductSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowSearchDropdown(true);

        try {
            const res = await authedFetch(
                `/api/v1/admin/products?searchTerm=${encodeURIComponent(searchTerm)}&size=10`
            );
            if (res.ok) {
                const data = await res.json();
                setProductSearchResults(data.content || []);
            }
        } catch (error) {
            console.error('Product search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Thêm sản phẩm vào danh sách đã chọn
    const handleSelectProduct = (product: ProductSearchResult) => {
        // Kiểm tra xem đã chọn sản phẩm này chưa
        if (!selectedProducts.find(p => p.id === product.id)) {
            setSelectedProducts([...selectedProducts, product]);
        }
        // Reset search
        setProductSearchTerm('');
        setProductSearchResults([]);
        setShowSearchDropdown(false);
    };

    // Xóa sản phẩm khỏi danh sách đã chọn
    const handleRemoveProduct = (productId: number) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    // Thêm nguyên liệu vào danh sách
    const handleAddIngredient = () => {
        const trimmed = newIngredient.trim();
        if (trimmed && !ingredientsList.includes(trimmed)) {
            setIngredientsList([...ingredientsList, trimmed]);
            setNewIngredient('');
        }
    };

    // Xóa nguyên liệu khỏi danh sách
    const handleRemoveIngredient = (index: number) => {
        setIngredientsList(ingredientsList.filter((_, i) => i !== index));
    };

    // Xử lý phím Enter khi nhập nguyên liệu
    const handleIngredientKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddIngredient();
        }
    };

    // Xử lý chọn ảnh
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // 🤖 Xử lý AI Analysis
    const handleAnalyzeAI = async () => {
        if (!name || ingredientsList.length === 0) {
            alert("Vui lòng nhập Tên món và Nguyên liệu để AI phân tích.");
            return;
        }
        setAiLoading(true);
        try {
            const ingredientsString = ingredientsList.join('|');
            const res = await authedFetch('/api/v1/admin/recipes/analyze-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, ingredients: ingredientsString }), // DTO: AiAnalysisRequestDTO
            });

            if (res.ok) {
                const data = await res.json(); // Nhận về: { tags: ["TAG1", "TAG2"] }
                // Format lại tags thành chuỗi cách nhau dấu phẩy để hiển thị trong input
                const aiTags = data.tags.join(', ');
                setTags(prev => prev ? `${prev}, ${aiTags}` : aiTags);
            } else {
                alert("Lỗi khi gọi AI service");
            }
        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setAiLoading(false);
        }
    };

    // Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Chuẩn bị JSON Body
            const recipeDTO = {
                name,
                ingredients: ingredientsList.join('|'), // Join với dấu | để lưu
                cookingSteps,
                tags: tags.trim(),
                productIds: selectedProducts.map(p => p.id) // Lấy ID từ các sản phẩm đã chọn
            };

            // 2. Chuẩn bị FormData (Multipart)
            const formData = new FormData();
            formData.append('data', new Blob([JSON.stringify(recipeDTO)], { type: 'application/json' }));
            if (imageFile) {
                formData.append('image', imageFile);
            }

            // 3. Gọi API
            const url = isEditMode
                ? `/api/v1/admin/recipes/${initialData?.id}`
                : '/api/v1/admin/recipes';

            const method = isEditMode ? 'PUT' : 'POST';

            const res = await authedFetch(url, {
                method: method,
                body: formData,
                // Lưu ý: Không set Content-Type header khi dùng FormData, browser tự set boundary
            });

            if (res.ok) {
                alert(isEditMode ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
                router.push('/admin/recipes');
            } else {
                const errData = await res.json();
                alert(`Lỗi: ${errData.message || 'Không thể lưu công thức'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Đã có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            {/* Header Form */}
            <div className={styles.formHeader}>
                <button type="button" onClick={() => router.back()} className={styles.backButton}>
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <h2 className={styles.title}>{isEditMode ? 'Chỉnh sửa Công thức' : 'Thêm Công thức mới'}</h2>
            </div>

            <div className={styles.formGrid}>
                {/* Cột trái: Thông tin chính */}
                <div className={styles.mainInfo}>

                    <div className={styles.formGroup}>
                        <label>Tên món ăn <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="Ví dụ: Phở bò tái nạm"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Nguyên liệu <span className={styles.required}>*</span></label>

                        {/* Input thêm nguyên liệu */}
                        <div className={styles.ingredientInputWrapper}>
                            <input
                                type="text"
                                value={newIngredient}
                                onChange={e => setNewIngredient(e.target.value)}
                                onKeyPress={handleIngredientKeyPress}
                                placeholder="Nhập tên nguyên liệu..."
                                className={styles.input}
                            />
                            <button
                                type="button"
                                onClick={handleAddIngredient}
                                disabled={!newIngredient.trim()}
                                className={styles.addIngredientBtn}
                            >
                                <Plus size={18} /> Thêm
                            </button>
                        </div>

                        {/* Danh sách nguyên liệu đã thêm */}
                        {ingredientsList.length > 0 && (
                            <div className={styles.ingredientsList}>
                                {ingredientsList.map((ingredient, index) => (
                                    <div key={index} className={styles.ingredientBadge}>
                                        <span className={styles.ingredientText}>{ingredient}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveIngredient(index)}
                                            className={styles.ingredientRemoveBtn}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <small className={styles.hint}>
                            {ingredientsList.length === 0
                                ? 'Nhập từng nguyên liệu và nhấn "Thêm" hoặc Enter.'
                                : `Đã có ${ingredientsList.length} nguyên liệu.`
                            }
                        </small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Các bước thực hiện</label>
                        <textarea
                            rows={8}
                            value={cookingSteps}
                            onChange={e => setCookingSteps(e.target.value)}
                            placeholder="Bước 1: Rửa sạch thịt..."
                            className={styles.textarea}
                        />
                    </div>

                    {/* AI Section */}
                    <div className={styles.aiSection}>
                        <div className={styles.aiHeader}>
                            <label>Tags (Phân loại)</label>
                            <button
                                type="button"
                                onClick={handleAnalyzeAI}
                                disabled={aiLoading}
                                className={styles.aiButton}
                            >
                                {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                Gợi ý Tags bằng AI
                            </button>
                        </div>
                        <input
                            type="text"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            placeholder="HIGH_PROTEIN, SPICY..."
                            className={styles.input}
                        />
                        <small className={styles.hint}>Nhấn nút AI để tự động điền dựa trên tên và nguyên liệu.</small>
                    </div>
                </div>

                {/* Cột phải: Ảnh & Liên kết Product */}
                <div className={styles.sideInfo}>
                    {/* Upload Ảnh */}
                    <div className={styles.imageUploadBox}>
                        <label className={styles.uploadLabel}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className={styles.imagePreview} />
                            ) : (
                                <div className={styles.placeholder}>
                                    <Upload size={40} />
                                    <span>Tải ảnh lên</span>
                                </div>
                            )}
                            <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                        </label>
                        {previewUrl && (
                            <button type="button" onClick={() => { setPreviewUrl(null); setImageFile(null); }} className={styles.removeImageBtn}>
                                <X size={16} /> Bỏ ảnh
                            </button>
                        )}
                    </div>

                    {/* Liên kết sản phẩm - Search based */}
                    <div className={styles.formGroup}>
                        <label>Sản phẩm liên quan</label>

                        {/* Product Search Input */}
                        <div className={styles.productSearchContainer}>
                            <div className={styles.searchInputWrapper}>
                                <Search size={18} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    value={productSearchTerm}
                                    onChange={(e) => handleProductSearch(e.target.value)}
                                    onFocus={() => productSearchResults.length > 0 && setShowSearchDropdown(true)}
                                    placeholder="Tìm kiếm sản phẩm theo tên..."
                                    className={styles.searchInput}
                                />
                                {isSearching && <Loader2 size={16} className={`${styles.searchLoader} animate-spin`} />}
                            </div>

                            {/* Search Results Dropdown */}
                            {showSearchDropdown && productSearchResults.length > 0 && (
                                <div className={styles.searchDropdown}>
                                    {productSearchResults.map((product) => (
                                        <div
                                            key={product.id}
                                            className={styles.searchResultItem}
                                            onClick={() => handleSelectProduct(product)}
                                        >
                                            <img
                                                src={product.images[0]?.imageUrl || '/placeholder.png'}
                                                alt={product.name}
                                                className={styles.productThumb}
                                            />
                                            <div className={styles.productInfo}>
                                                <span className={styles.productName}>{product.name}</span>
                                                <span className={styles.productId}>ID: {product.id}</span>
                                            </div>
                                            <Plus size={18} className={styles.addIcon} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Products Display */}
                        {selectedProducts.length > 0 && (
                            <div className={styles.selectedProductsList}>
                                {selectedProducts.map((product) => (
                                    <div key={product.id} className={styles.selectedProductCard}>
                                        <img
                                            src={product.images[0]?.imageUrl || '/placeholder.png'}
                                            alt={product.name}
                                            className={styles.selectedProductThumb}
                                        />
                                        <div className={styles.selectedProductInfo}>
                                            <span className={styles.selectedProductName}>{product.name}</span>
                                            <span className={styles.selectedProductId}>ID: {product.id}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProduct(product.id)}
                                            className={styles.removeProductBtn}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <small className={styles.hint}>Tìm kiếm và chọn các sản phẩm phù hợp với công thức này.</small>
                    </div>
                </div>
            </div>

            <div className={styles.formFooter}>
                <button type="submit" disabled={loading} className={styles.submitButton}>
                    {loading ? 'Đang xử lý...' : (
                        <><Save size={18} /> {isEditMode ? 'Cập nhật' : 'Tạo mới'}</>
                    )}
                </button>
            </div>
        </form>
    );
}