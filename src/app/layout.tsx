import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ardana — Catat Keuangan Semudah Chat dari Telegram Kamu",
  description: "Aplikasi manajemen keuangan pribadi terintegrasi Telegram Bot. Catat pemasukan, pengeluaran & foto struk belanja dengan AI instan.",
  keywords: ["Ardana", "fintech indonesia", "telegram bot keuangan", "manajemen keuangan pribadi", "catat keuangan otomatis"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[#F5E8EB] selection:text-[#641E32] font-sans min-h-screen bg-[#FFFCFA] text-[#30272A]">
        {children}
      </body>
    </html>
  );
}

