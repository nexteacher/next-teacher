'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Teacher } from '@/types/teacher';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(() => {
    return q.trim().length > 0 || university.trim().length > 0 || department.trim().length > 0;
  }, [q, university, department]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (university.trim()) params.set('university', university.trim());
      if (department.trim()) params.set('department', department.trim());
      params.set('limit', '100');

      const res = await fetch(`/api/teachers/search?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setResults(data.data as Teacher[]);
      } else {
        setError(data.error || '搜索失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初次进入不自动搜索
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-xl font-medium text-black mb-6">搜索导师</h1>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-6">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">关键词（姓名/学校/院系）</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="如：张三 / 清华大学 / 计算机"
              className="w-full h-10 px-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">学校</label>
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="学校名"
              className="w-full h-10 px-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">院系</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="院系名"
              className="w-full h-10 px-3 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30 text-sm"
            />
          </div>
          <div className="md:col-span-4 flex gap-3">
            <button
              type="submit"
              disabled={!canSearch || loading}
              className="px-4 h-10 border border-gray-300 rounded hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
            <button
              type="button"
              onClick={() => { setQ(''); setUniversity(''); setDepartment(''); setResults([]); setError(null); }}
              className="px-4 h-10 border border-gray-300 rounded hover:border-black transition-colors text-sm"
            >
              重置
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-3 rounded border bg-red-50 border-red-200 text-red-800 text-sm">{error}</div>
        )}

        {/* 结果列表 */}
        {results.length > 0 ? (
          <div>
            <div className="text-xs text-gray-500 mb-3">共 {results.length} 条结果</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map(t => (
                <Link key={t._id} href={`/teachers/${t._id}`} className="group block border border-gray-200 rounded p-4 hover:border-black transition-colors">
                  <div className="flex items-baseline justify-between">
                    <div className="text-gray-900 group-hover:text-black font-medium">{t.name}</div>
                    {t.title && <div className="text-xs text-gray-400 group-hover:text-gray-500">{t.title}</div>}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    <span>{t.university}</span>
                    {t.department && <span className="ml-2 text-gray-400">{t.department}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">{loading ? '' : '暂无结果，请输入关键词或条件进行搜索'}</div>
        )}
      </main>
    </div>
  );
}


