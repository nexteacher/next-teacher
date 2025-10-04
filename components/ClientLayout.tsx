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
  useEffect(() => setMounted(true), []);

  const currentPath = mounted ? pathname : null;
  const isHome = currentPath === '/';
  // const _isAdmin = currentPath?.startsWith('/admin');
  const isSearch = currentPath?.startsWith('/search');
  const isCrowd = currentPath?.startsWith('/crowdsource');
  const isBlockchain = currentPath?.startsWith('/blockchain');
  const isAbout = currentPath?.startsWith('/about');
  // const isComments = currentPath?.startsWith('/comments');

  return (
    <WalletContextProvider>
      {/* 滚动宣传 Banner - 仅桌面端显示 */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 text-white overflow-hidden">
        <div className="animate-scroll-banner py-2 text-sm font-medium">
          <div className="flex">
            {
              Array.from({ length: 20 }).map((_, index) => (
                <span key={index} className="inline-block mr-8 whitespace-nowrap">导师 Wiki</span>
              ))
            }
          </div>
        </div>
      </div>

      {/* 全局导航栏 */}
      <nav className="fixed top-0 md:top-[32px] left-0 right-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 md:border-t-0">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* 品牌 */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-extrabold tracking-tight text-black group-hover:text-gray-900 transition-colors">NexTeacher</span>
            <span className="text-xs text-gray-500">Beta</span>
          </Link>

          {/* 主菜单 */}
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
          <div className="flex items-center gap-3">
            {/* <div className="hidden sm:block">
              <RegionSelector />
            </div> */}
            {/* GitHub 链接 */}
            {/* <Link
              href="https://github.com/nexteacher/next-teacher"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="查看 GitHub 仓库"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </Link> */}
            <WalletButtonDynamic />
          </div>
        </div>
      </nav>
      
      {/* 主内容区 */}
      <div className="pt-[68px] md:pt-[100px]">
        {children}
      </div>
    </WalletContextProvider>
  );
}