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
  missingFieldsCount?: number;
  missingFields?: string[];
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
  const [limit] = useState(24); // 24能被2和3整除，适配网格布局
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base">贡献排行榜</h2>
          <span className="text-xs text-gray-500">Top {leaderboard.length}</span>
        </div>
        {leaderboard.length === 0 ? (
          <div className="text-sm text-gray-500">暂无数据</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((item, idx) => {
              // 判断奖牌颜色
              const medalColors = ['bg-yellow-100 border-yellow-300 text-yellow-700', 'bg-gray-100 border-gray-300 text-gray-700', 'bg-orange-100 border-orange-300 text-orange-700'];
              const isTopThree = idx < 3;
              const medalColor = isTopThree ? medalColors[idx] : 'bg-blue-50 border-blue-200 text-blue-700';
              
              return (
                <div 
                  key={item.walletAddress} 
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all hover:shadow-sm ${medalColor}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 排名徽章 */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-400 text-gray-900' :
                      idx === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-blue-500 text-white'
                    }`}>
                      {idx < 3 ? (idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉') : idx + 1}
                    </div>
                    
                    {/* 钱包地址 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs sm:text-sm font-medium truncate" title={item.walletAddress}>
                        {item.walletAddress.length > 20 
                          ? `${item.walletAddress.slice(0, 8)}...${item.walletAddress.slice(-6)}`
                          : item.walletAddress
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* 贡献次数 */}
                  <div className="flex-shrink-0 ml-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">贡献</span>
                      <span className="font-bold text-base">{item.count}</span>
                      <span className="text-xs text-gray-500">次</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            className="w-24 bg-black text-white rounded-md px-4 py-2 text-sm"
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
              以下导师信息按缺失程度排序，缺失信息越多的导师排在越前面。点击&ldquo;去完善&rdquo;按钮可以帮助补充导师信息。
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 text-sm py-12">加载中...</div>
      ) : (
        <div>
          {teachers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg text-center text-gray-500 py-10 text-sm">暂无导师数据</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {teachers.map(t => {
                const totalFields = 8;
                const missingCount = t.missingFieldsCount || 0;
                const completeness = ((totalFields - missingCount) / totalFields) * 100;
                
                // 字段中文映射
                const fieldNames: Record<string, string> = {
                  title: '职称',
                  department: '院系',
                  email: '邮箱',
                  homepage: '个人主页',
                  avatar: '头像',
                  researchAreas: '研究领域',
                  education: '教育背景',
                  experience: '工作经历'
                };
                
                return (
                  <div key={t._id} id={`teacher-${t._id}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col h-full">
                    {/* 头部：姓名和完整度 */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/teachers/${t._id}`} 
                            className="text-black hover:underline font-semibold text-lg block truncate"
                            title={t.name}
                          >
                            {t.name}
                          </Link>
                          <div className="text-gray-600 text-sm mt-1 truncate" title={`${t.university}${t.department ? ` · ${t.department}` : ''}`}>
                            {t.university}{t.department ? ` · ${t.department}` : ''}
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <Link 
                            href={`/teachers/${t._id}`}
                            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors inline-block ${
                              missingCount >= 4 
                                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            去完善
                          </Link>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs text-gray-500">
                          完整度: {completeness.toFixed(0)}%
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          missingCount >= 6 ? 'bg-red-100 text-red-700' :
                          missingCount >= 4 ? 'bg-orange-100 text-orange-700' :
                          missingCount >= 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {missingCount >= 6 ? '急需完善' :
                           missingCount >= 4 ? '需要完善' :
                           missingCount >= 2 ? '可以完善' :
                           '信息较全'}
                        </div>
                      </div>

                      {/* 完整度进度条 */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            completeness >= 75 ? 'bg-green-500' :
                            completeness >= 50 ? 'bg-yellow-500' :
                            completeness >= 25 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    </div>

                    {/* 缺失字段标签 */}
                    {t.missingFields && t.missingFields.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-1.5">缺失信息：</div>
                        <div className="flex flex-wrap gap-1.5">
                          {t.missingFields.map(field => (
                            <span 
                              key={field}
                              className="text-xs px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded"
                            >
                              {fieldNames[field] || field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 现有信息展示 */}
                    <div className="space-y-1 text-xs flex-1">
                      {t.title && (
                        <div className="flex items-start">
                          <span className="text-gray-500 w-16 flex-shrink-0">职称：</span>
                          <span className="text-gray-700 truncate">{t.title}</span>
                        </div>
                      )}
                      {t.email && (
                        <div className="flex items-start">
                          <span className="text-gray-500 w-16 flex-shrink-0">邮箱：</span>
                          <span className="text-gray-700 truncate" title={t.email}>{t.email}</span>
                        </div>
                      )}
                      {t.homepage && (
                        <div className="flex items-start">
                          <span className="text-gray-500 w-16 flex-shrink-0">主页：</span>
                          <a 
                            href={t.homepage} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline truncate block"
                            title={t.homepage}
                          >
                            {t.homepage}
                          </a>
                        </div>
                      )}
                      {t.researchAreas && t.researchAreas.length > 0 && (
                        <div className="flex items-start">
                          <span className="text-gray-500 w-16 flex-shrink-0">研究领域：</span>
                          <span className="text-gray-700 line-clamp-2">{t.researchAreas.join('、')}</span>
                        </div>
                      )}
                      {t.education && t.education.length > 0 && (
                        <div className="flex items-start">
                          <span className="text-gray-500 w-16 flex-shrink-0">教育背景：</span>
                          <span className="text-gray-700">已填写 {t.education.length} 条</span>
                        </div>
                      )}
                      {t.experience && t.experience.length > 0 && (
                        <div className="flex items-start">
                          <span className="text-gray-500 w-16 flex-shrink-0">工作经历：</span>
                          <span className="text-gray-700">已填写 {t.experience.length} 条</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8">
          {/* 分页信息卡片 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {/* 页码导航 */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* 首页和上一页 */}
              <button
                className="group flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-300 disabled:hover:bg-white disabled:hover:text-gray-700"
                disabled={pagination.page === 1}
                onClick={() => setPage(1)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">首页</span>
              </button>
              <button
                className="group flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-300 disabled:hover:bg-white disabled:hover:text-gray-700"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">上一页</span>
              </button>

              {/* 页码按钮 */}
              <div className="flex items-center gap-1">
                {pageItems.map((it, idx) => (
                  typeof it === 'number' ? (
                    <button
                      key={`p-${it}`}
                      className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        it === pagination.page 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-110' 
                          : 'border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                      onClick={() => setPage(it)}
                    >{it}</button>
                  ) : (
                    <span key={`e-${idx}`} className="px-2 text-gray-400 font-bold">…</span>
                  )
                ))}
              </div>

              {/* 下一页和末页 */}
              <button
                className="group flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-300 disabled:hover:bg-white disabled:hover:text-gray-700"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(p => p + 1)}
              >
                <span className="hidden sm:inline">下一页</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className="group flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-300 disabled:hover:bg-white disabled:hover:text-gray-700"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPage(pagination.totalPages)}
              >
                <span className="hidden sm:inline">末页</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 分页信息和快速跳转 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-200">
              {/* 左侧：页面信息 */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  第 <span className="font-semibold text-blue-600">{pagination.page}</span> / {pagination.totalPages} 页
                </span>
                <span className="text-gray-400">|</span>
                <span>共 <span className="font-semibold text-gray-900">{pagination.total}</span> 位导师</span>
              </div>

              {/* 右侧：快速跳转 */}
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
                <label className="text-sm text-gray-600 whitespace-nowrap">快速跳转:</label>
                <input
                  type="number"
                  min={1}
                  max={pagination.totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  placeholder="页码"
                  className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
                >
                  跳转
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


