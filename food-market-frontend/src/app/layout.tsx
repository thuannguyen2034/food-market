// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; 
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Navbar from "@/components/Navbar";
const inter = Inter({ subsets: ["latin"] });
import { Toaster } from 'react-hot-toast';
import CustomerChat from "@/components/Chat/CustomerChat";

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
          <NotificationProvider>
          <Toaster />
          {children}
          <CustomerChat />
          </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}