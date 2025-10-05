import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';
import { cookies } from 'next/headers';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 缓存配置
export const revalidate = 300; // 5分钟缓存

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 从查询参数获取学校和院系
    const searchParams = request.nextUrl.searchParams;
    const university = searchParams.get('university');
    const department = searchParams.get('department');

    if (!university || !department) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: university 和 department' },
        { status: 400 }
      );
    }

    // 读取地区，默认 CN（中国大陆）
    const cookieStore = await cookies();
    const region = cookieStore.get('region')?.value || 'CN';

    // 查询该院系的所有教师,只返回必要字段，按地区过滤
    const teachers = await TeacherModel.find(
      {
        university,
        department,
        region, // 添加地区过滤
        isActive: { $ne: false }
      },
      {
        _id: 1,
        name: 1,
        title: 1
      }
    )
    .sort({ name: 1 })
    .collation({ locale: 'zh', strength: 2 }) // 使用中文拼音排序
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