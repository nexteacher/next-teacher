'use client';

import { useState, useEffect } from 'react';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function RegionDebug() {
  const [clientRegion, setClientRegion] = useState<string | null>(null);
  const [serverRegion, setServerRegion] = useState<string | null>(null);
  const [allCookies, setAllCookies] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 读取客户端 Cookie
    const region = getCookie('region');
    setClientRegion(region);
    setAllCookies(document.cookie);

    // 获取服务端返回的地区
    fetch('/api/teachers/structure')
      .then(res => res.json())
      .then(data => {
        setServerRegion(data.region || null);
      })
      .catch(() => {
        setServerRegion('Error');
      });
  }, []);

  if (!mounted) return null;

  const isMatch = clientRegion === serverRegion;

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50 text-xs">
      <div className="font-bold mb-2 text-sm">🐛 地区调试信息</div>
      
      <div className="space-y-2">
        <div>
          <span className="text-gray-500">客户端 Cookie:</span>
          <span className={`ml-2 font-mono ${clientRegion ? 'text-blue-600' : 'text-red-600'}`}>
            {clientRegion || 'null'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-500">服务端读取:</span>
          <span className={`ml-2 font-mono ${serverRegion ? 'text-green-600' : 'text-red-600'}`}>
            {serverRegion || 'null'}
          </span>
        </div>
        
        <div className={`mt-2 p-2 rounded ${isMatch ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {isMatch ? '✅ Cookie 同步正常' : '❌ Cookie 不同步！'}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-gray-500 mb-1">所有 Cookies:</div>
          <div className="font-mono text-[10px] break-all text-gray-600 max-h-20 overflow-auto">
            {allCookies || '(empty)'}
          </div>
        </div>
      </div>
    </div>
  );
}

