import Link from 'next/link';
import { ChevronRight, Zap, ChefHat, Soup, Leaf } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { HomePageData } from '@/app/type/Home';
import styles from './HomePage.module.css';
import { RecipeResponse } from '@/types/recipe';
import RecipeCarousel from '@/components/RecipeCarousel';
import FlashSaleTimer from './components/FlashSaleTimer';
async function getHomeData(): Promise<HomePageData | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  try {
    const res = await fetch(`${API_URL}/storefront/home`, {
      next: { revalidate: 60 }
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
    const res = await fetch(`${API_URL}/storefront/recipes/featured?role=${role}`, {
      next: { revalidate: 120 }
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
          <div className={styles.mainBannerWrapper}>
            <img
              src="https://res.cloudinary.com/dawfvgap0/image/upload/v1766648603/food_market/Banners/banner-main2_myvdsg.png" // Thay ảnh của bạn vào đây
              alt="Khuyến mãi hot nhất"
              className={styles.mainBannerImg}
            />
          </div>
          <div className={styles.sideBannersCol}>
            <img
              src="https://res.cloudinary.com/dawfvgap0/image/upload/v1766647721/food_market/Banners/banner-main_kwv0uu.png" // Thay ảnh phụ 1
              alt="Rau củ tươi"
              className={styles.sideBannerImg}
            />
            <img
              src="https://res.cloudinary.com/dawfvgap0/image/upload/v1766647720/food_market/Banners/banner-sub-2_evlup2.png" // Thay ảnh phụ 2
              alt="Giao hàng siêu tốc"
              className={styles.sideBannerImg}
            />
          </div>
        </div>
      </section>

      {flashSaleProducts && flashSaleProducts.length > 0 && (
        <div className={styles.sectionContainer}>
          <div className={styles.flashSaleWrapper}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerLeft}>
              <div className={styles.flashSaleTitle}>
                <Zap className={styles.flashIcon} fill="#e72a2a" size={24} />
                FLASH SALE
              </div>
              <FlashSaleTimer />
              </div>
              <Link href="/search?isOnSale=true" className={styles.viewAllBtn}>
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>

            <div className={styles.productGrid}>
              {flashSaleProducts.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} variant="flash" />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* --- GIAN BẾP (RECIPES) --- */}
      <section className={styles.kitchenZone}>
      <div className={styles.kitchenHeader}>
        <h2>Hôm nay ăn gì? Để BonMi gợi ý nhé!</h2>
        <p className={styles.subHeader}>Khám phá công thức & Mua trọn bộ nguyên liệu chỉ với 1 cú click</p>
      </div>
      {renderRecipeSection('Món Chính Mặn', <ChefHat color="#e74c3c" />, mainDishes, '#e74c3c')}
      {renderRecipeSection('Món Canh', <Soup color="#3498db" />, soupDishes, '#3498db')}
      {renderRecipeSection('Món Rau', <Leaf color="#2ecc71" />, sideDishes, '#2ecc71')}
      </section>
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
                    categorySlug={section.categorySlug}
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