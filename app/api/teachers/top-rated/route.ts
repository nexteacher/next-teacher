import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommentModel from '@/models/Comment';

// 缓存配置 - 5分钟缓存
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const region = searchParams.get('region'); // 可选的地区过滤

    // 构建聚合管道 - 高性能一次查询
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      // 第一步：计算每条评论是否有效（未被折叠）
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ['$likedBy', []] } },
          dislikeCount: { $size: { $ifNull: ['$dislikedBy', []] } },
        }
      },
      {
        $addFields: {
          isValid: { $gte: ['$likeCount', '$dislikeCount'] }
        }
      },
      // 第二步：只保留有效评论
      {
        $match: { isValid: true }
      },
      // 第三步：按教师分组并计算平均评分
      {
        $group: {
          _id: '$teacher',
          averageRating: { $avg: '$rating' },
          commentCount: { $sum: 1 }
        }
      },
      // 第四步：关联教师信息
      {
        $lookup: {
          from: 'teachers',
          localField: '_id',
          foreignField: '_id',
          as: 'teacherInfo'
        }
      },
      // 第五步：展开教师信息
      {
        $unwind: '$teacherInfo'
      },
      // 第六步：只保留活跃的教师
      {
        $match: {
          'teacherInfo.isActive': true,
          ...(region ? { 'teacherInfo.region': region } : {})
        }
      },
      // 第七步：格式化输出
      {
        $project: {
          _id: { $toString: '$_id' },
          name: '$teacherInfo.name',
          title: '$teacherInfo.title',
          university: '$teacherInfo.university',
          department: '$teacherInfo.department',
          region: '$teacherInfo.region',
          avatar: '$teacherInfo.avatar',
          averageRating: 1,
          commentCount: 1
        }
      },
      // 第八步：排序（先按评分降序，再按评论数降序）
      {
        $sort: {
          averageRating: -1,
          commentCount: -1
        }
      },
      // 第九步：限制返回数量
      {
        $limit: limit
      }
    ];

    const ratedTeachers = await CommentModel.aggregate(pipeline);

    return NextResponse.json({
      success: true,
      data: {
        teachers: ratedTeachers,
        total: ratedTeachers.length
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('获取评分榜单失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取评分榜单失败' 
      },
      { status: 500 }
    );
  }
}

