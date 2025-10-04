import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';

export const dynamic = 'force-dynamic';

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const university = (searchParams.get('university') || '').trim();
    const department = (searchParams.get('department') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);

    const filter: Record<string, unknown> = { isActive: true };
    const or: Array<Record<string, unknown>> = [];

    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      or.push({ name: regex }, { university: regex }, { department: regex });
    }
    if (university) {
      filter.university = new RegExp(escapeRegex(university), 'i');
    }
    if (department) {
      filter.department = new RegExp(escapeRegex(department), 'i');
    }
    if (or.length > 0) {
      (filter as Record<string, unknown>)["$or"] = or;
    }

    // 只返回必要字段
    const results = await TeacherModel.find(
      filter,
      { _id: 1, name: 1, title: 1, university: 1, department: 1 }
    )
      .sort({ university: 1, department: 1, name: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json({ success: false, error: '搜索失败' }, { status: 500 });
  }
}


