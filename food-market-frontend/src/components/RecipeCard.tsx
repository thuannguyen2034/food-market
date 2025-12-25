'use client';

import Link from 'next/link';
import styles from './RecipeCard.module.css';
import { RECIPE_TAGS, getTagLabel } from '@/constants/recipeTags';
import { RecipeResponse } from '@/types/recipe';
import { ShoppingBasket } from 'lucide-react';

interface RecipeCardProps {
    recipe: RecipeResponse;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
    // Parse tags string ra array
    const tags = recipe.tags ? recipe.tags.split(',').map((t: string) => t.trim()) : [];
    
    // Tìm tag Role & Time để hiển thị nổi bật
    const roleTag = tags.find((t: string) => ['DISH_MAIN', 'DISH_SOUP', 'DISH_SIDE'].includes(t));
    const timeTag = tags.find((t: string) => ['TIME_FAST', 'TIME_MEDIUM', 'TIME_SLOW'].includes(t));

    return (
        <Link href={`/recipes/${recipe.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img src={recipe.imageUrl || '/placeholder-recipe.jpg'} alt={recipe.name} />
                {/* Badge Role */}
                {roleTag && (
                    <span className={styles.badge} style={{ 
                        backgroundColor: (RECIPE_TAGS as any)[roleTag]?.color || '#333' 
                    }}>
                        {getTagLabel(roleTag)}
                    </span>
                )}
                <div className={styles.quickAction}>
                   <ShoppingBasket size={18} /> Mua nguyên liệu
                </div>
            </div>
            
            <div className={styles.content}>
                <h3 className={styles.title}>{recipe.name}</h3>
                <div className={styles.meta}>
                    {timeTag && (
                        <span className={styles.timeInfo}>
                            {(RECIPE_TAGS as any)[timeTag]?.icon} {getTagLabel(timeTag)}
                        </span>
                    )}
                </div>
                <div className={styles.footerAction}>
                    <div className={styles.shopBtn}>
                        <ShoppingBasket size={16} /> 
                        <span>Có sẵn nguyên liệu</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}