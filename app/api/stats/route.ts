import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';
import CommentModel from '@/models/Comment';

export async function GET() {
  try {
    await connectDB();

    const [teacherCount, commentCount] = await Promise.all([
      // 统计启用中的教师数量（isActive 未显式为 false 即视为有效）
      TeacherModel.countDocuments({ isActive: { $ne: false } }),
      CommentModel.countDocuments({}),
    ]);

    const avg = teacherCount > 0 ? commentCount / teacherCount : 0;

    return NextResponse.json({
      success: true,
      data: {
        teacherCount,
        commentCount,
        avgCommentsPerTeacher: Number(avg.toFixed(4)),
      },
    }, {
      headers: {
        // 允许在边缘缓存短暂缓存，同时支持再验证，亦可被前端轮询刷新
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ success: false, error: '获取统计数据失败' }, { status: 500 });
  }
}


