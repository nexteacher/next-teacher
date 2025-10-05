"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Teacher } from "@/types/teacher";
import { Comment } from "@/types/comment";
import { useWallet } from '@solana/wallet-adapter-react';
import { generateSignatureMessage } from '@/lib/walletAuth';

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

interface TeacherDetailResponse {
  success: boolean;
  data: {
    teacher: Teacher;
  };
}

export default function AdminTeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const { publicKey, signMessage } = useWallet();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<Partial<Teacher>>({});

  useEffect(() => {
    const fetchTeacherDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teachers/${teacherId}`);
        const data: TeacherDetailResponse = await response.json();

        if (data.success) {
          setTeacher(data.data.teacher);
          setFormData(data.data.teacher);
        } else {
          setError("获取导师详情失败");
        }
      } catch (err) {
        setError("网络错误，请稍后重试");
        console.error("获取导师详情失败:", err);
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacherDetail();
      // 加载该导师的评论
      (async () => {
        try {
          setCommentsLoading(true);
          const res = await fetch(`/api/teachers/${teacherId}/comments`, { cache: 'no-store' });
          const data = await res.json();
          if (data.success) {
            setComments(data.data.comments as Comment[]);
          }
        } catch {
          // 忽略错误，仅不显示评论
        } finally {
          setCommentsLoading(false);
        }
      })();
    }
  }, [teacherId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleStringArrayChange = (index: number, value: string) => {
    setFormData((prev) => {
      const array = [...(prev.researchAreas || [])];
      array[index] = value;
      return { ...prev, researchAreas: array };
    });
  };

  const addStringArrayItem = () => {
    setFormData((prev) => ({
      ...prev,
      researchAreas: [...(prev.researchAreas || []), ""]
    }));
  };

  const removeStringArrayItem = (index: number) => {
    setFormData((prev) => {
      const array = [...(prev.researchAreas || [])];
      array.splice(index, 1);
      return { ...prev, researchAreas: array };
    });
  };

  const handleArrayInputChange = (field: string, index: number, key: string, value: string | number | undefined) => {
    setFormData((prev) => {
      const array = [...((prev[field as keyof Teacher] as unknown as Record<string, string | number | undefined>[]) || [])];
      array[index] = { ...array[index], [key]: value };
      return { ...prev, [field]: array };
    });
  };

  const addArrayItem = (field: string, emptyItem: Record<string, string | number | undefined>) => {
    setFormData((prev) => {
      const array = [...((prev[field as keyof Teacher] as unknown as Record<string, string | number | undefined>[]) || [])];
      array.push(emptyItem);
      return { ...prev, [field]: array };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => {
      const array = [...((prev[field as keyof Teacher] as unknown as Record<string, string | number | undefined>[]) || [])];
      array.splice(index, 1);
      return { ...prev, [field]: array };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // 检查钱包连接和签名功能
      if (!publicKey || !signMessage) {
        setMessage({ type: 'error', text: '请先连接钱包' });
        return;
      }

      // 生成签名消息
      const timestamp = Date.now();
      const message = generateSignatureMessage(publicKey.toString(), timestamp, 'admin-update-teacher');

      // 请求用户签名
      const signature = await signMessage(new TextEncoder().encode(message));
      const signatureBase64 = Buffer.from(signature).toString('base64');

      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          walletAddress: publicKey.toString(),
          signature: signatureBase64,
          timestamp,
          actionType: 'admin-update-teacher',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTeacher(data.data);
        setFormData(data.data);
        setIsEditing(false);
        setMessage({ type: 'success', text: '保存成功！' });
      } else {
        setMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('User rejected')) {
        setMessage({ type: 'error', text: '用户取消了签名操作' });
      } else {
        setMessage({ type: 'error', text: '网络错误，请稍后重试' });
      }
      console.error("保存失败:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这位导师吗？此操作将直接从数据库移除，且不可恢复。")) {
      return;
    }

    try {
      // 检查钱包连接和签名功能
      if (!publicKey || !signMessage) {
        setMessage({ type: 'error', text: '请先连接钱包' });
        return;
      }

      // 生成签名消息
      const timestamp = Date.now();
      const message = generateSignatureMessage(publicKey.toString(), timestamp, 'delete-teacher');

      // 请求用户签名
      const signature = await signMessage(new TextEncoder().encode(message));
      const signatureBase64 = Buffer.from(signature).toString('base64');

      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          signature: signatureBase64,
          timestamp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '删除成功，即将返回...' });
        setTimeout(() => {
          router.push("/admin/database");
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || '删除失败' });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('User rejected')) {
        setMessage({ type: 'error', text: '用户取消了签名操作' });
      } else {
        setMessage({ type: 'error', text: '网络错误，请稍后重试' });
      }
      console.error("删除失败:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？此操作不可恢复。')) return;
    try {
      setDeletingCommentId(commentId);
      
      // 检查钱包连接和签名功能
      if (!publicKey || !signMessage) {
        setMessage({ type: 'error', text: '请先连接钱包' });
        return;
      }

      // 生成签名消息
      const timestamp = Date.now();
      const message = generateSignatureMessage(publicKey.toString(), timestamp, 'admin-delete-comment');

      // 请求用户签名
      const signature = await signMessage(new TextEncoder().encode(message));
      const signatureBase64 = Buffer.from(signature).toString('base64');

      const res = await fetch(`/api/teachers/${teacherId}/comments/${commentId}`, { 
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          signature: signatureBase64,
          timestamp,
          actionType: 'admin-delete-comment',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.filter(c => c._id !== commentId));
        setMessage({ type: 'success', text: '评论已删除' });
      } else {
        setMessage({ type: 'error', text: data.message || '删除评论失败' });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('User rejected')) {
        setMessage({ type: 'error', text: '用户取消了签名操作' });
      } else {
        setMessage({ type: 'error', text: '网络错误，删除失败' });
      }
    } finally {
      setDeletingCommentId(null);
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

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-6">{error || "导师信息不存在"}</p>
          <Link
            href="/admin/database"
            className="inline-block px-4 py-2 border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors text-sm"
          >
            返回管理页面
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 操作栏 */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/admin/database"
              className="inline-flex items-center text-gray-900 hover:text-black transition-colors text-sm"
            >
              <span className="mr-2">←</span>
              返回管理页面
            </Link>
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors text-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors text-sm"
                  >
                    签名并删除
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors text-sm"
                  >
                    {saving ? "签名并保存中..." : "签名并保存"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(teacher);
                      setMessage(null);
                    }}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-gray-900 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm"
                  >
                    取消
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div
            className={`p-4 border text-sm ${
              message.type === 'success'
                ? 'bg-gray-50 border-gray-300 text-gray-900'
                : 'bg-gray-50 border-gray-400 text-gray-900'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 左侧：导师基本信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 p-8 sticky top-8">
              {/* 头像和基本信息 */}
              <div className="text-center mb-8">
                <Image
                  src={formData.avatar || "/images/default-avatar.png"}
                  alt={formData.name || ""}
                  width={120}
                  height={120}
                  className="w-[120px] h-[120px] aspect-square rounded-full object-cover border border-gray-200 mx-auto mb-6"
                />
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-center font-light text-xl text-black focus:outline-none focus:border-black"
                      placeholder="姓名"
                    />
                    <input
                      type="text"
                      name="title"
                      value={formData.title || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-center text-sm text-gray-600 focus:outline-none focus:border-black"
                      placeholder="职称"
                    />
                    <input
                      type="text"
                      name="university"
                      value={formData.university || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-center text-sm text-gray-900 font-medium focus:outline-none focus:border-black"
                      placeholder="大学"
                    />
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-center text-sm text-gray-500 focus:outline-none focus:border-black"
                      placeholder="院系"
                    />
                    <select
                      name="region"
                      value={formData.region || 'CN'}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-center text-sm text-gray-500 focus:outline-none focus:border-black"
                    >
                      {Object.entries(REGION_MAP).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="avatar"
                      value={formData.avatar || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-xs text-gray-600 focus:outline-none focus:border-black"
                      placeholder="头像URL"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-light text-black mb-2">
                      {teacher.name}
                    </h1>
                    <p className="text-sm text-gray-600 mb-1">{teacher.title}</p>
                    <p className="text-sm text-gray-900 font-medium mt-4">
                      {teacher.university}
                    </p>
                    <p className="text-sm text-gray-500">{teacher.department}</p>
                    {teacher.region && (
                      <p className="text-xs text-gray-400 mt-2">
                        📍 {REGION_MAP[teacher.region] || teacher.region}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* 联系信息 */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-xs font-medium text-gray-600 mb-4 uppercase tracking-wider">联系方式</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">邮箱</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                        placeholder="邮箱"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">主页</label>
                      <input
                        type="url"
                        name="homepage"
                        value={formData.homepage || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                        placeholder="个人主页URL"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {teacher.email && (
                      <div>
                        <span className="text-gray-400 text-xs block mb-1">邮箱</span>
                        <a
                          href={`mailto:${teacher.email}`}
                          className="text-gray-900 hover:text-black transition-colors"
                        >
                          {teacher.email}
                        </a>
                      </div>
                    )}
                    {teacher.homepage && (
                      <div>
                        <span className="text-gray-400 text-xs block mb-1">主页</span>
                        <a
                          href={teacher.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 hover:text-black transition-colors break-all"
                        >
                          {teacher.homepage}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 系统信息 */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-xs font-medium text-gray-600 mb-4 uppercase tracking-wider">系统信息</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-2">在职状态</label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive || false}
                          onChange={handleCheckboxChange}
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-sm text-gray-900">{formData.isActive ? '在职' : '离职'}</span>
                      </label>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-2">数据来源</label>
                      <select
                        name="source"
                        value={formData.source || 'admin'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                      >
                        <option value="user">用户提交</option>
                        <option value="admin">管理员添加</option>
                        <option value="imported">导入</option>
                      </select>
                    </div>
                    {formData.source === 'imported' && (
                      <div>
                        <label className="text-xs text-gray-400 block mb-2">导入来源</label>
                        <input
                          type="text"
                          name="importedFrom"
                          value={formData.importedFrom || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="导入来源URL或描述"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">状态</span>
                      <span className={`px-2 py-1 text-xs ${teacher.isActive ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-600'}`}>
                        {teacher.isActive ? '在职' : '离职'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">来源</span>
                      <span className="text-gray-900 text-xs">
                        {teacher.source === 'user' ? '用户提交' : teacher.source === 'admin' ? '管理员' : '导入'}
                      </span>
                    </div>
                    {teacher.importedFrom && (
                      <div className="pt-3 border-t border-gray-200">
                        <span className="text-gray-400 text-xs block mb-1">导入自</span>
                        <span className="text-gray-600 text-xs break-all">{teacher.importedFrom}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：详细信息 */}
          <div className="lg:col-span-2 space-y-12">
            {/* 研究领域 */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-medium text-gray-600 uppercase tracking-wider">研究领域</h2>
                {isEditing && (
                  <button
                    onClick={addStringArrayItem}
                    className="px-3 py-1 bg-black text-white text-xs hover:bg-gray-800 transition-colors"
                  >
                    + 添加
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  {(formData.researchAreas || []).length === 0 ? (
                    <p className="text-sm text-gray-400">暂无研究领域，点击添加按钮添加</p>
                  ) : (
                    (formData.researchAreas || []).map((area, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => handleStringArrayChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="研究领域"
                        />
                        <button
                          onClick={() => removeStringArrayItem(index)}
                          className="px-3 py-2 border border-gray-300 text-gray-900 text-sm hover:bg-gray-50 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(teacher.researchAreas || []).length === 0 ? (
                    <p className="text-sm text-gray-400">暂无研究领域</p>
                  ) : (
                    (teacher.researchAreas || []).map((area, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-900 text-sm"
                      >
                        {area}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 教育背景 */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-medium text-gray-600 uppercase tracking-wider">教育背景</h2>
                {isEditing && (
                  <button
                    onClick={() =>
                      addArrayItem("education", {
                        degree: "",
                        major: "",
                        university: "",
                        year: new Date().getFullYear(),
                      })
                    }
                    className="px-3 py-1 bg-black text-white text-xs hover:bg-gray-800 transition-colors"
                  >
                    + 添加
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {(formData.education || []).map((edu, index) => (
                  <div
                    key={index}
                    className="border-l-2 border-gray-300 pl-6 relative"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            handleArrayInputChange(
                              "education",
                              index,
                              "degree",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="学位"
                        />
                        <input
                          type="text"
                          value={edu.major}
                          onChange={(e) =>
                            handleArrayInputChange(
                              "education",
                              index,
                              "major",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="专业"
                        />
                        <input
                          type="text"
                          value={edu.university}
                          onChange={(e) =>
                            handleArrayInputChange(
                              "education",
                              index,
                              "university",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="大学"
                        />
                        <input
                          type="number"
                          value={edu.year}
                          onChange={(e) =>
                            handleArrayInputChange(
                              "education",
                              index,
                              "year",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="年份"
                        />
                        <button
                          onClick={() => removeArrayItem("education", index)}
                          className="absolute top-0 right-0 text-gray-600 hover:text-black text-sm"
                        >
                          删除
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-gray-900">
                          {edu.degree} · {edu.major}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{edu.university}</div>
                        <div className="text-xs text-gray-400 mt-1">{edu.year}年</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 工作经历 */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-medium text-gray-600 uppercase tracking-wider">工作经历</h2>
                {isEditing && (
                  <button
                    onClick={() =>
                      addArrayItem("experience", {
                        position: "",
                        institution: "",
                        startYear: new Date().getFullYear(),
                        endYear: undefined,
                        description: "",
                      })
                    }
                    className="px-3 py-1 bg-black text-white text-xs hover:bg-gray-800 transition-colors"
                  >
                    + 添加
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {(formData.experience || []).map((exp, index) => (
                  <div
                    key={index}
                    className="border-l-2 border-gray-300 pl-6 relative"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) =>
                            handleArrayInputChange(
                              "experience",
                              index,
                              "position",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="职位"
                        />
                        <input
                          type="text"
                          value={exp.institution}
                          onChange={(e) =>
                            handleArrayInputChange(
                              "experience",
                              index,
                              "institution",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="机构"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={exp.startYear}
                            onChange={(e) =>
                              handleArrayInputChange(
                                "experience",
                                index,
                                "startYear",
                                parseInt(e.target.value)
                              )
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                            placeholder="开始年份"
                          />
                          <input
                            type="number"
                            value={exp.endYear || ""}
                            onChange={(e) =>
                              handleArrayInputChange(
                                "experience",
                                index,
                                "endYear",
                                e.target.value ? parseInt(e.target.value) : undefined
                              )
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                            placeholder="结束年份（可选）"
                          />
                        </div>
                        <textarea
                          value={exp.description || ""}
                          onChange={(e) =>
                            handleArrayInputChange(
                              "experience",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          placeholder="工作描述（可选）"
                          rows={2}
                        />
                        <button
                          onClick={() => removeArrayItem("experience", index)}
                          className="absolute top-0 right-0 text-gray-600 hover:text-black text-sm"
                        >
                          删除
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-gray-900">
                          {exp.position}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{exp.institution}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {exp.startYear}年 -{" "}
                          {exp.endYear ? `${exp.endYear}年` : "至今"}
                        </div>
                        {exp.description && (
                          <div className="text-sm text-gray-700 mt-2">
                            {exp.description}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 评论管理 */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-medium text-gray-600 uppercase tracking-wider">评论管理</h2>
              </div>
              {commentsLoading ? (
                <div className="text-sm text-gray-400">加载评论中...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-gray-400">暂无评论</div>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => {
                    const likeCount = c.likeCount ?? (c.likedBy?.length ?? 0);
                    const dislikeCount = c.dislikeCount ?? (c.dislikedBy?.length ?? 0);
                    return (
                      <div key={c._id} className="border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            {c.source === 'imported' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200">
                                来自外部{c.importedFrom ? ` · ${c.importedFrom}` : ''}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            disabled={deletingCommentId === c._id}
                            className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                          >
                            {deletingCommentId === c._id ? '签名并删除中...' : '签名并删除'}
                          </button>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">评分：{c.rating} / 5</div>
                        {c.source !== 'imported' && (
                          <div className="text-xs text-gray-400 mt-1 break-all">{c.walletAddress}</div>
                        )}
                        <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap leading-6">
                          {c.content}
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">👍 {likeCount} · 👎 {dislikeCount}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}