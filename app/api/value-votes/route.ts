import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ValueVoteModel from '@/models/ValueVote';
import { verifyWalletSignature, generateSignatureMessage, isTimestampValid } from '@/lib/walletAuth';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 统计某页面的投票数量
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagePath = (searchParams.get('pagePath') || '').trim();
    if (!pagePath) return NextResponse.json({ success: false, error: '缺少 pagePath' }, { status: 400 });

    const agg = await ValueVoteModel.aggregate([
      { $match: { pagePath } },
      { $group: { _id: '$value', count: { $sum: 1 } } },
    ]);
    const counts = { valuable: 0, not_valuable: 0 } as Record<'valuable' | 'not_valuable', number>;
    for (const row of agg) counts[row._id as 'valuable' | 'not_valuable'] = row.count as number;
    return NextResponse.json({ success: true, data: counts });
  } catch (e) {
    console.error('获取投票统计失败', e);
    return NextResponse.json({ success: false, error: '获取投票统计失败' }, { status: 500 });
  }
}

// 投票/修改投票
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { 
      pagePath, 
      walletAddress, 
      value, 
      signature, 
      timestamp 
    } = body as { 
      pagePath?: string; 
      walletAddress?: string; 
      value?: 'valuable' | 'not_valuable';
      signature?: string;
      timestamp?: number;
    };

    // 基础参数验证
    const trimmedPagePath = (pagePath || '').trim();
    const trimmedWalletAddress = (walletAddress || '').trim();
    
    if (!trimmedPagePath || !trimmedWalletAddress || !['valuable', 'not_valuable'].includes(value || '')) {
      return NextResponse.json({ success: false, error: '参数不合法' }, { status: 400 });
    }

    // 钱包签名验证
    if (!signature || typeof signature !== 'string') {
      return NextResponse.json({ success: false, error: '缺少签名信息' }, { status: 400 });
    }
    if (!timestamp || typeof timestamp !== 'number') {
      return NextResponse.json({ success: false, error: '缺少时间戳' }, { status: 400 });
    }

    // 验证时间戳有效性
    if (!isTimestampValid(timestamp)) {
      return NextResponse.json({ success: false, error: '签名已过期，请重新签名' }, { status: 400 });
    }

    // 生成签名消息并验证签名
    const message = generateSignatureMessage(trimmedWalletAddress, timestamp, `vote-${value}`);
    if (!verifyWalletSignature(message, signature, trimmedWalletAddress)) {
      return NextResponse.json({ success: false, error: '签名验证失败' }, { status: 400 });
    }

    // upsert：同一钱包+页面，更新为最新选择
    const doc = await ValueVoteModel.findOneAndUpdate(
      { pagePath: trimmedPagePath, walletAddress: trimmedWalletAddress.toLowerCase() },
      { $set: { value } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (e) {
    console.error('提交投票失败', e);
    return NextResponse.json({ success: false, error: '提交投票失败' }, { status: 500 });
  }
}


