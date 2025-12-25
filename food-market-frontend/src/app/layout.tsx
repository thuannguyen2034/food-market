// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; 
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from 'react-hot-toast';
import CustomerChat from "@/components/Chat/CustomerChat";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "BonMi - Chợ thực phẩm tươi ngon"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
          <NotificationProvider>
          <Toaster />
          {children}
          <CustomerChat />
          </NotificationProvider>
          </CartProvider>
        </AuthProvider>
        <Footer />
      </body>
    </html>
  );
}