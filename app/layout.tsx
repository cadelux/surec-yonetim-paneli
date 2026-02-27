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
          <div className="crescent-hanger crescent-animate" aria-hidden="true">
            <div className="crescent-string" />
            <div className="crescent-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="crescent-svg"
              >
                <path d="M70 50C70 65.464 57.464 78 42 78C34.267 78 27.267 74.733 22 69.467C25.333 71.133 29.067 72 33 72C47.912 72 60 59.912 60 45C60 37.088 56.533 30.067 51 25.333C52.333 25.133 53.667 25 55 25C64.389 25 72.611 31.222 70 50Z" />
              </svg>
            </div>
          </div>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
