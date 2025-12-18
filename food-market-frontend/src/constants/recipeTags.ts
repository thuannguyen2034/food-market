export const RECIPE_TAGS = {
    // 1. Roles
    DISH_MAIN: { label: 'Món Mặn', color: '#e74c3c' }, // Đỏ
    DISH_SOUP: { label: 'Món Canh', color: '#3498db' }, // Xanh dương
    DISH_SIDE: { label: 'Món Rau/Kèm', color: '#2ecc71' }, // Xanh lá

    // 2. Time
    TIME_FAST: { label: 'Nấu Nhanh (<30p)', icon: '⚡' },
    TIME_MEDIUM: { label: 'Trung Bình (30-60p)', icon: '🕘' },
    TIME_SLOW: { label: 'Ninh/Hầm (>60p)', icon: '🔥' },

    // 3. Flavors
    SPICY: { label: 'Cay nồng', value: 'SPICY' },
    SWEET: { label: 'Ngọt', value: 'SWEET' },
    SOUR: { label: 'Chua', value: 'SOUR' },
    SAVORY: { label: 'Đậm đà', value: 'SAVORY' },
    BITTER: { label: 'Đắng', value: 'BITTER' },

    // 4. Nutrition/Diet
    HIGH_PROTEIN: { label: 'Giàu Đạm', value: 'HIGH_PROTEIN' },
    LOW_CARB: { label: 'Low Carb', value: 'LOW_CARB' },
    VEGAN: { label: 'Thuần Chay', value: 'VEGAN' },
    VEGETARIAN: { label: 'Ăn Chay', value: 'VEGETARIAN' },
    SEAFOOD: { label: 'Hải sản', value: 'SEAFOOD' },
    NUT: { label: 'Có hạt', value: 'NUT' },
};

// Helper để lấy text hiển thị
export const getTagLabel = (tagKey: string) => {
    // @ts-ignore
    return RECIPE_TAGS[tagKey]?.label || tagKey;
};