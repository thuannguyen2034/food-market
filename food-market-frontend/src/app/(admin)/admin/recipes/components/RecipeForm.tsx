'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Upload, X, Loader2, Sparkles, Save, ArrowLeft, Search, Plus, Trash2, GripVertical, Edit
} from 'lucide-react';
import styles from './RecipeForm.module.css';

// Type Definitions
interface RecipeFormProps {
    initialData?: {
        id?: number; name: string; cookingSteps: string; ingredients: string;
        tags: string; productIds: number[]; imageUrl?: string;
    };
    isEditMode?: boolean;
}
interface ProductSearchResult {
    id: number; name: string; images: { imageUrl: string; displayOrder: number }[];
}

export default function RecipeForm({ initialData, isEditMode = false }: RecipeFormProps) {
    const router = useRouter();
    const { authedFetch } = useAuth();

    const [name, setName] = useState(initialData?.name || '');

    const [ingredientsList, setIngredientsList] = useState<string[]>(
        initialData?.ingredients ? initialData.ingredients.split('|').filter(s => s.trim()) : ['']
    );

    const [stepsList, setStepsList] = useState<string[]>(
        initialData?.cookingSteps ? initialData.cookingSteps.split('|').filter(s => s.trim()) : ['']
    );

    const [tags, setTags] = useState(initialData?.tags || '');

    const [selectedProducts, setSelectedProducts] = useState<ProductSearchResult[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 10;
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        if (initialData?.productIds?.length) {
            Promise.all(initialData.productIds.map(id =>
                authedFetch(`/api/v1/admin/products/${id}`).then(r => r.json())
            )).then(setSelectedProducts).catch(console.error);
        }
    }, [initialData, authedFetch]);

    const fetchProducts = async (currentPage: number, keyword: string, isNewSearch: boolean) => {
        if (!keyword.trim()) return;

        setIsSearching(true);
        try {
            const res = await authedFetch(
                `/api/v1/admin/products?searchTerm=${encodeURIComponent(keyword)}&page=${currentPage}&size=${PAGE_SIZE}`
            );

            if (res.ok) {
                const data = await res.json();
                const newProducts = data.content || [];

                if (isNewSearch) {
                    setSearchResults(newProducts);
                } else {
                    setSearchResults(prev => [...prev, ...newProducts]);
                }

                setHasMore(!data.last);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setPage(0);
            setHasMore(false);
            return;
        }

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            setPage(0);
            setHasMore(true);
            fetchProducts(0, searchTerm, true);
        }, 400);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchTerm]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        if (scrollHeight - scrollTop <= clientHeight + 10 && !isSearching && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchProducts(nextPage, searchTerm, false);
        }
    };

    const updateIngredient = (idx: number, val: string) => {
        const newList = [...ingredientsList];
        newList[idx] = val;
        setIngredientsList(newList);
    };
    const addIngredientRow = () => setIngredientsList([...ingredientsList, '']);
    const removeIngredientRow = (idx: number) => setIngredientsList(ingredientsList.filter((_, i) => i !== idx));

    const updateStep = (idx: number, val: string) => {
        const newList = [...stepsList];
        newList[idx] = val;
        setStepsList(newList);
    };
    const addStepRow = () => setStepsList([...stepsList, '']);
    const removeStepRow = (idx: number) => setStepsList(stepsList.filter((_, i) => i !== idx));

    const handleAnalyzeAI = async () => {
        if (!name || ingredientsList.filter(i => i.trim()).length === 0) return alert("Cần nhập tên và nguyên liệu trước.");
        setAiLoading(true);
        try {
            const res = await authedFetch('/api/v1/admin/recipes/analyze-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, ingredients: ingredientsList.join('|') }),
            });
            if (res.ok) {
                const data = await res.json();
                setTags(prev => prev ? `${prev}, ${data.tags.join(', ')}` : data.tags.join(', '));
            }
        } catch (e) { console.error(e); alert('Lỗi AI'); }
        finally { setAiLoading(false); }
    };

    // --- Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const cleanIngredients = ingredientsList.map(s => s.trim()).filter(s => s);
        const cleanSteps = stepsList.map(s => s.trim()).filter(s => s);

        if (cleanSteps.length === 0) {
            alert('Vui lòng nhập ít nhất 1 bước thực hiện.');
            setLoading(false);
            return;
        }

        const recipeDTO = {
            name,
            ingredients: cleanIngredients.join('|'),
            cookingSteps: cleanSteps.join('|'),
            tags: tags.trim(),
            productIds: selectedProducts.map(p => p.id)
        };

        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(recipeDTO)], { type: 'application/json' }));
        if (imageFile) formData.append('image', imageFile);

        try {
            const url = isEditMode ? `/api/v1/admin/recipes/${initialData?.id}` : '/api/v1/admin/recipes';
            const method = isEditMode ? 'PUT' : 'POST';
            const res = await authedFetch(url, { method, body: formData });

            if (res.ok) {
                alert(isEditMode ? 'Cập nhật thành công' : 'Tạo mới thành công');
                router.refresh();
            } else {
                const err = await res.json();
                alert('Lỗi: ' + err.message);
            }
        } catch (e) { console.error(e); alert('Lỗi kết nối'); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>
                    {isEditMode ? <Edit size={20} /> : <Plus size={20} />}
                    {isEditMode ? ' Sửa công thức' : ' Thêm công thức mới'}
                </h2>
                <button type="button" onClick={() => router.back()} className={styles.btnBack}>
                    <ArrowLeft size={16} /> Quay lại
                </button>
            </div>

            <div className={styles.formBody}>
                <div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>Thông tin chung</div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tên món ăn <span style={{ color: 'red' }}>*</span></label>
                            <input className={styles.input} required value={name} onChange={e => setName(e.target.value)} placeholder="VD: Phở bò..." />
                        </div>

                        <div className={styles.formGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className={styles.label}>Tags (Gợi ý phân loại)</label>
                                <button type="button" onClick={handleAnalyzeAI} disabled={aiLoading} className={styles.btnAi}>
                                    {aiLoading ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />} AI Gợi ý
                                </button>
                            </div>
                            <input className={styles.input} value={tags} onChange={e => setTags(e.target.value)} placeholder="VD: HEALTHY, BREAKFAST..." />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>Nguyên liệu</div>
                        <div className={styles.dynamicList}>
                            {ingredientsList.map((ing, idx) => (
                                <div key={idx} className={styles.dynamicRow}>
                                    <div style={{ color: '#9ca3af', display: 'flex', justifyContent: 'center' }}><GripVertical size={16} /></div>
                                    <input
                                        className={styles.input}
                                        value={ing}
                                        onChange={e => updateIngredient(idx, e.target.value)}
                                        placeholder={`Nguyên liệu ${idx + 1}`}
                                    />
                                    {ingredientsList.length > 1 && (
                                        <button type="button" onClick={() => removeIngredientRow(idx)} className={styles.btnRemove}>
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addIngredientRow} className={styles.btnAddRow}><Plus size={14} /> Thêm nguyên liệu</button>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>Các bước thực hiện</div>
                        <div className={styles.dynamicList}>
                            {stepsList.map((step, idx) => (
                                <div key={idx} className={styles.dynamicRow}>
                                    <div className={styles.stepIndex}>{idx + 1}</div>
                                    <textarea
                                        className={styles.input}
                                        rows={2}
                                        value={step}
                                        onChange={e => updateStep(idx, e.target.value)}
                                        placeholder={`Mô tả bước ${idx + 1}...`}
                                        style={{ resize: 'vertical' }}
                                    />
                                    {stepsList.length > 1 && (
                                        <button type="button" onClick={() => removeStepRow(idx)} className={styles.btnRemove}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addStepRow} className={styles.btnAddRow}><Plus size={14} /> Thêm bước mới</button>
                    </div>
                </div>

                <div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>Hình ảnh</div>
                        <label className={styles.uploadBox}>
                            {previewUrl ? <img src={previewUrl} alt="Preview" /> : (
                                <div style={{ textAlign: 'center' }}>
                                    <Upload size={24} color="#9ca3af" />
                                    <div className={styles.uploadLabel}>Tải ảnh món ăn</div>
                                </div>
                            )}
                            <input type="file" hidden accept="image/*" onChange={e => {
                                if (e.target.files?.[0]) {
                                    setImageFile(e.target.files[0]);
                                    setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                }
                            }} />
                            {previewUrl && (
                                <button type="button" onClick={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    setImageFile(null); setPreviewUrl(null);
                                }} className={styles.btnRemoveImg}>Xóa ảnh</button>
                            )}
                        </label>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>Sản phẩm liên quan</div>

                        <div className={styles.searchWrapper}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px', background: 'white' }}>
                                <Search size={14} color="#9ca3af" />
                                <input
                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', marginLeft: 6 }}
                                    placeholder="Tìm sản phẩm (cuộn để xem thêm)..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {isSearching && <Loader2 className="animate-spin" size={14} color="#e72a2a" />}
                            </div>

                            {searchResults.length > 0 && (
                                <div
                                    className={styles.searchDropdown}
                                    onScroll={handleScroll}
                                >
                                    {searchResults.map(p => {
                                        const isSelected = selectedProducts.some(x => x.id === p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                className={styles.searchResult}
                                                style={{ opacity: isSelected ? 0.5 : 1, cursor: isSelected ? 'default' : 'pointer' }}
                                                onClick={() => {
                                                    if (!isSelected) {
                                                        setSelectedProducts([...selectedProducts, p]);
                                                    }
                                                }}
                                            >
                                                <img src={p.images?.[0]?.imageUrl || '/placeholder.png'} className={styles.searchThumb} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {p.id}</div>
                                                </div>
                                                {isSelected && <span style={{ fontSize: '0.7rem', color: 'green', fontWeight: 'bold' }}>Đã chọn</span>}
                                            </div>
                                        );
                                    })}

                                    {isSearching && page > 0 && (
                                        <div style={{ padding: '8px', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>
                                            <Loader2 className="animate-spin" size={14} style={{ display: 'inline', marginRight: 4 }} /> Đang tải thêm...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.selectedList}>
                            {selectedProducts.map(p => (
                                <div key={p.id} className={styles.selectedItem}>
                                    <div className={styles.selectedInfo}>
                                        <img src={p.images?.[0]?.imageUrl || '/placeholder.png'} className={styles.searchThumb} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{p.name}</span>
                                            <small style={{ color: '#9ca3af' }}>ID: {p.id}</small>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setSelectedProducts(selectedProducts.filter(x => x.id !== p.id))} className={styles.btnRemove}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {selectedProducts.length === 0 && <div style={{ textAlign: 'center', padding: 10, color: '#9ca3af', fontSize: '0.85rem' }}>Chưa chọn sản phẩm nào</div>}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <button type="button" onClick={() => router.back()} className={styles.btnBack} style={{ border: 'none' }}>Hủy bỏ</button>
                <button type="submit" disabled={loading} className={styles.btnPrimary}>
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {isEditMode ? 'Lưu thay đổi' : 'Tạo công thức'}
                </button>
            </div>
        </form>
    );
}