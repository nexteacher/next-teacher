import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CrowdActionModel from '@/models/CrowdAction';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    // 简单校验
    if (!body || !body.walletAddress || !body.actionType || !body.targetType) {
      return NextResponse.json({ success: false, error: '缺少必要字段' }, { status: 400 });
    }

    const record = await CrowdActionModel.findOneAndUpdate(
      {
        walletAddress: String(body.walletAddress).toLowerCase(),
        actionType: String(body.actionType),
        targetType: String(body.targetType),
        targetId: body.targetId ? String(body.targetId) : undefined
      },
      {
        walletAddress: String(body.walletAddress).toLowerCase(),
        actionType: String(body.actionType),
        targetType: String(body.targetType),
        targetId: body.targetId ? String(body.targetId) : undefined,
        payload: body.payload ?? undefined
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('记录众包行为失败:', error);
    return NextResponse.json({ success: false, error: '记录众包行为失败' }, { status: 500 });
  }
}


