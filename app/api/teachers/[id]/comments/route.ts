import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';
import CommentModel from '@/models/Comment';
import CrowdActionModel from '@/models/CrowdAction';
import { verifyWalletSignature, generateSignatureMessage, isTimestampValid } from '@/lib/walletAuth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: teacherId } = await params;

    const teacherExists = await TeacherModel.exists({ _id: teacherId });
    if (!teacherExists) {
      return NextResponse.json({ success: false, message: '导师不存在' }, { status: 404 });
    }

    const comments = await CommentModel.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .lean();

    // 为每条评论附加计数（不含用户态，用户态在前端依据当前钱包自行对照）
    const enriched = (comments || []).map((c) => ({
      ...c,
      likeCount: Array.isArray(c.likedBy) ? c.likedBy.length : 0,
      dislikeCount: Array.isArray(c.dislikedBy) ? c.dislikedBy.length : 0,
    }));

    return NextResponse.json({ success: true, data: { comments: enriched } });
  } catch (error) {
    console.error('获取评论失败', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: teacherId } = await params;
    const body = await req.json();
    const { 
      walletAddress, 
      rating, 
      content, 
      signature, 
      timestamp 
    } = body as { 
      walletAddress?: string; 
      rating?: number; 
      content?: string;
      signature?: string;
      timestamp?: number;
    };

    const teacherExists = await TeacherModel.exists({ _id: teacherId });
    if (!teacherExists) {
      return NextResponse.json({ success: false, message: '导师不存在' }, { status: 404 });
    }

    // 基础参数验证
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 32) {
      return NextResponse.json({ success: false, message: '无效的钱包地址' }, { status: 400 });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: '评分必须在1到5之间' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length < 10 || content.trim().length > 1500) {
      return NextResponse.json({ success: false, message: '评语必须在10-1500字之间' }, { status: 400 });
    }

    // 钱包签名验证
    if (!signature || typeof signature !== 'string') {
      return NextResponse.json({ success: false, message: '缺少签名信息' }, { status: 400 });
    }
    if (!timestamp || typeof timestamp !== 'number') {
      return NextResponse.json({ success: false, message: '缺少时间戳' }, { status: 400 });
    }

    // 验证时间戳有效性
    if (!isTimestampValid(timestamp)) {
      return NextResponse.json({ success: false, message: '签名已过期，请重新签名' }, { status: 400 });
    }

    // 生成签名消息并验证签名
    const message = generateSignatureMessage(walletAddress, timestamp, 'comment');
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return NextResponse.json({ success: false, message: '签名验证失败' }, { status: 400 });
    }

    const comment = await CommentModel.create({
      teacher: teacherId,
      walletAddress: walletAddress.toLowerCase(),
      rating,
      content: content.trim(),
    });

    // 记录众包行为 - 使用 findOneAndUpdate 避免重复记录
    try {
      await CrowdActionModel.findOneAndUpdate(
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'create',
          targetType: 'comment',
          targetId: comment._id.toString()
        },
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'create',
          targetType: 'comment',
          targetId: comment._id.toString(),
          payload: {
            teacherId: teacherId,
            rating: rating,
            contentLength: content.trim().length
          }
        },
        { upsert: true, new: true }
      );
    } catch (crowdError) {
      console.error('记录众包行为失败:', crowdError);
      // 不影响主流程，继续返回成功
    }

    return NextResponse.json({ success: true, data: { comment } }, { status: 201 });
  } catch (error) {
    console.error('创建评论失败', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// 由于该文件路径为 /api/teachers/[id]/comments
// 删除某条评论需要一个包含 commentId 的路由，单独创建子路径更合理： /api/teachers/[id]/comments/[commentId]

