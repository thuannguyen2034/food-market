import Pusher from 'pusher-js';

// Kiểm tra để tránh lỗi khi build server-side
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  console.error('Thiếu cấu hình Pusher trong .env.local');
}

// Tạo instance Pusher
// Lưu ý: Sau này khi làm Chat Private, ta sẽ thêm phần auth (xác thực) vào đây
export const pusherClient = new Pusher(pusherKey!, {
  cluster: pusherCluster!,
  // Sau này khi làm chat private (cần bảo mật), ta sẽ thêm config auth ở đây:
  // authEndpoint: 'http://localhost:8080/api/v1/auth/pusher',
  // auth: {
  //   headers: {
  //     Authorization: `Bearer ${token}` 
  //   }
  // }
});