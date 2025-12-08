// src/app/page.tsx
import Link from 'next/link';
import { ChevronRight, Zap } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { HomePageData } from '@/app/type/Home'; // Import type vừa tạo
import styles from './HomePage.module.css';

// Hàm gọi API (Server Side)
async function getHomeData(): Promise<HomePageData | null> {
  // Thay URL này bằng biến môi trường trong thực tế
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'; 
  
  try {
    const res = await fetch(`${API_URL}/storefront/home`, { 
      next: { revalidate: 60 } // Cache 60s (ISR)
    });

    if (!res.ok) {
      console.error('Failed to fetch home data:', res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching home data:', error);
    return null;
  }
}

export default async function HomePage() {
  const data = await getHomeData();

  if (!data) {
    return (
      <div className={styles.loadingContainer}>
        <p>Đang tải dữ liệu hoặc server gặp sự cố...</p>
      </div>
    );
  }

  const { flashSaleProducts, categorySections } = data;

  return (
    <main className={styles.container}>
      <section className={styles.bannerSection}>
        <div className={styles.bannerContainer}>
          <img 
            src="/banner.png" 
            alt="BonMi Market - Thực phẩm tươi sạch" 
            className={styles.bannerImage}
          />
        </div>
      </section>

      {flashSaleProducts && flashSaleProducts.length > 0 && (
        <div className={styles.sectionContainer}>
          <div className={styles.flashSaleWrapper}>
            <div className={styles.sectionHeader}>
              <div className={styles.flashSaleTitle}>
                <Zap className={styles.flashIcon} fill="#e72a2a" />
                FLASH SALE
              </div>
              <Link href="/search?isOnSale=true" className={styles.viewAllBtn}>
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className={styles.productGrid}>
              {flashSaleProducts.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gian hàng */}
      <div className={styles.sectionContainer}>
        {categorySections.map((section) => (
          <div key={section.categoryId} className={styles.categorySection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.categoryTitle}>{section.categoryName}</h2>
              <Link href={`/${section.categorySlug}`} className={styles.viewAllBtn}>
                Xem thêm <ChevronRight size={16} />
              </Link>
            </div>

            <div className={styles.productGrid}>
              {section.products.length > 0 ? (
                section.products.slice(0, 10).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    categorySlug={section.categorySlug} // Truyền slug root để link đúng
                  />
                ))
              ) : (
                <p style={{color: '#999', padding: '20px', textAlign: 'center', gridColumn: '1/-1'}}>
                  Đang cập nhật sản phẩm...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

    </main>
  );
}