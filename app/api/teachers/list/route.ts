import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';

// 缓存配置
export const revalidate = 300; // 5分钟缓存

export async function GET() {
  try {
    await connectDB();

    // 只查询必要的字段,提升性能
    const teachers = await TeacherModel.find(
      { isActive: true },
      {
        _id: 1,
        name: 1,
        title: 1,
        university: 1,
        department: 1
      }
    )
    .sort({ university: 1, department: 1, name: 1 })
    .lean();

    return NextResponse.json({
      success: true,
      data: teachers
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('获取教师列表失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取教师列表失败' 
      },
      { status: 500 }
    );
  }
}