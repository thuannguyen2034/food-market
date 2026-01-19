# BonMi Market - Hệ thống TMĐT Thực phẩm Thông minh

Chào mừng bạn đến với dự án **BonMi Market**, một hệ thống TMĐT hiện đại giúp kết nối người dùng với các sản phẩm thực phẩm tươi sống và công thức nấu ăn thông minh.

## 🏗 Cơ cấu dự án

Dự án này bao gồm hai phần chính:
- **Backend**: Nằm trong thư mục `/food-market`. Sử dụng Java Spring Boot.
- **Frontend**: Nằm trong thư mục `/food-market-frontend`. Sử dụng Next.js (React).

---

## 🛠 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt các công cụ sau:
- **Java JDK 21** trở lên.
- **Node.js** (Khuyên dùng v18 hoặc v20).
- **Maven** (để quản lý backend).
- **PostgreSQL** (Hệ quản trị cơ sở dữ liệu).

---

## 🚀 Hướng dẫn cài đặt

### 1. Cài đặt Backend (Spring Boot)

1.  Truy cập vào thư mục backend:
    ```bash
    cd food-market
    ```
2.  **Cấu hình Database**: Tạo một database trong PostgreSQL với tên `food_market`.
3.  **Cấu hình biến môi trường**:
    - Sao chép file `src/main/resources/application.example.properties` thành `src/main/resources/application.properties`.
    - Mở file `application.properties` và cập nhật các thông tin sau:
        - `spring.datasource.username`: Tên người dùng Postgres của bạn.
        - `spring.datasource.password`: Mật khẩu Postgres của bạn.
        - `jwt.secret-key`: Tạo một chuỗi ngẫu nhiên (có thể dùng base64).
        - Cấu hình Mail, Cloudinary, và Pusher để sử dụng đầy đủ tính năng.
4.  **Chạy ứng dụng**:
    ```bash
    mvn spring-boot:run
    ```
    Backend sẽ khởi chạy tại: `http://localhost:8080`

### 2. Cài đặt Frontend (Next.js)

1.  Truy cập vào thư mục frontend:
    ```bash
    cd food-market-frontend
    ```
2.  **Cấu hình biến môi trường**:
    - Tạo file `.env.local` nếu chưa có.
    - Đảm bảo có biến sau để kết nối với backend:
      ```env
      NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
      ```
3.  **Cài đặt dependencies**:
    ```bash
    npm install
    ```
4.  **Chạy ứng dụng ở chế độ phát triển**:
    ```bash
    npm run dev
    ```
    Frontend sẽ khởi chạy tại: `http://localhost:3000`

---

## Tính năng chính
- Mua sắm thực phẩm tươi sống theo danh mục.
- Gợi ý công thức nấu ăn kèm danh sách nguyên liệu mua ngay.
- Quản lý đơn hàng, kho hàng tự động, đảm bảo thời gian thực.
- Trang quản trị (Admin) quản lý sản phẩm, đơn hàng và kho bãi.
- Thông báo thời gian thực qua Pusher.

---

## Giấy phép
Dự án được thực hiện cho mục đích học tập và tốt nghiệp năm 2025 - Đại học Bách Khoa Hà Nội, trường CNTT & Truyền thông.
