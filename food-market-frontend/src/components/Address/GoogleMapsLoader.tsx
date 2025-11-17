// components/Address/GoogleMapsLoader.tsx
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleMapsLoader() {
  useEffect(() => {
    if (window.google) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=vi&region=VN`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}