// components/Address/AddressCard.tsx
import { UserAddress } from '@/app/(protected)/user/address/page';

interface AddressCardProps {
  address: UserAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const fullAddress = `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.province}`;

  return (
    <div style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong>{address.recipientName}</strong> | {address.recipientPhone}
          {address.default && <span style={{ marginLeft: '8px', color: '#d32f2f' }}>(Mặc định)</span>}
          <p style={{ margin: '4px 0' }}>{fullAddress}</p>
          {address.addressType && <span>{address.addressType === 'HOME' ? 'Nhà riêng' : 'Công ty'}</span>}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button onClick={onEdit}>Sửa</button>
          {!address.default && <button onClick={onSetDefault}>Đặt làm mặc định</button>}
          <button onClick={onDelete} style={{ color: 'red' }}>Xóa</button>
        </div>
      </div>
    </div>
  );
}