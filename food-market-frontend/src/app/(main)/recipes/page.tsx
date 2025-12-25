'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import RecipeCard from '@/components/RecipeCard';
import { RecipeSearchRequest, RecipeResponse } from '@/types/recipe';
import { RECIPE_TAGS } from '@/constants/recipeTags';
import { useSearchParams } from 'next/navigation';
import styles from './RecipePage.module.css';

export default function RecipePage() {
    const searchParams = useSearchParams();
    const initialRole = searchParams.get('role') || 'DISH_MAIN';
    const [filter, setFilter] = useState<RecipeSearchRequest>({
        keyword: '',
        role: initialRole,
        isVegan: false,
        allergies: [],
        preferredFlavors: [],
        timeConstraint: '',
        page: 0,
        size: 12
    });

    const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/v1/storefront/recipes/suggest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(filter)
                });

                if (!res.ok) {
                    console.error('API error:', res.status, res.statusText);
                    setRecipes([]);
                    return;
                }

                const data = await res.json();
                setRecipes(data.content || []);
            } catch (error) {
                console.error('Fetch error:', error);
                setRecipes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, [filter]);

    const toggleFlavor = (flavor: string) => {
        setFilter(prev => {
            const current = prev.preferredFlavors || [];
            if (current.includes(flavor)) {
                return { ...prev, preferredFlavors: current.filter(f => f !== flavor) };
            }
            return { ...prev, preferredFlavors: [...current, flavor] };
        });
    };

    return (
        <div className={styles.container}>
            {/* Sidebar Filter */}
            <aside className={styles.sidebar}>
                {/* --- 1. THANH TÌM KIẾM --- */}
                <div className={styles.searchBox}>
                    <h3>Tìm kiếm</h3>
                    <form onSubmit={handleSearchSubmit} className={styles.searchInputWrapper}>
                        <input
                            type="text"
                            placeholder="Tên món (vd: Thịt kho)..."
                            value={filter.keyword || ''}
                            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
                        />
                        <button type="submit"><Search size={16} /></button>
                    </form>
                </div>

                <hr className={styles.sep} />
                {/* --- 2. BỘ LỌC ROLE --- */}
                <div className={styles.filterGroup}>
                    <label>Bạn muốn ăn món gì?</label>
                    <div className={styles.radioGroup}>
                        <label className={filter.role === 'DISH_MAIN' ? styles.activeRadio : ''}>
                            <input type="radio" name="role" value="DISH_MAIN"
                                checked={filter.role === 'DISH_MAIN'}
                                onChange={() => setFilter({ ...filter, role: 'DISH_MAIN' })}
                            /> Món Mặn
                        </label>
                        <label className={filter.role === 'DISH_SOUP' ? styles.activeRadio : ''}>
                            <input type="radio" name="role" value="DISH_SOUP"
                                checked={filter.role === 'DISH_SOUP'}
                                onChange={() => setFilter({ ...filter, role: 'DISH_SOUP' })}
                            /> Món Canh
                        </label>
                        <label className={filter.role === 'DISH_SIDE' ? styles.activeRadio : ''}>
                            <input type="radio" name="role" value="DISH_SIDE"
                                checked={filter.role === 'DISH_SIDE'}
                                onChange={() => setFilter({ ...filter, role: 'DISH_SIDE' })}
                            /> Rau / Ăn Kèm
                        </label>
                    </div>
                </div>

                {/* 2. Scoring Criteria (Flavor) */}
                <div className={styles.filterGroup}>
                    <label>Vị yêu thích (Cộng điểm):</label>
                    {['SPICY', 'SWEET', 'SOUR', 'SAVORY'].map(tag => (
                        <div key={tag} className={styles.checkboxItem}>
                            <input
                                type="checkbox"
                                checked={filter.preferredFlavors?.includes(tag)}
                                onChange={() => toggleFlavor(tag)}
                            />
                            <span>{(RECIPE_TAGS as any)[tag].label}</span>
                        </div>
                    ))}
                </div>

                {/* 3. Time Constraint */}
                <div className={styles.filterGroup}>
                    <label>Thời gian:</label>
                    <select
                        value={filter.timeConstraint || ''}
                        onChange={(e) => setFilter({ ...filter, timeConstraint: e.target.value })}
                    >
                        <option value="">Thong thả</option>
                        <option value="TIME_FAST">Nhanh gọn (30p)</option>
                    </select>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.header}>
                    <h2>Gợi ý thực đơn cho bạn</h2>
                    <p>Sắp xếp theo độ phù hợp nhất với sở thích của bạn</p>
                </div>

                {loading ? <p>Đang tìm món ngon...</p> : (
                    <div className={styles.grid}>
                        {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
                    </div>
                )}
            </main>
        </div>
    );
}