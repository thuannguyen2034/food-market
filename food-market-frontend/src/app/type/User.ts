// src/app/type/User.ts
export interface UserResponseDTO {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  avatarUrl: string|null; 
}