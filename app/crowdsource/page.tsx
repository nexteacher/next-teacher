'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EducationBackgroundLite {
  degree?: string;
  major?: string;
  university?: string;
  year?: number;
}

interface WorkExperienceLite {
  position?: string;
  institution?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
}

interface TeacherLite {
  _id: string;
  name: string;
  title?: string;
  university: string;
  department?: string;
  email?: string | null;
  homepage?: string;
  avatar?: string;
  researchAreas?: string[];
  education?: EducationBackgroundLite[];
  experience?: WorkExperienceLite[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CrowdsourcePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ teacherCount: number; commentCount: number; avgCommentsPerTeacher: number } | null>(null);
  const [teachers, setTeachers] = useState<TeacherLite[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ walletAddress: string; count: number }>>([]);
  const [jumpPage, setJumpPage] = useState<string>('');

  const pageItems = (() => {
    if (!pagination) return [];
    const current = pagination.page;
    const total = pagination.totalPages;
    const items: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) items.push(i);
      return items;
    }
    items.push(1);
    if (current <= 4) {
      for (let i = 2; i <= 5; i++) items.push(i);
      items.push('…');
      items.push(total);
      return items;
    }
    if (current >= total - 3) {
      items.push('…');
      for (let i = total - 4; i < total; i++) items.push(i);
      items.push(total);
      return items;
    }
    items.push('…');
    items.push(current - 1, current, current + 1);
    items.push('…');
    items.push(total);
    return items;
  })();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (query) params.set('q', query);

      const res = await fetch(`/api/teachers/missing-fields?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '加载失败');
      setTeachers(data.data);
      setPagination(data.pagination);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '加载失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/crowd-actions/leaderboard?limit=10');
        const data = await res.json();
        if (data.success) setLeaderboard(data.data);
      } catch {}
    })();
  }, []);

  // 实时统计信息：定时刷新
  useEffect(() => {
    let stop = false;
    let timer: NodeJS.Timeout | null = null;
    const pull = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        const data = await res.json();
        if (!stop && data?.success) setStats(data.data);
      } catch {}
    };
    // 立即拉取一次
    pull();
    // 每 20 秒刷新一次
    timer = setInterval(pull, 20000);
    return () => {
      stop = true;
      if (timer) clearInterval(timer);
    };
  }, []);


  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">人人为我，我为人人</h1>
        <p className="text-gray-600 text-sm mt-1">众包完善所有导师信息，按信息缺失程度排序，缺失信息越多的导师排在越前面。</p>
      </div>

      
      {/* 实时信息板 */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">本站实时信息</h2>
          <span className="text-xs text-gray-500">每20秒自动刷新</span>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="border rounded-md p-3">
            <div className="text-gray-500">教师数量</div>
            <div className="text-xl font-semibold">{stats ? stats.teacherCount : '—'}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-gray-500">评论总数</div>
            <div className="text-xl font-semibold">{stats ? stats.commentCount : '—'}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-gray-500">人均评论</div>
            <div className="text-xl font-semibold">{stats ? stats.avgCommentsPerTeacher.toFixed(2) : '—'}</div>
          </div>
        </div>
      </div>

      {/* 贡献排行榜 */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">贡献排行榜</h2>
          <span className="text-xs text-gray-500">Top {leaderboard.length}</span>
        </div>
        {leaderboard.length === 0 ? (
          <div className="text-sm text-gray-500">暂无数据</div>
        ) : (
          <ol className="text-sm space-y-2">
            {leaderboard.map((item, idx) => (
              <li key={item.walletAddress} className="flex items-center justify-between">
                <span className="text-gray-700">#{idx + 1} {item.walletAddress.slice(0,6)}...{item.walletAddress.slice(-4)}</span>
                <span className="text-gray-900 font-medium">{item.count}</span>
              </li>
            ))}
          </ol>
        )}
      </div>


      {/* 搜索 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <input
            placeholder="搜索姓名、大学或院系"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
          />
          <button
            onClick={() => { setPage(1); fetchData(); }}
            className="bg-black text-white rounded-md px-4 py-2 text-sm"
          >搜索</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      {/* 导师列表导语 */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">导师信息列表</h3>
            <p className="text-blue-700 text-sm leading-relaxed">
              以下导师信息按缺失程度排序，缺失信息越多的导师排在越前面。点击导师姓名可以查看详细信息。
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 text-sm py-12">加载中...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {teachers.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">暂无导师数据</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {teachers.map(t => (
                <li key={t._id} id={`teacher-${t._id}`} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/teachers/${t._id}`} className="text-black hover:underline font-medium text-lg">{t.name}</Link>
                      <div className="text-gray-600 text-sm mt-1">{t.university}{t.department ? ` · ${t.department}` : ''}</div>
                      {t.title && <div className="text-gray-500 text-sm mt-1">职称：{t.title}</div>}
                      {t.email && <div className="text-gray-500 text-sm mt-1">邮箱：{t.email}</div>}
                      {t.homepage && <div className="text-gray-500 text-sm mt-1">主页：<a href={t.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{t.homepage}</a></div>}
                      {t.researchAreas && t.researchAreas.length > 0 && (
                        <div className="text-gray-500 text-sm mt-1">研究领域：{t.researchAreas.join(', ')}</div>
                      )}
                    </div>
                    <div className="ml-4">
                      <Link 
                        href={`/teachers/${t._id}`}
                        className="text-sm px-3 py-1 border rounded-md hover:bg-gray-50 text-blue-600 hover:text-blue-800"
                      >查看详情</Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex items-center flex-wrap justify-center gap-1 md:gap-2">
            <button
              className="px-2 md:px-3 py-1 border rounded disabled:opacity-50 text-sm"
              disabled={pagination.page === 1}
              onClick={() => setPage(1)}
            >首页</button>
            <button
              className="px-2 md:px-3 py-1 border rounded disabled:opacity-50 text-sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >上一页</button>

            {pageItems.map((it, idx) => (
              typeof it === 'number' ? (
                <button
                  key={`p-${it}`}
                  className={`px-2 md:px-3 py-1 border rounded text-sm ${it === pagination.page ? 'bg-black text-white border-black' : 'hover:bg-gray-50'}`}
                  onClick={() => setPage(it)}
                >{it}</button>
              ) : (
                <span key={`e-${idx}`} className="px-1 md:px-2 text-gray-400">{it}</span>
              )
            ))}

            <button
              className="px-2 md:px-3 py-1 border rounded disabled:opacity-50 text-sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage(p => p + 1)}
            >下一页</button>
            <button
              className="px-2 md:px-3 py-1 border rounded disabled:opacity-50 text-sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPage(pagination.totalPages)}
            >末页</button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-gray-600">
            <span className="whitespace-nowrap">第 {pagination.page} / {pagination.totalPages} 页</span>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(jumpPage);
                if (!Number.isFinite(n)) return;
                const target = Math.min(Math.max(1, Math.trunc(n)), pagination.totalPages);
                setPage(target);
                setJumpPage('');
              }}
            >
              <input
                type="number"
                min={1}
                max={pagination.totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                placeholder="页码"
                className="w-16 md:w-20 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="px-3 py-1 border rounded hover:bg-gray-50 text-sm whitespace-nowrap"
              >跳转</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


