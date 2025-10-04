import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CrowdActionModel from '@/models/CrowdAction';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);

    const results = await CrowdActionModel.aggregate([
      { $group: { _id: '$walletAddress', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, walletAddress: '$_id', count: 1 } }
    ]);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return NextResponse.json({ success: false, error: '获取排行榜失败' }, { status: 500 });
  }
}


