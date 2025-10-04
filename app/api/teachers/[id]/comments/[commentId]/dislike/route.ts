import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';
import CommentModel from '@/models/Comment';
import CrowdActionModel from '@/models/CrowdAction';
import { verifyWalletSignature, generateSignatureMessage, isTimestampValid } from '@/lib/walletAuth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await connectDB();
    const { id: teacherId, commentId } = await params;
    const body = await req.json().catch(() => ({}));
    const { 
      walletAddress, 
      signature, 
      timestamp 
    } = body as { 
      walletAddress?: string; 
      signature?: string;
      timestamp?: number;
    };

    // 基础参数验证
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 32) {
      return NextResponse.json({ success: false, message: '无效的钱包地址' }, { status: 400 });
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
    const message = generateSignatureMessage(walletAddress, timestamp, 'dislike');
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return NextResponse.json({ success: false, message: '签名验证失败' }, { status: 400 });
    }

    const teacherExists = await TeacherModel.exists({ _id: teacherId });
    if (!teacherExists) {
      return NextResponse.json({ success: false, message: '导师不存在' }, { status: 404 });
    }

    const comment = await CommentModel.findOne({ _id: commentId, teacher: teacherId });
    if (!comment) {
      return NextResponse.json({ success: false, message: '评论不存在' }, { status: 404 });
    }

    // 点踩：加入 dislikedBy，移除 likedBy
    await CommentModel.updateOne(
      { _id: commentId },
      {
        $addToSet: { dislikedBy: walletAddress.toLowerCase() },
        $pull: { likedBy: walletAddress.toLowerCase() },
      }
    );

    // 记录众包行为 - 使用 findOneAndUpdate 避免重复记录
    try {
      await CrowdActionModel.findOneAndUpdate(
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'dislike',
          targetType: 'comment',
          targetId: commentId
        },
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'dislike',
          targetType: 'comment',
          targetId: commentId,
          payload: {
            teacherId: teacherId,
            commentId: commentId
          }
        },
        { upsert: true, new: true }
      );
    } catch (crowdError) {
      console.error('记录众包行为失败:', crowdError);
      // 不影响主流程，继续返回成功
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('点踩失败', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await connectDB();
    const { id: teacherId, commentId } = await params;
    const body = await req.json().catch(() => ({}));
    const { 
      walletAddress, 
      signature, 
      timestamp 
    } = body as { 
      walletAddress?: string; 
      signature?: string;
      timestamp?: number;
    };

    // 基础参数验证
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 32) {
      return NextResponse.json({ success: false, message: '无效的钱包地址' }, { status: 400 });
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
    const message = generateSignatureMessage(walletAddress, timestamp, 'undislike');
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return NextResponse.json({ success: false, message: '签名验证失败' }, { status: 400 });
    }

    const teacherExists = await TeacherModel.exists({ _id: teacherId });
    if (!teacherExists) {
      return NextResponse.json({ success: false, message: '导师不存在' }, { status: 404 });
    }

    const comment = await CommentModel.findOne({ _id: commentId, teacher: teacherId });
    if (!comment) {
      return NextResponse.json({ success: false, message: '评论不存在' }, { status: 404 });
    }

    await CommentModel.updateOne(
      { _id: commentId },
      { $pull: { dislikedBy: walletAddress.toLowerCase() } }
    );

    // 记录众包行为 - 使用 findOneAndUpdate 避免重复记录
    try {
      await CrowdActionModel.findOneAndUpdate(
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'undislike',
          targetType: 'comment',
          targetId: commentId
        },
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'undislike',
          targetType: 'comment',
          targetId: commentId,
          payload: {
            teacherId: teacherId,
            commentId: commentId
          }
        },
        { upsert: true, new: true }
      );
    } catch (crowdError) {
      console.error('记录众包行为失败:', crowdError);
      // 不影响主流程，继续返回成功
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('取消点踩失败', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}


