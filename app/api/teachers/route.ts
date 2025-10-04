import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';
import CrowdActionModel from '@/models/CrowdAction';
import { verifyWalletSignature, generateSignatureMessage, isTimestampValid } from '@/lib/walletAuth';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const university = searchParams.get('university');
    const department = searchParams.get('department');
    const researchArea = searchParams.get('researchArea');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 构建查询条件
    const filter: Record<string, unknown> = { isActive: true };
    
    if (university) filter.university = university;
    if (department) filter.department = department;
    if (researchArea) filter.researchAreas = { $in: [researchArea] };
    if (tags && tags.length > 0) filter.tags = { $in: tags };

    // 计算跳过的文档数
    const skip = (page - 1) * limit;

    // 构建排序条件
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 执行查询
    const [teachers, total] = await Promise.all([
      TeacherModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      TeacherModel.countDocuments(filter)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        teachers,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('获取导师列表失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取导师列表失败' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      walletAddress, 
      signature, 
      timestamp,
      ...teacherData 
    } = body as { 
      walletAddress?: string; 
      signature?: string;
      timestamp?: number;
      [key: string]: unknown;
    };

    // 基础参数验证
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 32) {
      return NextResponse.json({ success: false, error: '无效的钱包地址' }, { status: 400 });
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
    const message = generateSignatureMessage(walletAddress, timestamp, 'create-teacher');
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return NextResponse.json({ success: false, error: '签名验证失败' }, { status: 400 });
    }
    
    // 处理邮箱字段：如果没有提供邮箱，生成一个随机邮箱
    const processedTeacherData = { ...teacherData };
    if (!processedTeacherData.email || (typeof processedTeacherData.email === 'string' && processedTeacherData.email.trim() === '')) {
      // 生成唯一的随机邮箱
      let randomEmail;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        const randomId = Math.random().toString(36).substring(2, 8);
        const timestamp = Date.now().toString(36).substring(-4);
        const domains = ['example.com', 'temp.edu', 'placeholder.org', 'demo.net'];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        randomEmail = `teacher_${randomId}_${timestamp}@${randomDomain}`;
        
        // 检查邮箱是否已存在
        const existingTeacher = await TeacherModel.findOne({ email: randomEmail });
        if (!existingTeacher) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        // 如果仍然不唯一，使用时间戳确保唯一性
        const timestamp = Date.now();
        randomEmail = `teacher_${timestamp}@example.com`;
      }
      
      processedTeacherData.email = randomEmail;
    }
    
    // 创建新导师
    const teacher = new TeacherModel(processedTeacherData);
    await teacher.save();

    // 记录众包行为 - 使用 findOneAndUpdate 避免重复记录
    try {
      await CrowdActionModel.findOneAndUpdate(
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'create',
          targetType: 'teacher',
          targetId: teacher._id.toString()
        },
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'create',
          targetType: 'teacher',
          targetId: teacher._id.toString(),
          payload: {
            teacherName: teacher.name,
            university: teacher.university,
            department: teacher.department
          }
        },
        { upsert: true, new: true }
      );
    } catch (crowdError) {
      console.error('记录众包行为失败:', crowdError);
      // 不影响主流程，继续返回成功
    }

    return NextResponse.json({
      success: true,
      data: teacher
    }, { status: 201 });

  } catch (error) {
    console.error('创建导师失败:', error);
    
    if (error instanceof Error) {
      // 处理验证错误
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { 
            success: false, 
            error: '数据验证失败',
            details: error.message
          },
          { status: 400 }
        );
      }
      
      // 处理重复邮箱错误
      if (error.message.includes('duplicate key error')) {
        return NextResponse.json(
          { 
            success: false, 
            error: '邮箱已存在' 
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: '创建导师失败' 
      },
      { status: 500 }
    );
  }
}