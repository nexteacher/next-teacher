'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { connected, connecting } = useWallet();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // 确保组件已在客户端挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 只在客户端挂载完成后才检查连接状态
    if (!mounted) return;

    // 给钱包一点时间完成自动连接
    const timer = setTimeout(() => {
      if (!connected && !connecting) {
        setRedirecting(true);
        router.push('/');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [connected, connecting, router, mounted]);

  // 服务端渲染或客户端未挂载时显示加载状态
  if (!mounted || connecting || redirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">
            {!mounted ? '加载中...' : connecting ? '正在连接钱包...' : '正在验证...'}
          </p>
        </div>
      </div>
    );
  }

  // 未连接显示提示信息
  if (!connected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-xl font-medium text-black mb-4">需要连接钱包</h2>
          <p className="text-gray-600 mb-6">
            访问管理页面需要使用 Solana 钱包登录。请点击右上角的&ldquo;连接钱包&rdquo;按钮。
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-gray-300 rounded hover:border-black transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 已连接，显示内容
  return <>{children}</>;
}