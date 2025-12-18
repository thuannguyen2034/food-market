// src/app/page.tsx
import Link from 'next/link';
import { ChevronRight, Zap, ChefHat, Soup, Leaf } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { HomePageData } from '@/app/type/Home';
import styles from './HomePage.module.css';
import { RecipeResponse } from '@/types/recipe';
import RecipeCarousel from '@/components/RecipeCarousel';
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
async function getFeaturedRecipes(role: string): Promise<RecipeResponse[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  try {
    // Gọi endpoint /featured mà ta đã viết ở Controller
    const res = await fetch(`${API_URL}/storefront/recipes/featured?role=${role}`, {
      next: { revalidate: 120 } // Cache lâu hơn chút (2 phút)
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error(`Error fetching recipes for ${role}`, error);
    return [];
  }
}
export default async function HomePage() {
  const [
    homeData,
    mainDishes,
    soupDishes,
    sideDishes
  ] = await Promise.all([
    getHomeData(),
    getFeaturedRecipes('DISH_MAIN'),
    getFeaturedRecipes('DISH_SOUP'),
    getFeaturedRecipes('DISH_SIDE')
  ]);

  if (!homeData) {
    return (
      <div className={styles.loadingContainer}>
        <p>Đang tải dữ liệu hoặc server gặp sự cố...</p>
      </div>
    );
  }

  const { flashSaleProducts, categorySections } = homeData;
  const renderRecipeSection = (title: string, icon: React.ReactNode, recipes: RecipeResponse[], color: string) => {
    if (!recipes || recipes.length === 0) return null;
    const role = recipes[0].tags.includes('DISH_MAIN') ? 'DISH_MAIN'
      : recipes[0].tags.includes('DISH_SOUP') ? 'DISH_SOUP' : 'DISH_SIDE';
    return (
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader} style={{ borderLeft: `4px solid ${color}` }}>
          <div className={styles.categoryTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon} {title}
          </div>
          <Link href={`/recipes?role=${role}`} className={styles.viewAllBtn}>
            Xem thêm <ChevronRight size={16} />
          </Link>
        </div>
        <RecipeCarousel recipes={recipes} />
      </div>
    );
  }
  return (
    <main className={styles.container}>
      <section className={styles.bannerSection}>
        <div className={styles.bannerGrid}>
          {/* Ảnh lớn bên trái */}
          <div className={styles.mainBannerWrapper}>
            <img
              src="/banner.png" // Thay ảnh của bạn vào đây
              alt="Khuyến mãi hot nhất"
              className={styles.mainBannerImg}
            />
          </div>
          {/* Cột 2 ảnh nhỏ bên phải */}
          <div className={styles.sideBannersCol}>
            <img
              src="/banner-sub-1.png" // Thay ảnh phụ 1
              alt="Rau củ tươi"
              className={styles.sideBannerImg}
            />
            <img
              src="/banner-sub-2.png" // Thay ảnh phụ 2
              alt="Thịt cá sạch"
              className={styles.sideBannerImg}
            />
          </div>
        </div>
      </section>

      {flashSaleProducts && flashSaleProducts.length > 0 && (
        <div className={styles.sectionContainer}>
          <div className={styles.flashSaleWrapper}>
            <div className={styles.sectionHeader} style={{ borderBottom: 'none', marginBottom: '8px' }}>
              {/* Bỏ border bottom trong khung flashsale cho liền mạch */}
              <div className={styles.flashSaleTitle}>
                <Zap className={styles.flashIcon} fill="#e72a2a" size={24} />
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
      {/* --- GIAN BẾP (RECIPES) --- */}
      <div className={styles.kitchenHeader}>
        <h2>🥗 Góc Yêu Bếp</h2>
        <p>Hôm nay ăn gì? Để BonMi gợi ý nhé!</p>
      </div>

      {renderRecipeSection('Món Mặn Hao Cơm', <ChefHat color="#e74c3c" />, mainDishes, '#e74c3c')}
      {renderRecipeSection('Canh Ngọt Mát Lành', <Soup color="#3498db" />, soupDishes, '#3498db')}
      {renderRecipeSection('Rau Xanh Thanh Mát', <Leaf color="#2ecc71" />, sideDishes, '#2ecc71')}

      <hr className={styles.divider} />
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
                <p style={{ color: '#999', padding: '20px', textAlign: 'center', gridColumn: '1/-1' }}>
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