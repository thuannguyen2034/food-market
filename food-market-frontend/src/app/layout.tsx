// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; 
import { CartProvider } from "@/context/CartContext";
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
        <AuthProvider>
          <CartProvider>
          <Navbar />
          <Toaster />
          {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}