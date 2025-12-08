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
import { UserResponseDTO } from '@/app/type/User';
// 1. ĐỊNH NGHĨA TYPES

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
    // Lấy token
    let token = accessToken || localStorage.getItem('accessToken');

    if (!token) {
      await logout();
      throw new Error('Not authenticated.');
    }

    // SANITIZE TOKEN: Safari rất ghét ký tự lạ hoặc xuống dòng trong Header
    token = token.trim();

    // CHUẨN HÓA HEADERS: Dùng class Headers để an toàn hơn việc spread object
    const headers = new Headers(options.headers);
    
    // Chỉ set nếu chưa có (để tránh ghi đè nếu options đã truyền vào)
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Tạo config mới
    const defaultOptions = {
      ...options,
      headers: headers,
    };

    // 1. Thử gọi API
    let response = await fetch(url, defaultOptions);

    // 2. Xử lý Refresh Token (401)
    if (response.status === 401) {
      const newAccessToken = await handleRefreshToken();

      if (newAccessToken) {
        // Refresh thành công -> Cập nhật header và gọi lại
        // Lưu ý: newAccessToken cũng cần trim() cho chắc
        headers.set('Authorization', `Bearer ${newAccessToken.trim()}`);
        
        const newOptions = {
          ...defaultOptions,
          headers: headers,
        };
        response = await fetch(url, newOptions);
      } else {
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
      await logout();
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
        } catch (error) {
          console.error('Auto-login failed:', error);
        }
      }
      
      setIsLoading(false); // Hoàn tất kiểm tra
    };

    checkUserLoggedIn();
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