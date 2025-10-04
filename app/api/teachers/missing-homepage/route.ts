import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export const revalidate = 120; // 较短缓存以便快速更新

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const university = (searchParams.get('university') || '').trim();
    const department = (searchParams.get('department') || '').trim();

    const filter: Record<string, unknown> = { isActive: true, $or: [ { homepage: { $exists: false } }, { homepage: '' } ] };
    if (university) filter.university = university;
    if (department) filter.department = department;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TeacherModel.find(filter)
        .sort({ university: 1, department: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .select({ _id: 1, name: 1, title: 1, university: 1, department: 1, homepage: 1 })
        .lean(),
      TeacherModel.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error('获取缺失主页导师失败:', error);
    return NextResponse.json({ success: false, error: '获取缺失主页导师失败' }, { status: 500 });
  }
}


