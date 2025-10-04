import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nexteacher.wiki'),
  title: "NexTeacher - 导师 Wiki | Web3 导师评价平台",
  description: "基于 Web3 的导师信息汇总与评价平台，提供真实的研究生导师、博士导师评价信息，帮助学生选择合适的研究导师。支持区块链签名验证，确保评价真实性。",
  keywords: "导师评价,研究生导师,博士导师,导师推荐,学术导师,Web3,区块链,导师选择,研究生选择,博士选择,导师信息,导师评价系统",
  authors: [{ name: "NexTeacher" }],
  creator: "NexTeacher",
  publisher: "NexTeacher",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://nexteacher.wiki',
    siteName: 'NexTeacher - 导师 Wiki',
    title: 'NexTeacher - 导师 Wiki | Web3 导师评价平台',
    description: '基于 Web3 的导师信息汇总与评价平台，提供真实的研究生导师、博士导师评价信息，帮助学生选择合适的研究导师。',
    images: [
      {
        url: '/nt_logo.png',
        width: 1200,
        height: 630,
        alt: 'NexTeacher - 导师 Wiki',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexTeacher - 导师 Wiki | Web3 导师评价平台',
    description: '基于 Web3 的导师信息汇总与评价平台，提供真实的研究生导师、博士导师评价信息。',
    images: ['/nt_logo.png'],
  },
  alternates: {
    canonical: 'https://nexteacher.wiki',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
