"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Teacher } from "@/types/teacher";
import { Comment } from "@/types/comment";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { generateSignatureMessage } from "@/lib/walletAuth";

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

interface TeacherDetailClientProps {
  teacher: Teacher;
}

export default function TeacherDetailClient({ teacher: initialTeacher }: TeacherDetailClientProps) {
  const { publicKey, signMessage } = useWallet();
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);

  const [teacher, setTeacher] = useState<Teacher>(initialTeacher);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [reacting, setReacting] = useState<{ [commentId: string]: 'like' | 'dislike' | null }>({});
  const contentLength = content.trim().length;
  const [avatarError, setAvatarError] = useState(false);

  // 编辑相关状态
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>(initialTeacher);

  const ValueVoteBar = useMemo(() => dynamic(() => import('@/components/ValueVoteBar'), { ssr: false }), []);

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

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        const res = await fetch(`/api/teachers/${teacher._id}/comments`);
        const data = await res.json();
        if (data.success) {
          setComments(data.data.comments as Comment[]);
        }
      } catch (e) {
        console.error("获取评论失败", e);
      } finally {
        setCommentsLoading(false);
      }
    };
    if (teacher._id) fetchComments();
  }, [teacher._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('开始提交评论...', { walletAddress, contentLength, rating });
    
    if (!walletAddress) {
      console.log('没有钱包地址');
      return;
    }
    if (!signMessage) {
      console.log('钱包不支持签名功能');
      alert("钱包不支持签名功能，请使用其他钱包");
      return;
    }
    if (contentLength < 10 || contentLength > 1500) {
      console.log('内容长度不符合要求:', contentLength);
      return;
    }
    if (rating < 1 || rating > 5) {
      console.log('评分无效:', rating);
      return;
    }
    
    try {
      setSubmitting(true);
      console.log('开始签名过程...');
      
      // 生成时间戳和签名消息
      const timestamp = Date.now();
      const message = generateSignatureMessage(walletAddress, timestamp, 'comment');
      console.log('生成的签名消息:', message);
      
      // 请求用户签名
      console.log('请求用户签名...');
      const signature = await signMessage(new TextEncoder().encode(message));
      const signatureBase58 = Buffer.from(signature).toString('base64');
      console.log('签名完成，开始发送请求...');
      
      const res = await fetch(`/api/teachers/${teacher._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          walletAddress, 
          rating, 
          content, 
          signature: signatureBase58,
          timestamp 
        }),
      });
      console.log('请求响应状态:', res.status);
      const data = await res.json();
      console.log('响应数据:', data);
      
      if (data.success) {
        console.log('评论提交成功');
        setContent("");
        setRating(5);
        setComments((prev) => [data.data.comment as Comment, ...prev]);
      } else {
        console.log('评论提交失败:', data.message);
        alert(data.message || "提交失败");
      }
    } catch (e) {
      console.error("提交评论失败", e);
      if (e instanceof Error && e.message.includes('User rejected')) {
        alert("用户取消了签名操作");
      } else {
        alert("提交失败，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 表单处理函数
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 如果修改了头像URL，重置错误状态以便重新尝试加载
    if (name === 'avatar') {
      setAvatarError(false);
    }
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
      setEditMessage(null);

      // 检查钱包连接和签名功能
      if (!publicKey || !signMessage) {
        setEditMessage({ type: 'error', text: '请先连接钱包' });
        return;
      }

      // 生成签名消息
      const timestamp = Date.now();
      const message = generateSignatureMessage(publicKey.toString(), timestamp, 'update-teacher');

      // 请求用户签名
      const signature = await signMessage(new TextEncoder().encode(message));
      const signatureBase64 = Buffer.from(signature).toString('base64');

      const response = await fetch(`/api/teachers/${teacher._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          walletAddress: publicKey.toString(),
          signature: signatureBase64,
          timestamp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTeacher(data.data);
        setFormData(data.data);
        setIsEditing(false);
        setAvatarError(false); // 重置头像错误状态
        setEditMessage({ type: 'success', text: '保存成功！' });
      } else {
        setEditMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('User rejected')) {
        setEditMessage({ type: 'error', text: '用户取消了签名操作' });
      } else {
        setEditMessage({ type: 'error', text: '网络错误，请稍后重试' });
      }
      console.error("保存失败:", err);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": teacher.name,
            "jobTitle": teacher.title,
            "worksFor": {
              "@type": "Organization",
              "name": teacher.university,
              "department": teacher.department
            },
            "email": teacher.email,
            "url": teacher.homepage,
            "image": teacher.avatar || "/images/default-avatar.png",
            "description": teacher.researchAreas && teacher.researchAreas.length > 0 
              ? `研究领域：${teacher.researchAreas.join('、')}`
              : `${teacher.university}${teacher.department ? teacher.department : ''}的${teacher.title || '导师'}`,
            "alumniOf": teacher.education?.map(edu => ({
              "@type": "EducationalOrganization",
              "name": edu.university
            })),
            "knowsAbout": teacher.researchAreas
          })
        }}
      />

      {/* 返回按钮和编辑按钮 */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center text-gray-900 hover:text-black transition-colors text-sm"
            >
              <span className="mr-2">←</span>
              返回导师列表
            </Link>
            <div className="flex gap-2 md:gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 md:px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors text-sm whitespace-nowrap"
                >
                  完善导师信息
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 md:px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors text-sm whitespace-nowrap"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(teacher);
                      setEditMessage(null);
                    }}
                    disabled={saving}
                    className="px-3 md:px-4 py-2 border border-gray-300 text-gray-900 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm whitespace-nowrap"
                  >
                    取消
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 编辑消息提示 */}
      {editMessage && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4">
          <div
            className={`p-4 border text-sm ${
              editMessage.type === 'success'
                ? 'bg-gray-50 border-gray-300 text-gray-900'
                : 'bg-gray-50 border-gray-400 text-gray-900'
            }`}
          >
            {editMessage.text}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-4">
          <ValueVoteBar />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
          {/* 左侧：导师基本信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 p-6 md:p-8 lg:sticky lg:top-8">
              {/* 头像和基本信息 */}
              <div className="text-center mb-8">
                {formData.avatar && !avatarError ? (
                  <Image
                    src={formData.avatar}
                    alt={formData.name || ""}
                    width={120}
                    height={120}
                    className="w-[120px] h-[120px] aspect-square rounded-full object-cover border border-gray-200 mx-auto mb-6"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div
                    className={`w-[120px] h-[120px] rounded-full mx-auto mb-6 flex items-center justify-center ${getColorFromName(
                      formData.name || ""
                    )}`}
                  >
                    <span className="text-white text-4xl font-light">
                      {getInitial(formData.name || "")}
                    </span>
                  </div>
                )}
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
            </div>
          </div>

          {/* 右侧：详细信息 */}
          <div className="lg:col-span-2 space-y-8 md:space-y-12">
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

            {/* 评论列表 */}
            <div>
              <h2 className="text-xs font-medium text-gray-600 mb-6 uppercase tracking-wider">评论</h2>
              {commentsLoading ? (
                <div className="text-sm text-gray-500">加载评论中...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-gray-500">还没有评论，快来写第一条吧。</div>
              ) : (
                <div className="space-y-6">
                  {comments.map((c: Comment) => {
                    const lowered = walletAddress.toLowerCase();
                    const userReaction = !walletAddress ? null : (
                      c.likedBy?.some(addr => addr === lowered) ? 'like'
                      : c.dislikedBy?.some(addr => addr === lowered) ? 'dislike'
                      : null
                    );
                    const likeCount = c.likeCount ?? (c.likedBy?.length ?? 0);
                    const dislikeCount = c.dislikeCount ?? (c.dislikedBy?.length ?? 0);

                    const react = async (type: 'like' | 'dislike') => {
                      if (!walletAddress) return alert('请先连接钱包');
                      if (!signMessage) {
                        alert("钱包不支持签名功能，请使用其他钱包");
                        return;
                      }
                      
                      // 防止重复点击
                      if (reacting[c._id]) return;
                      
                      try {
                        setReacting(prev => ({ ...prev, [c._id]: type }));
                        
                        const isCancel = userReaction === type;
                        const method = isCancel ? 'DELETE' : 'POST';
                        const endpoint = `/api/teachers/${teacher._id}/comments/${c._id}/${type}`;
                        
                        // 生成时间戳和签名消息
                        const timestamp = Date.now();
                        const action = isCancel ? `un${type}` : type;
                        const message = generateSignatureMessage(walletAddress, timestamp, action);
                        
                        // 请求用户签名
                        const signature = await signMessage(new TextEncoder().encode(message));
                        const signatureBase58 = Buffer.from(signature).toString('base64');
                        
                        const res = await fetch(endpoint, {
                          method,
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            walletAddress, 
                            signature: signatureBase58,
                            timestamp 
                          })
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!data?.success) {
                          alert(data?.message || '操作失败');
                          return;
                        }
                        // 重新拉取评论以更新计数与状态
                        try {
                          setCommentsLoading(true);
                          const r = await fetch(`/api/teachers/${teacher._id}/comments`);
                          const d = await r.json();
                          if (d.success) setComments(d.data.comments as Comment[]);
                        } finally {
                          setCommentsLoading(false);
                        }
                      } catch (e) {
                        console.error('操作失败', e);
                        if (e instanceof Error && e.message.includes('User rejected')) {
                          alert("用户取消了签名操作");
                        } else {
                          alert("操作失败，请稍后重试");
                        }
                      } finally {
                        setReacting(prev => ({ ...prev, [c._id]: null }));
                      }
                    };

                    return (
                      <div key={c._id} className="border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-h-[16px]">
                            {c.source !== 'imported' && (
                              <span className="text-xs text-gray-500 break-all">{c.walletAddress}</span>
                            )}
                            {c.source === 'imported' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200">
                                来自外部{c.importedFrom ? ` · ${c.importedFrom}` : ''}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-900">评分 {c.rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                        <div className="text-[11px] text-gray-400 mt-2">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={() => react('like')}
                            className={`text-xs px-2 py-1 border inline-flex items-center gap-1.5 transition-colors ${userReaction === 'like' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-900 hover:bg-gray-50'} ${reacting[c._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!walletAddress || !!reacting[c._id]}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>赞 {likeCount}</span>
                          </button>
                          <button
                            onClick={() => react('dislike')}
                            className={`text-xs px-2 py-1 border inline-flex items-center gap-1.5 transition-colors ${userReaction === 'dislike' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-900 hover:bg-gray-50'} ${reacting[c._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!walletAddress || !!reacting[c._id]}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>踩 {dislikeCount}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 提交评论 */}
            <div>
              <h2 className="text-xs font-medium text-gray-600 mb-6 uppercase tracking-wider">写评论</h2>
              {!walletAddress ? (
                <div className="text-sm text-gray-500">请先使用右上角按钮连接钱包后再评论。</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-xs text-gray-500">当前钱包：<span className="break-all">{walletAddress}</span></div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">评分</label>
                    <select
                      className="border border-gray-300 px-3 py-2 text-sm w-[120px]"
                      value={rating}
                      onChange={(e) => setRating(parseInt(e.target.value, 10))}
                    >
                      {[1,2,3,4,5].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">评语（10-1500字）</label>
                    <textarea
                      className="w-full border border-gray-300 p-3 text-sm min-h-[120px]"
                      placeholder="请分享你的真实体验与建议，10-1500字"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    <div className={`text-xs mt-1 ${contentLength < 10 || contentLength > 1500 ? 'text-red-500' : 'text-gray-400'}`}>
                      {contentLength}/1500
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !walletAddress || contentLength < 10 || contentLength > 1500}
                    className="px-4 py-2 bg-black text-white text-sm disabled:opacity-50"
                  >
                    {submitting ? '签名并提交中...' : '签名并提交评论'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
