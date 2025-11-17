// components/Address/AddressPickerWithMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface AddressComponent {
  province?: string;
  district?: string;
  ward?: string;
  streetAddress?: string;
}

interface AddressPickerProps {
  onAddressChange: (data: AddressComponent) => void;
  initialAddress?: string;
}

export default function AddressPickerWithMap({ onAddressChange, initialAddress = '' }: AddressPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mapPreview, setMapPreview] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
      componentRestrictions: { country: 'vn' },
      fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setSelectedPlace(place);
      setMapPreview(
        `https://maps.googleapis.com/maps/api/staticmap?center=${place.geometry.location.lat()},${place.geometry.location.lng()}&zoom=17&size=600x300&markers=color:red%7C${place.geometry.location.lat()},${place.geometry.location.lng()}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );

      // Phân tích địa chỉ thành tỉnh, quận, phường
      const components = place.address_components;
      let province = '', district = '', ward = '', street = '';

      components.forEach((comp: any) => {
        const types = comp.types;
        if (types.includes('administrative_area_level_1')) province = comp.long_name;
        if (types.includes('administrative_area_level_2')) district = comp.long_name;
        if (types.includes('administrative_area_level_3') || types.includes('sublocality')) ward = comp.long_name;
        if (types.includes('route')) street = comp.long_name;
        if (types.includes('street_number')) street = comp.long_name + ' ' + street;
      });

      const addressDetail = inputRef.current?.value?.split(',').slice(0, -3).join(',') || street;

      onAddressChange({
        province: province.replace('Tỉnh ', '').replace('Thành phố ', ''),
        district: district.replace('Quận ', '').replace('Huyện ', '').replace('Thị xã ', ''),
        ward: ward.replace('Phường ', '').replace('Xã ', '').replace('Thị trấn ', ''),
        streetAddress: addressDetail.trim(),
      });
    });
  }, []);

  return (
    <div style={{ margin: '1rem 0' }}>
      <label>Địa chỉ cụ thể (Nhập và chọn gợi ý từ Google)</label>
      <input
        ref={inputRef}
        type="text"
        placeholder="Ví dụ: 123 Trần Phú, Hà Đông, Hà Nội"
        defaultValue={initialAddress}
        style={{ width: '100%', padding: '12px', fontSize: '16px', marginTop: '8px' }}
      />

      {mapPreview && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <img
            src={mapPreview}
            alt="Preview bản đồ"
            style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            Vị trí đã chọn trên bản đồ
          </p>
        </div>
      )}
    </div>
  );
}