'use client';

import { useState, useEffect } from 'react';

// 地区列表（硬编码）
const REGIONS = [
  { code: 'CN', name: '中国大陆' },
  { code: 'HK', name: '中国香港' },
  { code: 'TW', name: '中国台湾' },
  { code: 'MO', name: '中国澳门' },
  { code: 'US', name: '美国' },
  { code: 'UK', name: '英国' },
  { code: 'CA', name: '加拿大' },
  { code: 'AU', name: '澳大利亚' },
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韩国' },
  { code: 'SG', name: '新加坡' },
  { code: 'DE', name: '德国' },
  { code: 'FR', name: '法国' },
];

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function RegionSelector() {
  const [current, setCurrent] = useState<string>('CN');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedRegion = getCookie('region') || 'CN';
    setCurrent(savedRegion);
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCurrent(value);
    setCookie('region', value);
    // 重新加载页面以应用新的地区过滤
    window.location.reload();
  };

  // 避免 SSR 水合不匹配
  if (!mounted) {
    return <div className="w-[140px] h-[32px] bg-gray-100 rounded animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 hidden sm:inline">地区</span>
      <select
        value={current}
        onChange={onChange}
        className="h-8 px-2 border border-gray-200 rounded text-sm bg-white hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
        aria-label="选择地区"
      >
        {REGIONS.map(r => (
          <option key={r.code} value={r.code}>{r.name}</option>
        ))}
      </select>
    </div>
  );
}

