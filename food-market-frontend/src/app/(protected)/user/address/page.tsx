// app/(protected)/user/address/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AddressModal from '@/components/Address/AddressModal';
import AddressCard from '@/components/Address/AddressCard';
import toast from 'react-hot-toast';

export interface UserAddress {
  id: number;
  recipientName: string;
  recipientPhone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  addressType: 'HOME' | 'OFFICE' | null;
  default: boolean;
}

export default function AddressPage() {
  const { authedFetch } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

  // Fetch danh sách địa chỉ
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true);
        const res = await authedFetch('/api/v1/users/addresses');
        const data = await res.json();
        setAddresses(data);
      } catch (error) {
        toast.error('Không thể tải danh sách địa chỉ');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAddresses();
  }, [authedFetch]);

  const handleAddNew = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: UserAddress) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleDelete = async (addressId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    try {
      await authedFetch(`/api/v1/users/addresses/${addressId}`, { method: 'DELETE' });
      setAddresses(prev => prev.filter(a => a.id !== addressId));
      toast.success('Xóa địa chỉ thành công');
    } catch (error) {
      toast.error('Xóa địa chỉ thất bại');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await authedFetch(`/api/v1/users/addresses/${addressId}/default`, {
        method: 'PUT',
      });
      setAddresses(prev =>
        prev.map(addr => ({ ...addr, default: addr.id === addressId }))
      );
      toast.success('Đặt làm địa chỉ mặc định thành công');
    } catch (error) {
      toast.error('Không thể đặt địa chỉ mặc định');
    }
  };

  const onModalSave = (savedAddress: UserAddress) => {
    if (selectedAddress) {
      // Cập nhật
      setAddresses(prev =>
        prev.map(addr => (addr.id === savedAddress.id ? savedAddress : addr))
      );
      toast.success('Cập nhật địa chỉ thành công');
    } else {
      // Thêm mới
      setAddresses(prev => [savedAddress, ...prev]);
      toast.success('Thêm địa chỉ mới thành công');
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Địa chỉ của tôi</h1>
        <button onClick={handleAddNew}>
          + Thêm địa chỉ mới
        </button>
      </div>

      <div>
        {isLoading && <p>Đang tải...</p>}
        {!isLoading && addresses.length === 0 && <p>Bạn chưa có địa chỉ nào.</p>}

        {addresses.map(address => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={() => handleEdit(address)}
            onDelete={() => handleDelete(address.id)}
            onSetDefault={() => handleSetDefault(address.id)}
          />
        ))}
      </div>

      {isModalOpen && (
        <AddressModal
          initialData={selectedAddress}
          onClose={() => setIsModalOpen(false)}
          onSave={onModalSave}
        />
      )}
    </div>
  );
}