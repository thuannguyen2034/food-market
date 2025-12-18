'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RecipeResponse } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard';
import styles from './RecipeCarousel.module.css';

interface RecipeCarouselProps {
    recipes: RecipeResponse[];
}

export default function RecipeCarousel({ recipes }: RecipeCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Hàm xử lý cuộn
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            // Tính toán khoảng cách cuộn: Chiều rộng thẻ (280) + Gap (16) = ~300
            // Cuộn 1 lần khoảng 2-3 thẻ cho nhanh
            const scrollAmount = direction === 'left' ? -300 : 300; 
            
            current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!recipes || recipes.length === 0) return null;

    return (
        <div className={styles.wrapper}>
            {/* Nút lùi */}
            <button 
                className={`${styles.navBtn} ${styles.prevBtn}`} 
                onClick={() => scroll('left')}
                aria-label="Previous"
            >
                <ChevronLeft size={24} />
            </button>

            {/* Vùng chứa danh sách */}
            <div className={styles.scrollContainer} ref={scrollRef}>
                {recipes.map((recipe) => (
                    <div key={recipe.id} className={styles.item}>
                        <RecipeCard recipe={recipe} />
                    </div>
                ))}
            </div>

            {/* Nút tiến */}
            <button 
                className={`${styles.navBtn} ${styles.nextBtn}`} 
                onClick={() => scroll('right')}
                aria-label="Next"
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
}