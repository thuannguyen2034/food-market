// src/app/page.tsx
"use client"; // Bắt buộc phải là Client Component vì có tương tác
import Link from "next/link";


export default function HomePage() {
  return (
    <>
    <Link href="/login">Đăng nhập</Link>
    </>
  );
}