import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konyevi Gençlik - Süreç Yönetim Paneli",
  description: "Teşkilat Süreç Yönetim ve Takip Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* Islamic Crescent Decorations */}
          <span className="crescent-decoration crescent-left-1" aria-hidden="true">☽</span>
          <span className="crescent-decoration crescent-left-2" aria-hidden="true">☽</span>
          <span className="crescent-decoration crescent-left-3" aria-hidden="true">☽</span>
          <span className="crescent-decoration crescent-right-1" aria-hidden="true">☽</span>
          <span className="crescent-decoration crescent-right-2" aria-hidden="true">☽</span>
          <span className="crescent-decoration crescent-right-3" aria-hidden="true">☽</span>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
