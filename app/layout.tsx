import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
// BU SATIR OLMAZSA HER ŞEY BEYAZ GÖRÜNÜR:
import "./globals.css";
import CartProvider from "../lib/cart";
import CartDrawer from "../components/CartDrawer";
import ThemeBootstrap from "./components/ThemeBootstrap";
import DeveloperHideGuard from "./components/DeveloperHideGuard";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#5865F2",
};

export const metadata: Metadata = {
  title: "DiscoWeb - Discord Yönetim Paneli",
  description: "Özel Discord sunucuları için geliştirilmiş, yapay zeka destekli gelişmiş yönetim platformu.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DiscoWeb",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* ThemeBootstrap applies persisted theme on client mount; removed pre-hydration inline script
          to prevent React hydration mismatches. This may cause a very short FOUC but avoids warnings. */}
        <ThemeBootstrap />
        <ServiceWorkerRegister />
        <DeveloperHideGuard />
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}