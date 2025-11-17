// components/Address/AddressModal.tsx (phiên bản mới)
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import AddressPickerWithMap from './AddressPickerWithMap';
import { UserAddress } from '@/app/(protected)/user/address/page';

interface AddressModalProps {
  initialData: UserAddress | null;
  onClose: () => void;
  onSave: (address: UserAddress) => void;
}

export default function AddressModal({ initialData, onClose, onSave }: AddressModalProps) {
  const { authedFetch } = useAuth();
  const isEdit = !!initialData;

  const [formData, setFormData] = useState<Partial<UserAddress>>(
    initialData || {
      recipientName: '',
      recipientPhone: '',
      province: '',
      district: '',
      ward: '',
      streetAddress: '',
      addressType: null,
      default: false,
    }
  );

  const handleMapAddressChange = ({ province, district, ward, streetAddress }: any) => {
    setFormData(prev => ({
      ...prev,
      province: province || prev.province || '',
      district: district || prev.district || '',
      ward: ward || prev.ward || '',
      streetAddress: streetAddress || prev.streetAddress || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.province || !formData.district || !formData.ward || !formData.streetAddress) {
      toast.error('Vui lòng chọn đầy đủ địa chỉ từ bản đồ hoặc nhập tay');
      return;
    }

    try {
      const url = isEdit ? `/api/v1/users/addresses/${initialData?.id}` : '/api/v1/users/addresses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authedFetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error();

      const saved = await res.json();
      onSave(saved);
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm địa chỉ thành công!');
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>{isEdit ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input
              placeholder="Họ và tên"
              value={formData.recipientName || ''}
              onChange={e => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
              required
            />
            <input
              placeholder="Số điện thoại"
              value={formData.recipientPhone || ''}
              onChange={e => setFormData(prev => ({ ...prev, recipientPhone: e.target.value }))}
              required
            />
          </div>

          <div style={{ margin: '1rem 0' }}>
            <AddressPickerWithMap
              onAddressChange={handleMapAddressChange}
              initialAddress={initialData ? `${initialData.streetAddress}, ${initialData.ward}, ${initialData.district}, ${initialData.province}` : ''}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', margin: '1rem 0' }}>
            <input placeholder="Tỉnh/Thành phố" value={formData.province || ''} readOnly />
            <input placeholder="Quận/Huyện" value={formData.district || ''} readOnly />
            <input placeholder="Phường/Xã" value={formData.ward || ''} readOnly />
          </div>

          <input
            placeholder="Số nhà, tên đường..."
            value={formData.streetAddress || ''}
            onChange={e => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
            style={{ marginBottom: '1rem' }}
          />

          <div style={{ margin: '1rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="radio"
                name="type"
                checked={formData.addressType === 'HOME'}
                onChange={() => setFormData(prev => ({ ...prev, addressType: 'HOME' }))}
              />
              <span>Nhà riêng</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="radio"
                name="type"
                checked={formData.addressType === 'OFFICE'}
                onChange={() => setFormData(prev => ({ ...prev, addressType: 'OFFICE' }))}
              />
              <span>Văn phòng</span>
            </label>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formData.default || false}
              onChange={e => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
            />
            Đặt làm địa chỉ mặc định
          </label>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px' }}>
              Trở lại
            </button>
            <button type="submit" style={{ background: '#ee4d2d', color: 'white', padding: '10px 30px', borderRadius: '4px' }}>
              Hoàn thành
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}