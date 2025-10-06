"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import RegionSelector from "@/components/RegionSelector";

// 地区代码映射
const REGION_MAP: { [key: string]: string } = {
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

// Cookie 辅助函数
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// 根据名字生成颜色
const getColorFromName = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

// 获取名字的首字
const getInitial = (name: string) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

interface TeacherWithRating {
  _id: string;
  name: string;
  title?: string;
  university: string;
  department?: string;
  region: string;
  avatar?: string;
  averageRating: number;
  commentCount: number;
}

export default function TeachersRankingPage() {
  const [topTeachers, setTopTeachers] = useState<TeacherWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRegion, setCurrentRegion] = useState<{ code: string; name: string }>({ 
    code: 'CN', 
    name: '中国大陆' 
  });

  // 获取榜单数据
  const fetchTopTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const region = getCookie('region') || 'CN';
      const response = await fetch(`/api/teachers/top-rated?region=${region}`, {
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTopTeachers(data.data.teachers);
        setCurrentRegion({
          code: region,
          name: REGION_MAP[region] || region
        });
      } else {
        setError('获取榜单失败');
      }
    } catch (err) {
      console.error('Error fetching top teachers:', err);
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopTeachers();
  }, []);

  // 监听地区变化 - RegionSelector 会刷新页面，所以这里会重新加载
  useEffect(() => {
    const region = getCookie('region') || 'CN';
    if (region !== currentRegion.code) {
      fetchTopTeachers();
    }
  }, [currentRegion.code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* 页头骨架 */}
        <div className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="h-4 w-20 bg-gray-200 animate-pulse mb-4"></div>
            <div className="h-10 w-64 bg-gray-200 animate-pulse mb-3"></div>
            <div className="h-5 w-96 bg-gray-200 animate-pulse"></div>
          </div>
        </div>

        {/* 内容骨架 */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="mb-6">
            <div className="h-10 w-40 bg-gray-200 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="border border-gray-200 p-4 md:p-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="flex-shrink-0 w-12 md:w-16">
                    <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-200 animate-pulse"></div>
                  </div>
                  <div className="flex-grow min-w-0 space-y-2">
                    <div className="h-6 w-32 bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-48 bg-gray-200 animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-200 animate-pulse"></div>
                  </div>
                  <div className="flex-shrink-0 text-right space-y-2">
                    <div className="h-8 w-16 bg-gray-200 animate-pulse ml-auto"></div>
                    <div className="h-3 w-20 bg-gray-200 animate-pulse ml-auto"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTopTeachers}
            className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 页头 */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-gray-900 hover:text-black transition-colors text-sm"
            >
              <span className="mr-2">←</span>
              返回首页
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-black mb-3">
            榜单
          </h1>

          
          {/* 地区选择器 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
            <div className="text-sm text-gray-500">
              当前地区：<span className="font-medium text-gray-900">{currentRegion.name}</span>
              {topTeachers.length > 0 && (
                <span className="ml-2 text-gray-400">
                  ({topTeachers.length} 位上榜教师)
                </span>
              )}
            </div>
            <RegionSelector />
          </div>
        </div>
      </div>

      {/* 榜单内容 */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {topTeachers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">暂无评分数据</p>
            <p className="text-gray-400 text-sm mt-2">快去为你的导师写评价吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topTeachers.map((teacher, index) => (
              <Link
                key={teacher._id}
                href={`/teachers/${teacher._id}`}
                className="block border border-gray-200 hover:border-gray-400 transition-colors"
              >
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-4 md:gap-6">
                    {/* 排名 */}
                    <div className="flex-shrink-0 w-12 md:w-16 text-center">
                      <div
                        className={`text-2xl md:text-3xl font-light ${
                          index === 0
                            ? 'text-yellow-600'
                            : index === 1
                            ? 'text-gray-400'
                            : index === 2
                            ? 'text-orange-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* 头像 */}
                    <div className="flex-shrink-0">
                      {teacher.avatar ? (
                        <Image
                          src={teacher.avatar}
                          alt={teacher.name}
                          width={60}
                          height={60}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center ${getColorFromName(
                            teacher.name
                          )}`}
                        >
                          <span className="text-white text-xl md:text-2xl font-light">
                            {getInitial(teacher.name)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 教师信息 */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
                        <h2 className="text-lg md:text-xl font-medium text-black">
                          {teacher.name}
                        </h2>
                        {teacher.title && (
                          <span className="text-xs md:text-sm text-gray-600">
                            {teacher.title}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs md:text-sm text-gray-600">
                        {teacher.university}
                        {teacher.department && ` · ${teacher.department}`}
                      </div>
                      {teacher.region && (
                        <div className="mt-1 text-xs text-gray-400">
                          📍 {REGION_MAP[teacher.region] || teacher.region}
                        </div>
                      )}
                    </div>

                    {/* 评分信息 */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl md:text-3xl font-light text-black">
                        {teacher.averageRating.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {teacher.commentCount} 条评价
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 页脚说明 */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>榜单根据学生真实评价计算，只统计未被折叠的有效评论</p>
          <p>评分相同时，按评论数量排序</p>
          <p className="text-xs text-gray-400">可切换地区查看不同地区的优秀导师</p>
        </div>
      </div>
    </div>
  );
}

