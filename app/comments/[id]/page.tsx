import { Metadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import CommentModel from "@/models/Comment";
import TeacherModel from "@/models/Teacher";
import CommentDetailClient from "./CommentDetailClient";
import { Comment } from "@/types/comment";

interface Teacher {
  _id: string;
  name: string;
  title?: string;
  university: string;
  department?: string;
  avatar?: string;
}

interface CommentDoc {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teacher: any;
  walletAddress: string;
  rating: number;
  content: string;
  source?: string;
  importedFrom?: string;
  likedBy?: string[];
  dislikedBy?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeacherDoc {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any;
  name: string;
  title?: string;
  university: string;
  department?: string;
  avatar?: string;
}

// 生成动态元数据
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    await connectDB();
    const { id } = await params;
    
    const comment = await CommentModel.findById(id).lean() as CommentDoc | null;
    
    if (!comment) {
      return {
        title: "评论不存在 - NexTeacher",
        description: "您查找的评论不存在"
      };
    }

    const teacher = await TeacherModel.findById(comment.teacher).lean() as TeacherDoc | null;
    
    if (!teacher) {
      return {
        title: "评论详情 - NexTeacher",
        description: "查看评论详细内容"
      };
    }

    const title = `${teacher.name}的评论 - NexTeacher`;
    const contentPreview = comment.content.length > 100 
      ? `${comment.content.substring(0, 100)}...` 
      : comment.content;
    const description = `${teacher.name}（${teacher.university}）的评论：${contentPreview}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        siteName: 'NexTeacher - 导师 Wiki'
      },
      twitter: {
        card: 'summary',
        title,
        description
      },
      alternates: {
        canonical: `https://nexteacher.wiki/comments/${comment._id}`
      }
    };
  } catch (error) {
    console.error('生成元数据失败:', error);
    return {
      title: "评论详情 - NexTeacher",
      description: "查看评论详细内容"
    };
  }
}

export default async function CommentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const comment = await CommentModel.findById(id).lean() as CommentDoc | null;
    
    if (!comment) {
      notFound();
    }

    const teacher = await TeacherModel.findById(comment.teacher).lean() as TeacherDoc | null;
    
    if (!teacher) {
      notFound();
    }

    // 计算点赞和点踩数量
    const likeCount = comment.likedBy?.length ?? 0;
    const dislikeCount = comment.dislikedBy?.length ?? 0;

    // 规范化来源字段，限定为联合类型
    const normalizedSource: 'user' | 'admin' | 'imported' =
      comment.source === 'admin' || comment.source === 'imported' ? comment.source : 'user';

    // 序列化评论数据
    const serializedComment: Comment = {
      _id: comment._id.toString(),
      teacher: comment.teacher.toString(),
      walletAddress: comment.walletAddress,
      rating: comment.rating,
      content: comment.content,
      source: normalizedSource,
      importedFrom: comment.importedFrom,
      likeCount,
      dislikeCount,
      createdAt: comment.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: comment.updatedAt?.toISOString() || comment.createdAt?.toISOString() || new Date().toISOString(),
    };

    // 序列化导师数据
    const serializedTeacher: Teacher = {
      _id: teacher._id.toString(),
      name: teacher.name,
      title: teacher.title,
      university: teacher.university,
      department: teacher.department,
      avatar: teacher.avatar,
    };

    return <CommentDetailClient comment={serializedComment} teacher={serializedTeacher} />;
  } catch (error) {
    console.error('获取评论详情失败:', error);
    notFound();
  }
}

