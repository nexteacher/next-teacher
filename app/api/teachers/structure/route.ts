import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';
import { cookies } from 'next/headers';

// 强制动态渲染，禁用缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0; // 禁用缓存，因为响应依赖于用户的 region cookie

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // 读取地区，默认 CN（中国大陆）
    const cookieStore = await cookies();
    const region = cookieStore.get('region')?.value || 'CN';
    
    // 获取分页参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // 使用聚合管道获取学校和院系结构，按地区过滤
    const matchStage: Record<string, unknown> = { 
      isActive: { $ne: false },
      region: region // 添加地区过滤
    }

    // 先获取所有学校（用于分页）
    const allUniversities = await TeacherModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $ifNull: ['$university', '未知学校'] }
        }
      },
      { $sort: { _id: 1 } }
    ]).collation({ locale: 'zh', strength: 2 }); // 使用中文拼音排序

    const totalUniversities = allUniversities.length;
    const hasMore = skip + limit < totalUniversities;
    
    // 获取当前页的学校列表
    const pagedUniversities = allUniversities.slice(skip, skip + limit).map(u => u._id);

    // 获取这些学校的详细结构
    const structure = await TeacherModel.aggregate([
      // 只查询活跃的教师和当前页的学校
      { 
        $match: { 
          ...matchStage,
          university: { $in: pagedUniversities }
        } 
      },
      // 按学校和院系分组
      {
        $group: {
          _id: {
            university: { $ifNull: ['$university', '未知学校'] },
            department: { $ifNull: ['$department', '未知院系'] }
          },
          teacherCount: { $sum: 1 }
        }
      },
      // 重新组织数据结构
      {
        $group: {
          _id: '$_id.university',
          departments: {
            $push: {
              name: '$_id.department',
              teacherCount: '$teacherCount'
            }
          }
        }
      },
      // 排序院系
      {
        $project: {
          _id: 0,
          university: '$_id',
          departments: {
            $sortArray: {
              input: '$departments',
              sortBy: { name: 1 }
            }
          }
        }
      },
      // 排序学校
      { $sort: { university: 1 } }
    ]).collation({ locale: 'zh', strength: 2 }); // 使用中文拼音排序

    return NextResponse.json({
      success: true,
      data: structure,
      region, // 返回当前选中的地区
      pagination: {
        page,
        limit,
        total: totalUniversities,
        hasMore
      }
    }, {
      headers: {
        // 使用 private 缓存，因为响应依赖于用户的 cookie
        // 这样可以防止 CDN 缓存导致不同用户看到相同的地区数据
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Vary': 'Cookie' // 告诉缓存层响应会根据 Cookie 变化
      }
    });
  } catch (error) {
    console.error('Error fetching structure:', error);
    return NextResponse.json(
      { success: false, error: '获取结构失败' },
      { status: 500 }
    );
  }
}