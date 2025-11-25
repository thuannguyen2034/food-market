// TypeScript types matching backend DTOs

export enum Role {
    CUSTOMER = 'CUSTOMER',
    ADMIN = 'ADMIN',
}

export type UserResponseDTO = {
    userId: string; // UUID
    fullName: string;
    email: string;
    phone: string;
    role: Role;
    createdAt: string; // OffsetDateTime from backend
    avatarUrl?: string;
};

export type UpdateRoleRequestDTO = {
    role: Role;
};

export type UserAddressResponseDTO = {
    id: number;
    recipientName: string;
    recipientPhone: string;
    province: string;
    district: string;
    ward: string;
    streetAddress: string;
    addressType: string;
    isDefault: boolean;
};

export type PageResponse<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // 0-based page index
    size: number;
    first: boolean;
    last: boolean;
};

export type UserStats = {
    totalUsers: number;
    totalCustomers: number;
    totalAdmins: number;
    newUsersThisMonth: number;
};
