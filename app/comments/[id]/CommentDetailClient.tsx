"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Comment } from "@/types/comment";
import { useWallet } from "@solana/wallet-adapter-react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { generateSignatureMessage } from "@/lib/walletAuth";

interface Teacher {
  _id: string;
  name: string;
  title?: string;
  university: string;
  department?: string;
  avatar?: string;
}

interface CommentDetailClientProps {
  comment: Comment;
  teacher: Teacher;
}

export default function CommentDetailClient({ comment: initialComment, teacher }: CommentDetailClientProps) {
  const { publicKey, signMessage } = useWallet();
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);
  
  const [comment, setComment] = useState<Comment>(initialComment);
  const [reacting, setReacting] = useState<'like' | 'dislike' | null>(null);

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

  const likeCount = comment.likeCount ?? 0;
  const dislikeCount = comment.dislikeCount ?? 0;

  const react = async (type: 'like' | 'dislike') => {
    if (!walletAddress) return alert('请先连接钱包');
    if (!signMessage) {
      alert("钱包不支持签名功能，请使用其他钱包");
      return;
    }
    
    // 防止重复点击
    if (reacting) return;
    
    try {
      setReacting(type);
      
      // 检查当前的反应状态（需要从服务器获取最新状态或从评论详情中判断）
      // 这里简化处理，假设第一次点击都是添加反应
      const method = 'POST';
      const endpoint = `/api/teachers/${comment.teacher}/comments/${comment._id}/${type}`;
      
      // 生成时间戳和签名消息
      const timestamp = Date.now();
      const message = generateSignatureMessage(walletAddress, timestamp, type);
      
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
      
      // 重新获取评论详情以更新计数
      const refreshRes = await fetch(`/api/comments/${comment._id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setComment(refreshData.data.comment);
      }
    } catch (e) {
      console.error('操作失败', e);
      if (e instanceof Error && e.message.includes('User rejected')) {
        alert("用户取消了签名操作");
      } else {
        alert("操作失败，请稍后重试");
      }
    } finally {
      setReacting(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 返回按钮 */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <Link
            href={`/teachers/${teacher._id}`}
            className="inline-flex items-center text-gray-900 hover:text-black transition-colors text-sm"
          >
            <span className="mr-2">←</span>
            返回导师详情
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 导师信息卡片 */}
        <div className="bg-white border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            {teacher.avatar ? (
              <Image
                src={teacher.avatar}
                alt={teacher.name}
                width={60}
                height={60}
                className="w-[60px] h-[60px] aspect-square rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center ${getColorFromName(
                  teacher.name
                )}`}
              >
                <span className="text-white text-2xl font-light">
                  {getInitial(teacher.name)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-light text-black mb-1">
                <Link href={`/teachers/${teacher._id}`} className="hover:underline">
                  {teacher.name}
                </Link>
              </h2>
              <p className="text-sm text-gray-600">{teacher.title}</p>
              <p className="text-sm text-gray-900 font-medium mt-1">
                {teacher.university}
                {teacher.department && ` · ${teacher.department}`}
              </p>
            </div>
          </div>
        </div>

        {/* 评论详情 */}
        <div className="bg-white border border-gray-200 p-6 md:p-8">
          <h1 className="text-2xl font-light text-black mb-6">评论详情</h1>
          
          <div className="space-y-4">
            {/* 评论元信息 */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {comment.source !== 'imported' ? (
                  <span className="text-xs text-gray-500 break-all">{comment.walletAddress}</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200">
                    来自外部{comment.importedFrom ? ` · ${comment.importedFrom}` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-900">评分：{comment.rating}/5</span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 评论内容 */}
            <div className="py-4">
              <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>

            {/* 点赞/点踩 */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => react('like')}
                  className={`text-sm px-3 py-2 border inline-flex items-center gap-2 transition-colors ${
                    reacting === 'like' ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                  disabled={!walletAddress || !!reacting}
                >
                  <ThumbsUp className="w-4 h-4" strokeWidth={2} />
                  <span>赞 {likeCount}</span>
                </button>
                <button
                  onClick={() => react('dislike')}
                  className={`text-sm px-3 py-2 border inline-flex items-center gap-2 transition-colors ${
                    reacting === 'dislike' ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                  disabled={!walletAddress || !!reacting}
                >
                  <ThumbsDown className="w-4 h-4" strokeWidth={2} />
                  <span>踩 {dislikeCount}</span>
                </button>
              </div>
              {!walletAddress && (
                <p className="text-xs text-gray-500 mt-3">请连接钱包后进行点赞/点踩操作</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

