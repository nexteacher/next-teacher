'use client';

import { useEffect, useState } from 'react';

interface RegionItem {
  code: string;
  name: string;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export default function RegionSelector() {
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<string>('CN');

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/regions', { cache: 'no-store' });
        const data = await res.json();
        const list: RegionItem[] = data?.data || [];
        setRegions(list);
        const cookieRegion = getCookie('region') || 'CN';
        setCurrent(cookieRegion);
      } catch {
        setRegions([{ code: 'CN', name: '中国大陆' }]);
        setCurrent('CN');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // const _label = useMemo(() => {
  //   const found = regions.find(r => r.code === current);
  //   return found ? found.name : '中国大陆';
  // }, [regions, current]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCurrent(value);
    setCookie('region', value);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">地区</span>
      {loading ? (
        <div className="w-[120px] h-[32px] bg-gray-100 rounded" />
      ) : (
        <select
          value={current}
          onChange={onChange}
          className="h-8 px-2 border border-gray-200 rounded text-sm bg-white hover:border-gray-300"
          aria-label="选择地区"
        >
          {regions.map(r => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}


