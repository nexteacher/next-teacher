import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CrowdActionModel from '@/models/CrowdAction';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const skip = (page - 1) * limit;
    
    // 筛选参数
    const walletAddress = searchParams.get('walletAddress');
    const actionType = searchParams.get('actionType');
    const targetType = searchParams.get('targetType');
    
    // 构建查询条件
    const query: Record<string, unknown> = {};
    if (walletAddress) {
      query.walletAddress = walletAddress.toLowerCase();
    }
    if (actionType) {
      query.actionType = actionType;
    }
    if (targetType) {
      query.targetType = targetType;
    }
    
    // 获取总数
    const total = await CrowdActionModel.countDocuments(query);
    
    // 获取数据，按创建时间倒序排列
    const actions = await CrowdActionModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      success: true,
      data: actions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('获取众包行为数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '获取众包行为数据失败' 
    }, { status: 500 });
  }
}
