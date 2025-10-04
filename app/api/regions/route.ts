import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RegionModel from '@/models/Region';

export const revalidate = 300;

const DEFAULT_REGION = { code: 'CN', name: '中国大陆' };

export async function GET() {
  try {
    await connectDB();
    const regions = await RegionModel.find({ isActive: { $ne: false } })
      .sort({ order: 1, name: 1 })
      .lean();

    // 若库中没有任何地区，返回内置默认
    const data = regions.length > 0 ? regions : [DEFAULT_REGION];
    return NextResponse.json({ success: true, data, defaultRegion: DEFAULT_REGION });
  } catch (error) {
    console.error('获取地区失败', error);
    return NextResponse.json({ success: false, error: '获取地区失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const created = await RegionModel.create(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('创建地区失败', error);
    return NextResponse.json({ success: false, error: '创建地区失败' }, { status: 500 });
  }
}


