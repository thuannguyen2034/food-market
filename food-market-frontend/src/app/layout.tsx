// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. Import AuthProvider
import { AuthProvider } from "@/context/AuthContext"; 
// (Next.js tự hiểu @/ là thư mục src/)
import Navbar from "@/components/Navbar";
const inter = Inter({ subsets: ["latin"] });
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Food Market",
  description: "E-commerce Food Market Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. Bọc {children} bằng <AuthProvider> */}
        <AuthProvider>
          <Navbar />
          <Toaster />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}