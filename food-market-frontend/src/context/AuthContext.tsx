// src/context/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { UserResponseDTO } from '@/app/type/User'; // <-- IMPORT USER DTO
// 1. ĐỊNH NGHĨA TYPES

// DTO mới mà backend trả về (chỉ accessToken)
interface AccessTokenResponseDTO {
  token: string;
}

// Chữ ký (signature) của Context
interface AuthContextType {
  user: UserResponseDTO | null;
  setUser: React.Dispatch<React.SetStateAction<UserResponseDTO | null>>;
  isLoading: boolean;
  // Hàm login giờ nhận accessToken
  login: (token: string) => Promise<void>; 
  logout: () => void;
  // authedFetch vẫn là hàm gọi API chính
  authedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  fetchUserProfile: () => Promise<void>;
}

const API_BASE_URL = '/api/v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  // State cho accessToken, đồng bộ với localStorage
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 2. HÀM LOGOUT (Cập nhật)
  // Sẽ được gọi bởi `handleRefreshToken` nếu thất bại
  const logout = async () => {
    // Xóa state
    setUser(null);
    setAccessToken(null);
    // Xóa localStorage
    localStorage.removeItem('accessToken');
    
    try {
      // Gọi API để backend xóa HttpOnly cookie
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch (error) {
      console.error('Logout API call failed, proceeding.', error);
    }
  };
  const refreshingPromise = useRef<Promise<string | null> | null>(null);

  // 3. HÀM REFRESH TOKEN (Cập nhật)
  // Hàm này là cốt lõi của Mô hình Hybrid
  const handleRefreshToken = async (): Promise<string | null> => {
    if (refreshingPromise.current) {
    return refreshingPromise.current; // ← đang có thằng khác refresh → chờ nó!
  }
    console.log('Attempting token refresh...');
    refreshingPromise.current = (async () => {
    try {
      // KHÔNG cần body, trình duyệt tự gửi HttpOnly cookie
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Refresh token is invalid or expired');
      }

      // Backend trả về AccessTokenResponseDTO (chỉ chứa token)
      const data: AccessTokenResponseDTO = await response.json();
      const newAccessToken = data.token;

      // LƯU LẠI TOKEN MỚI
      setAccessToken(newAccessToken);
      localStorage.setItem('accessToken', newAccessToken);

      console.log('Token refreshed successfully.');
      return newAccessToken;

    } catch (error) {
      console.error('Refresh failed, logging out.', error);
      // Nếu refresh thất bại (ví dụ: refreshToken hết hạn) -> Logout
      await logout();
      return null;
    }finally {
      refreshingPromise.current = null;
    }
  })();
  return refreshingPromise.current;}

  // 4. HÀM AUTHED-FETCH (Cập nhật)
  // Hàm "fetch" đã được bọc, tự động set header và refresh
  const authedFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    
    // Lấy token từ state (hoặc localStorage nếu state chưa kịp cập nhật)
    const token = accessToken || localStorage.getItem('accessToken');

    // Nếu không có token -> logout
    if (!token) {
      await logout();
      throw new Error('Not authenticated.');
    }

    // Gắn header Authorization
    const defaultOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    };

    // 1. Thử gọi API
    let response = await fetch(url, defaultOptions);
    console.log(`authedFetch to ${url} returned status ${response.status}`);
    // 2. Nếu thất bại (401), thử làm mới token
    if (response.status === 401) {
      console.log('Access token expired. Retrying with refresh...');
      const newAccessToken = await handleRefreshToken();

      if (newAccessToken) {
        // 3. Nếu làm mới thành công, TỰ ĐỘNG gọi lại API
        const newOptions = {
          ...defaultOptions,
          headers: {
            ...defaultOptions.headers,
            'Authorization': `Bearer ${newAccessToken}`,
          },
        };
        response = await fetch(url, newOptions);
        console.log(`Retried authedFetch to ${url} returned status ${response.status}`);
      } else {
        // Nếu làm mới thất bại (logout() đã được gọi)
        throw new Error('Session expired.');
      }
    }

    return response;
  };

  // 5. HÀM LOGIN (Cập nhật)
  // Nhận accessToken từ trang Login/Register
  const login = async (token: string) => {
    setIsLoading(true);
    // 1. Lưu token mới
    setAccessToken(token);
    localStorage.setItem('accessToken', token);
      setIsLoading(false);
  };
  // Hàm lấy thông tin user
  const fetchUserProfile = async () => {
    setIsLoading(true);
    try{
      const response = await authedFetch(`${API_BASE_URL}/users/me`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user', error);
      await logout(); // Nếu token đúng nhưng /me lỗi -> logout
    } finally {
      setIsLoading(false);
    }
    }

  // 6. HÀM CHẠY KHI KHỞI ĐỘNG (Cập nhật)
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      // Lấy token từ localStorage
      const tokenInStorage = localStorage.getItem('accessToken');

      if (tokenInStorage) {
        // Nếu có token, chúng ta không biết nó còn hạn hay không.
        // Cứ thử gọi API /me bằng authedFetch.
        // authedFetch sẽ tự động refresh nếu token hết hạn.
        try {
          // Dùng authedFetch, nó sẽ tự xử lý 401
          const response = await authedFetch(`${API_BASE_URL}/users/me`);
          if (!response.ok) {
            // Nếu authedFetch thất bại (và refresh cũng thất bại)
            throw new Error('Failed to auto-login');
          }
          const userData = await response.json();
          setUser(userData);
          // (Không cần setAccessToken, vì authedFetch đã làm)
        } catch (error) {
          console.error('Auto-login failed:', error);
          // authedFetch hoặc handleRefreshToken đã gọi logout()
        }
      }
      
      setIsLoading(false); // Hoàn tất kiểm tra
    };

    checkUserLoggedIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần

  // 7. CUNG CẤP VALUE CHO CONTEXT
  const value = {
    user,
    setUser,
    isLoading,
    login,
    logout,
    authedFetch,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 8. CUSTOM HOOK (Không thay đổi)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};