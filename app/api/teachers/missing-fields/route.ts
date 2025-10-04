import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 计算缺失字段数量的函数
function calculateMissingFieldsCount(teacher: Record<string, unknown>): number {
  let missingCount = 0;
  
  // 检查基本字段
  if (!teacher.title || (typeof teacher.title === 'string' && teacher.title.trim() === '')) missingCount++;
  if (!teacher.department || (typeof teacher.department === 'string' && teacher.department.trim() === '')) missingCount++;
  if (!teacher.email || (typeof teacher.email === 'string' && teacher.email.trim() === '')) missingCount++;
  if (!teacher.homepage || (typeof teacher.homepage === 'string' && teacher.homepage.trim() === '')) missingCount++;
  if (!teacher.avatar || (typeof teacher.avatar === 'string' && teacher.avatar.trim() === '')) missingCount++;
  
  // 检查数组字段
  if (!teacher.researchAreas || !Array.isArray(teacher.researchAreas) || teacher.researchAreas.length === 0) missingCount++;
  if (!teacher.education || !Array.isArray(teacher.education) || teacher.education.length === 0) missingCount++;
  if (!teacher.experience || !Array.isArray(teacher.experience) || teacher.experience.length === 0) missingCount++;
  
  return missingCount;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const university = (searchParams.get('university') || '').trim();
    const department = (searchParams.get('department') || '').trim();
    const q = (searchParams.get('q') || '').trim();

    const filter: Record<string, unknown> = { isActive: true };
    if (university) filter.university = university;
    if (department) filter.department = department;
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      (filter as Record<string, unknown> & { $and?: unknown[] }).$and = [ { $or: [ { name: regex }, { university: regex }, { department: regex } ] } ];
    }

    // 获取所有符合条件的导师
    const allTeachers = await TeacherModel.find(filter)
      .select({ _id: 1, name: 1, title: 1, university: 1, department: 1, email: 1, homepage: 1, avatar: 1, researchAreas: 1, education: 1, experience: 1 })
      .lean();

    // 计算每个导师的缺失字段数量并排序
    const teachersWithMissingCount = allTeachers.map(teacher => ({
      ...teacher,
      missingFieldsCount: calculateMissingFieldsCount(teacher)
    }));

    // 按照缺失字段数量降序排序（缺失越多排在越前面）
    teachersWithMissingCount.sort((a, b) => b.missingFieldsCount - a.missingFieldsCount);

    // 分页处理
    const total = teachersWithMissingCount.length;
    const skip = (page - 1) * limit;
    const items = teachersWithMissingCount.slice(skip, skip + limit);

    // 移除临时添加的 missingFieldsCount 字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const finalItems = items.map(({ missingFieldsCount, ...teacher }) => teacher);

    return NextResponse.json({ 
      success: true, 
      data: finalItems, 
      pagination: { 
        page, 
        limit, 
        total, 
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      } 
    });
  } catch (error) {
    console.error('获取导师列表失败:', error);
    return NextResponse.json({ success: false, error: '获取导师列表失败' }, { status: 500 });
  }
}