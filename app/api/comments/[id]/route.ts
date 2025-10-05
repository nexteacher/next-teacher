import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommentModel from '@/models/Comment';
import TeacherModel from '@/models/Teacher';

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // 查找评论
    const comment = await CommentModel.findById(id).lean() as CommentDoc | null;
    
    if (!comment) {
      return NextResponse.json(
        { success: false, message: '评论不存在' },
        { status: 404 }
      );
    }

    // 查找关联的导师信息
    const teacher = await TeacherModel.findById(comment.teacher).lean() as TeacherDoc | null;
    
    if (!teacher) {
      return NextResponse.json(
        { success: false, message: '关联的导师不存在' },
        { status: 404 }
      );
    }

    // 计算点赞和点踩数量
    const likeCount = comment.likedBy?.length ?? 0;
    const dislikeCount = comment.dislikedBy?.length ?? 0;

    // 返回评论和导师信息
    return NextResponse.json({
      success: true,
      data: {
        comment: {
          _id: comment._id.toString(),
          teacher: comment.teacher.toString(),
          walletAddress: comment.walletAddress,
          rating: comment.rating,
          content: comment.content,
          source: comment.source || 'user',
          importedFrom: comment.importedFrom,
          likeCount,
          dislikeCount,
          createdAt: comment.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: comment.updatedAt?.toISOString() || comment.createdAt?.toISOString() || new Date().toISOString(),
        },
        teacher: {
          _id: teacher._id.toString(),
          name: teacher.name,
          title: teacher.title,
          university: teacher.university,
          department: teacher.department,
          avatar: teacher.avatar,
        }
      }
    });
  } catch (error) {
    console.error('获取评论详情失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

