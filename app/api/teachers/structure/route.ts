import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';
import { cookies } from 'next/headers';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 缓存配置
export const revalidate = 300; // 5分钟缓存

export async function GET() {
  try {
    await connectDB();
    // 读取地区，默认 CN（中国大陆）
    const cookieStore = await cookies();
    const region = cookieStore.get('region')?.value || 'CN';
    
    // 使用聚合管道获取学校和院系结构
    const matchStage: Record<string, unknown> = { isActive: { $ne: false } };
    // 如未来 Teacher 加入 region 字段，这里可追加 { region }

    const structure = await TeacherModel.aggregate([
      // 只查询活跃的教师
      { $match: matchStage },
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
    ]);

    return NextResponse.json({
      success: true,
      data: structure,
      region
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
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