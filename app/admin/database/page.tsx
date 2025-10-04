'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Teacher } from '@/types/teacher';

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

export default function Page() {
    const [structure, setStructure] = useState<UniversityStructure[]>([]);
    const [loadedTeachers, setLoadedTeachers] = useState<LoadedTeachers>({});
    const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState<Set<string>>(new Set());
    const [initLoading, setInitLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [importing, setImporting] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [regionName, setRegionName] = useState<string>('中国大陆');
    
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

    const getDepartmentKey = (university: string, department: string) => {
        return `${university}-${department}`;
    };

    const fetchStructure = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/teachers/structure');
            const result = await response.json();
            
            if (result.success) {
                setStructure(result.data);
                setMessage('');
                try {
                    const res = await fetch('/api/regions', { cache: 'no-store' });
                    const regionData = await res.json();
                    const code = result.region || 'CN';
                    const found = (regionData?.data || []).find((r: { code: string; name: string }) => r.code === code);
                    setRegionName(found?.name || '中国大陆');
                } catch {}
            } else {
                setMessage('获取数据失败: ' + result.message);
            }
        } catch (error) {
            setMessage('获取数据时出错: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setLoading(false);
        }
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

    const initDatabase = async () => {
        if (!confirm('确定要初始化数据库吗？这将清空所有现有数据并添加示例数据。')) {
            return;
        }

        setInitLoading(true);
        try {
            const response = await fetch('/api/admin/init_database', {
                method: 'POST'
            });
            const result = await response.json();
            
            if (response.ok) {
                setMessage(`数据库初始化成功! 创建了 ${result.data.teacherCount} 个导师和 ${result.data.reviewCount} 条评价`);
                // 初始化成功后重新获取数据
                await fetchStructure();
                // 清空已加载的教师数据和展开状态
                setLoadedTeachers({});
                setExpandedDepartments(new Set());
            } else {
                setMessage('初始化失败: ' + result.message);
            }
        } catch (error) {
            setMessage('初始化时出错: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setInitLoading(false);
        }
    };

    const createNewTeacher = async (university?: string, department?: string) => {
        setCreating(true);
        try {
            const response = await fetch('/api/teachers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: '新导师',
                    title: '教授',
                    department: department || '待填写',
                    university: university || '待填写',
                    email: `new-teacher-${Date.now()}@example.com`,
                    isActive: true,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setMessage('新建导师成功，即将跳转到编辑页面...');
                setTimeout(() => {
                    window.location.href = `/admin/teachers/${result.data._id}`;
                }, 1000);
            } else {
                setMessage('创建失败: ' + result.error);
            }
        } catch (error) {
            setMessage('创建时出错: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setCreating(false);
        }
    };

    const deleteTeacher = async (teacherId: string, teacherName: string, university: string, department: string) => {
        if (!confirm(`确定要删除导师 "${teacherName}" 吗？此操作不可撤销。`)) {
            return;
        }

        setDeleting(teacherId);
        try {
            const response = await fetch(`/api/teachers/${teacherId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                setMessage(`成功删除导师 "${teacherName}"`);
                
                // 局部更新：从当前状态中移除被删除的导师
                const key = getDepartmentKey(university, department);
                setLoadedTeachers(prev => {
                    const newLoaded = { ...prev };
                    if (newLoaded[key]) {
                        newLoaded[key] = newLoaded[key].filter(t => t._id !== teacherId);
                    }
                    return newLoaded;
                });

                // 更新结构中的教师数量
                setStructure(prev => prev.map(uni => {
                    if (uni.university === university) {
                        return {
                            ...uni,
                            departments: uni.departments.map(dept => {
                                if (dept.name === department) {
                                    return {
                                        ...dept,
                                        teacherCount: Math.max(0, dept.teacherCount - 1)
                                    };
                                }
                                return dept;
                            })
                        };
                    }
                    return uni;
                }));
            } else {
                setMessage('删除失败: ' + result.error);
            }
        } catch (error) {
            setMessage('删除时出错: ' + (error instanceof Error ? error.message : '未知错误'));
        } finally {
            setDeleting(null);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.name.endsWith('.json')) {
            setMessage('请上传 JSON 文件');
            return;
        }

        setImporting(true);
        try {
            // 读取文件内容
            const text = await file.text();
            const data = JSON.parse(text);

            // 发送到API
            const response = await fetch('/api/admin/import_teachers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                setMessage(result.message + (result.data.errors.length > 0 ? `\n错误详情：\n${result.data.errors.join('\n')}` : ''));
                await fetchStructure(); // 刷新结构
                // 清空已加载的教师数据和展开状态
                setLoadedTeachers({});
                setExpandedDepartments(new Set());
            } else {
                setMessage('导入失败: ' + result.error);
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                setMessage('JSON 文件格式错误，请检查文件内容');
            } else {
                setMessage('导入时出错: ' + (error instanceof Error ? error.message : '未知错误'));
            }
        } finally {
            setImporting(false);
            // 清空文件输入
            event.target.value = '';
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

    return (
        <div className="min-h-screen bg-white">
            {/* 操作栏 */}
            <div className="border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-medium text-black">数据库管理</h1>
                        
                        {/* 操作按钮组 */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => createNewTeacher()}
                                disabled={creating}
                                className="px-4 py-2 text-sm border border-gray-300 rounded hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? '创建中...' : '新建导师'}
                            </button>
                            <label className="px-4 py-2 text-sm border border-gray-300 rounded hover:border-black transition-colors cursor-pointer">
                                {importing ? '导入中...' : '批量导入'}
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    disabled={importing}
                                    className="hidden"
                                />
                            </label>
                            <button
                                onClick={initDatabase}
                                disabled={initLoading}
                                className="px-4 py-2 text-sm border border-gray-300 rounded hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {initLoading ? '初始化中...' : '初始化'}
                            </button>
                            <button
                                onClick={fetchStructure}
                                disabled={loading}
                                className="px-4 py-2 text-sm border border-gray-300 rounded hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                刷新
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 消息提示 */}
            {message && (
                <div className="max-w-6xl mx-auto px-6 pt-6">
                    <div className={`p-4 rounded border ${message.includes('成功') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <p className="text-sm">{message}</p>
                    </div>
                </div>
            )}

            {/* 主内容区 */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-4 text-sm text-gray-500">当前地区：{regionName}</div>
                {structure.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400">暂无数据，请先初始化数据库或导入数据</p>
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
                                                                    <div
                                                                        key={teacher._id}
                                                                        className="group relative"
                                                                    >
                                                                        <Link
                                                                            href={`/admin/teachers/${teacher._id}`}
                                                                            className="block"
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
                                                                        {/* 删除按钮 */}
                                                                        {teacher._id && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    deleteTeacher(teacher._id!, teacher.name, university, dept.name);
                                                                                }}
                                                                                disabled={deleting === teacher._id}
                                                                                className="absolute -right-5 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 disabled:opacity-50"
                                                                                title="删除"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {/* 新建导师按钮 */}
                                                                <button
                                                                    onClick={() => createNewTeacher(university, dept.name)}
                                                                    disabled={creating}
                                                                    className="group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    <div className="flex items-baseline space-x-2">
                                                                        <span className="text-gray-400 hover:text-black transition-colors">
                                                                            + 新建
                                                                        </span>
                                                                    </div>
                                                                </button>
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

            {/* 简洁的页脚 */}
            <footer className="border-t border-gray-200 mt-20">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <p className="text-xs text-gray-400 text-center">数据库管理系统</p>
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