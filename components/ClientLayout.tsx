'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletContextProvider } from '@/contexts/WalletContextProvider';
import dynamic from 'next/dynamic';

// 动态导入钱包按钮，完全禁用 SSR
const WalletButtonDynamic = dynamic(
  () => import('@/components/WalletButton'),
  {
    ssr: false,
    loading: () => <div className="w-[120px] h-[40px]" /> // 占位符防止布局跳动
  }
);

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // 为避免 SSR 与客户端初渲染不一致导致的 Hydration 错误，挂载后再读取 pathname
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentPath = mounted ? pathname : null;
  const isHome = currentPath === '/';
  // const _isAdmin = currentPath?.startsWith('/admin');
  const isSearch = currentPath?.startsWith('/search');
  const isCrowd = currentPath?.startsWith('/crowdsource');
  const isBlockchain = currentPath?.startsWith('/blockchain');
  const isAbout = currentPath?.startsWith('/about');
  // const isComments = currentPath?.startsWith('/comments');

  // 关闭移动菜单当路由变化时
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <WalletContextProvider>
      {/* 滚动宣传 Banner - 仅桌面端显示 */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 text-white overflow-hidden">
        <div className="animate-scroll-banner py-2 text-sm font-medium">
          <div className="flex">
            {
              Array.from({ length: 40 }).map((_, index) => (
                <span key={index} className="inline-block mr-8 whitespace-nowrap">导师 Wiki</span>
              ))
            }
          </div>
        </div>
      </div>

      {/* 全局导航栏 */}
      <nav className="fixed top-0 md:top-[32px] left-0 right-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 md:border-t-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          {/* 品牌 */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg md:text-xl font-extrabold tracking-tight text-black group-hover:text-gray-900 transition-colors">NexTeacher</span>
            <span className="text-xs text-gray-500">Beta</span>
          </Link>

          {/* 主菜单 - 桌面端 */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm transition-colors ${isHome ? 'bg-black text-white' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`}
            >
              首页
            </Link>
            <Link
              href="/search"
              className={`px-3 py-2 rounded-md text-sm transition-colors ${isSearch ? 'bg-black text-white' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`}
            >
              搜索
            </Link>
            <Link
              href="/crowdsource"
              className={`px-3 py-2 rounded-md text-sm transition-colors ${isCrowd ? 'bg-black text-white' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`}
            >
              众包
            </Link>
            <Link
              href="/blockchain"
              className={`px-3 py-2 rounded-md text-sm transition-colors ${isBlockchain ? 'bg-black text-white' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`}
            >
              行为浏览器
            </Link>
            <Link
              href="/about"
              className={`px-3 py-2 rounded-md text-sm transition-colors ${isAbout ? 'bg-black text-white' : 'text-gray-700 hover:text-black hover:bg-gray-100'}`}
            >
              关于
            </Link>
          </div>

          {/* 右侧控件 */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* 钱包按钮 - 桌面端显示完整版，移动端显示简化版 */}
            <div className="hidden md:block">
              <WalletButtonDynamic />
            </div>
            
            {/* 移动端汉堡菜单按钮 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 移动端菜单下拉 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 py-2 space-y-1">
              <Link
                href="/"
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${isHome ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                首页
              </Link>
              <Link
                href="/search"
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${isSearch ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                搜索
              </Link>
              <Link
                href="/crowdsource"
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${isCrowd ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                众包
              </Link>
              <Link
                href="/blockchain"
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${isBlockchain ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                行为浏览器
              </Link>
              <Link
                href="/about"
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${isAbout ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                关于
              </Link>
              {/* 移动端钱包按钮 */}
              <div className="pt-2 pb-1">
                <WalletButtonDynamic />
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* 主内容区 */}
      <div className="pt-[56px] md:pt-[100px]">
        {children}
      </div>
    </WalletContextProvider>
  );
}