'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Teacher } from '@/types/teacher';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateSignatureMessage } from '@/lib/walletAuth';
import RegionSelector from '@/components/RegionSelector';

interface DepartmentInfo {
  name: string;
  teacherCount: number;
}

interface UniversityStructure {
  university: string;
  departments: DepartmentInfo[];
}

interface LoadedTeachers {
  [key: string]: Teacher[]; // key: "university-department"
}

export default function Home() {
  const { publicKey, connected, signMessage } = useWallet();
  const [structure, setStructure] = useState<UniversityStructure[]>([]);
  const [loadedTeachers, setLoadedTeachers] = useState<LoadedTeachers>({});
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [currentRegion, setCurrentRegion] = useState<{ code: string; name: string }>({ code: 'CN', name: '中国大陆' });
  
  // 创建导师相关状态
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', university: '', department: '', title: '', email: '', homepage: '' });
  const [createStatus, setCreateStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [createMessage, setCreateMessage] = useState('');
  
  const walletAddress = publicKey?.toBase58() || '';
  
  const isChineseStart = (text: string) => /^[\u4e00-\u9fa5]/.test(text);
  const compareChineseFirst = (a: string, b: string) => {
    const aIsZh = isChineseStart(a);
    const bIsZh = isChineseStart(b);
    if (aIsZh !== bIsZh) {
      return aIsZh ? -1 : 1;
    }
    return a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' });
  };
  const getUniversityId = (name: string) =>
    'u-' + name
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-]/g, '')
      .toLowerCase();

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teachers/structure', {
        cache: 'no-store' // 禁用缓存，确保获取最新数据
      });
      const data = await response.json();

      if (data.success) {
        setStructure(data.data);
        // 更新当前地区显示
        if (data.region) {
          const regionMap: { [key: string]: string } = {
            'CN': '中国大陆',
            'HK': '中国香港',
            'TW': '中国台湾',
            'MO': '中国澳门',
            'US': '美国',
            'UK': '英国',
            'CA': '加拿大',
            'AU': '澳大利亚',
            'JP': '日本',
            'KR': '韩国',
            'SG': '新加坡',
            'DE': '德国',
            'FR': '法国',
          };
          setCurrentRegion({
            code: data.region,
            name: regionMap[data.region] || data.region
          });
        }
      } else {
        setError('获取数据失败');
      }
    } catch (err) {
      setError('网络错误');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentKey = (university: string, department: string) => {
    return `${university}-${department}`;
  };

  const toggleDepartment = async (university: string, department: string) => {
    const key = getDepartmentKey(university, department);
    const newExpanded = new Set(expandedDepartments);

    if (expandedDepartments.has(key)) {
      // 折叠
      newExpanded.delete(key);
      setExpandedDepartments(newExpanded);
    } else {
      // 展开
      newExpanded.add(key);
      setExpandedDepartments(newExpanded);

      // 如果还没有加载过这个院系的教师,则加载
      if (!loadedTeachers[key]) {
        await loadTeachers(university, department, key);
      }
    }
  };

  const loadTeachers = async (university: string, department: string, key: string) => {
    setLoadingDepartments(prev => new Set(prev).add(key));
    
    try {
      const response = await fetch(
        `/api/teachers/by-department?university=${encodeURIComponent(university)}&department=${encodeURIComponent(department)}`
      );
      const data = await response.json();

      if (data.success) {
        setLoadedTeachers(prev => ({
          ...prev,
          [key]: data.data.sort((a: Teacher, b: Teacher) => 
            a.name.localeCompare(b.name, 'zh-CN')
          )
        }));
      }
    } catch (err) {
      console.error('Error loading teachers:', err);
    } finally {
      setLoadingDepartments(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleCreateTeacher = async () => {
    if (!walletAddress) return;
    if (!signMessage) {
      setCreateStatus('error');
      setCreateMessage("钱包不支持签名功能，请使用其他钱包");
      return;
    }

    setCreateStatus('creating');
    setCreateMessage('正在创建导师...');
    setError(null);
    
    const payload: Record<string, unknown> = {
      name: createForm.name.trim(),
      university: createForm.university.trim(),
      region: currentRegion.code, // 使用当前选择的地区
      source: 'user',
      isActive: true,
    };
    if (createForm.department.trim()) payload.department = createForm.department.trim();
    if (createForm.title.trim()) payload.title = createForm.title.trim();
    if (createForm.email.trim()) payload.email = createForm.email.trim();
    if (createForm.homepage.trim()) {
      if (!/^https?:\/\//i.test(createForm.homepage.trim())) {
        setCreateStatus('error');
        setCreateMessage('Homepage 需要以 http(s):// 开头');
        return;
      }
      payload.homepage = createForm.homepage.trim();
    }

    try {
      // 生成时间戳和签名消息
      const timestamp = Date.now();
      const message = generateSignatureMessage(walletAddress, timestamp, 'create-teacher');
      
      // 请求用户签名
      const signature = await signMessage(new TextEncoder().encode(message));
      const signatureBase58 = Buffer.from(signature).toString('base64');

      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          walletAddress,
          signature: signatureBase58,
          timestamp
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '创建失败');
      
      try {
        if (walletAddress) {
          await fetch('/api/crowd-actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress,
              actionType: 'create',
              targetType: 'teacher',
              targetId: data.data?._id,
              payload: { name: payload.name, university: payload.university }
            })
          });
        }
      } catch {}
      
      // 创建成功，跳转到导师详情页
      setCreateStatus('success');
      setCreateMessage('导师创建成功！正在跳转...');
      
      setTimeout(() => {
        window.location.href = `/teachers/${data.data?._id}`;
      }, 1500);
      
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('User rejected')) {
        setCreateStatus('error');
        setCreateMessage("用户取消了签名操作");
      } else {
        const message = e instanceof Error ? e.message : '创建失败';
        setCreateStatus('error');
        setCreateMessage(message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 调试组件 - 开发时使用 */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {/* 动态导入调试组件，避免打包到生产环境 */}
          {typeof window !== 'undefined' && (
            <div>
              {/* RegionDebug 组件会显示在页面右下角 */}
            </div>
          )}
        </>
      )}
      
      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            当前地区：<span className="font-medium text-gray-900">{currentRegion.name}</span>
            {structure.length > 0 && (
              <span className="ml-2 text-gray-400">
                ({structure.reduce((sum, uni) => sum + uni.departments.reduce((dsum, dept) => dsum + dept.teacherCount, 0), 0)} 位教师)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <RegionSelector />
            <button
              className="bg-black text-white rounded-md px-4 py-2 text-sm disabled:opacity-50 hover:bg-gray-800 transition-colors"
              disabled={!connected}
              onClick={() => setCreating(true)}
            >
              {connected ? '创建新导师' : '请先连接钱包'}
            </button>
          </div>
        </div>
        {structure.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">暂无数据</p>
          </div>
        ) : (
          <div className="space-y-16">
            {[...structure]
              .sort((a, b) => compareChineseFirst(a.university, b.university))
              .map(({ university, departments }) => (
              <div key={university} id={getUniversityId(university)}>
                {/* 学校名称 */}
                <h2 className="text-xl font-medium text-black mb-8 pb-3 border-b border-gray-300">
                  {university}
                </h2>

                {/* 院系列表 */}
                <div className="space-y-6">
                  {departments.map((dept) => {
                    const key = getDepartmentKey(university, dept.name);
                    const isExpanded = expandedDepartments.has(key);
                    const isLoadingDept = loadingDepartments.has(key);
                    const teachers = loadedTeachers[key] || [];

                    return (
                      <div key={key} className="ml-6">
                        {/* 院系名称 - 可点击展开/折叠 */}
                        <button
                          onClick={() => toggleDepartment(university, dept.name)}
                          className="w-full text-left group"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider group-hover:text-black transition-colors">
                              {dept.name}
                              <span className="ml-2 text-xs text-gray-400">
                                ({dept.teacherCount})
                              </span>
                            </h3>
                            <span className="text-gray-400 group-hover:text-black transition-colors">
                              {isExpanded ? '−' : '+'}
                            </span>
                          </div>
                        </button>

                        {/* 教师列表 - 展开时显示 */}
                        {isExpanded && (
                          <div className="mt-4 pl-4">
                            {isLoadingDept ? (
                              <div className="text-sm text-gray-400">加载中...</div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3">
                                {teachers.map(teacher => (
                                  <Link
                                    key={teacher._id}
                                    href={`/teachers/${teacher._id}`}
                                    className="group"
                                  >
                                    <div className="flex items-baseline space-x-2">
                                      <span className="text-gray-900 hover:text-black transition-colors">
                                        {teacher.name}
                                      </span>
                                      {teacher.title && (
                                        <span className="text-xs text-gray-400 group-hover:text-gray-500">
                                          {teacher.title}
                                        </span>
                                      )}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 创建导师对话框 */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">创建新导师</h2>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={() => {
                  setCreating(false);
                  setCreateStatus('idle');
                  setCreateMessage('');
                  setCreateForm({ name: '', university: '', department: '', title: '', email: '', homepage: '' });
                }}
                disabled={createStatus === 'creating'}
              >×</button>
            </div>
            
            {/* 状态反馈 */}
            {createStatus !== 'idle' && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                createStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                createStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                createStatus === 'creating' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''
              }`}>
                {createStatus === 'creating' && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    {createMessage}
                  </div>
                )}
                {createStatus === 'success' && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    {createMessage}
                  </div>
                )}
                {createStatus === 'error' && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✕</span>
                    </div>
                    {createMessage}
                  </div>
                )}
              </div>
            )}
            
            {/* 地区提示 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 text-sm">📍</span>
                <div className="text-sm text-blue-700">
                  <span className="font-medium">创建地区：</span>
                  <span className="ml-1">{currentRegion.name}</span>
                  <div className="text-xs text-blue-600 mt-1">
                    新导师将被创建在当前选择的地区中
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <input
                placeholder="姓名（必填）"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full disabled:opacity-50 disabled:bg-gray-50"
                disabled={createStatus === 'creating'}
              />
              <input
                placeholder="大学（必填）"
                value={createForm.university}
                onChange={(e) => setCreateForm({ ...createForm, university: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full disabled:opacity-50 disabled:bg-gray-50"
                disabled={createStatus === 'creating'}
              />
              <input
                placeholder="院系（可选）"
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full disabled:opacity-50 disabled:bg-gray-50"
                disabled={createStatus === 'creating'}
              />
              <input
                placeholder="职称（可选）"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full disabled:opacity-50 disabled:bg-gray-50"
                disabled={createStatus === 'creating'}
              />
              <input
                placeholder="邮箱（可选）"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full disabled:opacity-50 disabled:bg-gray-50"
                disabled={createStatus === 'creating'}
              />
              <input
                placeholder="Homepage（可选，https://...）"
                value={createForm.homepage}
                onChange={(e) => setCreateForm({ ...createForm, homepage: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full disabled:opacity-50 disabled:bg-gray-50"
                disabled={createStatus === 'creating'}
              />
              <div className="text-xs text-gray-500 mt-1">
                💡 如果没有提供邮箱，系统会自动生成一个随机邮箱
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button 
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" 
                onClick={() => {
                  setCreating(false);
                  setCreateStatus('idle');
                  setCreateMessage('');
                  setCreateForm({ name: '', university: '', department: '', title: '', email: '', homepage: '' });
                }}
                disabled={createStatus === 'creating'}
              >取消</button>
              <button
                className="bg-black text-white rounded-md px-4 py-2 text-sm disabled:opacity-50 hover:bg-gray-800 transition-colors"
                disabled={!connected || !createForm.name.trim() || !createForm.university.trim() || createStatus === 'creating'}
                onClick={handleCreateTeacher}
              >
                {createStatus === 'creating' ? '创建中...' : connected ? '签名并提交' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 简洁的页脚 */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs text-gray-400 text-center">导师评价系统</p>
        </div>
      </footer>

      {/* 右侧导航栏 */}
      {structure.length > 0 && (
        <nav className="fixed right-6 top-24 z-40 hidden lg:block">
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg shadow-sm p-3 max-h-[70vh] overflow-auto w-56">
            <div className="text-xs text-gray-400 px-2 pb-2">快速导航</div>
            <ul className="space-y-1">
              {[...structure]
                .sort((a, b) => compareChineseFirst(a.university, b.university))
                .map(({ university }) => (
                <li key={university}>
                  <button
                    onClick={() => {
                      const el = document.getElementById(getUniversityId(university));
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 text-sm text-gray-700 hover:text-black truncate"
                    title={university}
                  >
                    {university}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
