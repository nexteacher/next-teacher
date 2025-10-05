import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';
import CrowdActionModel from '@/models/CrowdAction';
import { verifyWalletSignature, generateSignatureMessage, isTimestampValid } from '@/lib/walletAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // 获取导师信息
    const teacher = await TeacherModel.findById(id).select('-__v').lean();

    if (!teacher) {
      return NextResponse.json(
        { 
          success: false, 
          error: '导师不存在' 
        },
        { status: 404 }
      );
    }


    return NextResponse.json({
      success: true,
      data: {
        teacher,
      }
    });

  } catch (error) {
    console.error('获取导师详情失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取导师详情失败' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
    const { 
      walletAddress, 
      signature, 
      timestamp,
      ...updateData 
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
          // 检查是否是管理员操作（通过特殊的 actionType 识别）
          const actionType = body.actionType || 'update-teacher';
          const message = generateSignatureMessage(walletAddress, timestamp, actionType);
          if (!verifyWalletSignature(message, signature, walletAddress)) {
            return NextResponse.json({ success: false, error: '签名验证失败' }, { status: 400 });
          }

    // 容错：清理空字符串，构建 $set / $unset，避免因格式不完整导致验证失败
    const update: { $set?: Record<string, unknown>; $unset?: Record<string, ''> } = {};
    const setPayload: Record<string, unknown> = {};
    const unsetPayload: Record<string, ''> = {};

    const maybeSet = (key: string, val: unknown) => {
      if (val === undefined || val === null) return;
      if (typeof val === 'string' && val.trim() === '') { unsetPayload[key] = ''; return; }
      setPayload[key] = val;
    };

    // 一般字段（宽松校验）
    maybeSet('title', updateData.title);
    maybeSet('department', updateData.department);
    
    // region 字段处理（必须是大写的英文缩写）
    if (typeof updateData.region === 'string') {
      const region = updateData.region.trim().toUpperCase();
      if (region === '') { 
        setPayload.region = 'CN'; // region 是必填字段，空时设为默认值
      } else {
        setPayload.region = region;
      }
    }
    
    // name / university 允许更新（去首尾空格，空字符串则 unset）
    if (typeof updateData.name === 'string') {
      const name = updateData.name.trim();
      if (name === '') { unsetPayload['name'] = ''; }
      else setPayload.name = name;
    }
    if (typeof updateData.university === 'string') {
      const university = updateData.university.trim();
      if (university === '') { unsetPayload['university'] = ''; }
      else setPayload.university = university;
    }
    // email: 不合法则当作未提供，进行 unset
    if (typeof updateData.email === 'string') {
      const email = updateData.email.trim();
      const emailOk = /^(?=.{1,254}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
      if (email === '') { unsetPayload['email'] = ''; }
      else if (emailOk) setPayload.email = email;
      else { unsetPayload['email'] = ''; }
    }
    // homepage: 不合法则当作未提供
    if (typeof updateData.homepage === 'string') {
      const homepage = updateData.homepage.trim();
      const hpOk = /^https?:\/\/.+/.test(homepage);
      if (homepage === '') { unsetPayload['homepage'] = ''; }
      else if (hpOk) setPayload.homepage = homepage;
      else { unsetPayload['homepage'] = ''; }
    }
    // avatar: 允许 http/https 或站内相对路径，以字符串存在即可；空字符串则 unset
    if (typeof updateData.avatar === 'string') {
      const avatar = updateData.avatar.trim();
      const looksUrl = /^(https?:\/\/|\/)/.test(avatar); // 允许以 http(s) 或 以 "/" 开头的站内路径
      if (avatar === '') { unsetPayload['avatar'] = ''; }
      else if (looksUrl) setPayload.avatar = avatar;
      else setPayload.avatar = avatar; // 放宽校验，前端可控
    }
    if (Array.isArray(updateData.researchAreas)) {
      const arr = updateData.researchAreas.filter((s: unknown) => typeof s === 'string' && (s as string).trim() !== '').map((s: string) => s.trim());
      if (arr.length > 0) setPayload.researchAreas = arr; else unsetPayload['researchAreas'] = '';
    }
    if (Array.isArray(updateData.education)) {
      const arr = updateData.education
        .map((e: unknown) => {
          const item = e as { degree?: unknown; major?: unknown; university?: unknown; year?: unknown };
          const year = typeof item?.year === 'number' ? item.year : (typeof item?.year === 'string' && item.year.trim() !== '' ? Number(item.year) : undefined);
          return {
            degree: typeof item?.degree === 'string' ? item.degree.trim() : undefined,
            major: typeof item?.major === 'string' ? item.major.trim() : undefined,
            university: typeof item?.university === 'string' ? item.university.trim() : undefined,
            year,
          };
        })
        .filter((e: { degree?: string; major?: string; university?: string; year?: number }) =>
          Boolean(e.degree && e.major && e.university && typeof e.year === 'number' && !Number.isNaN(e.year))
        );
      if (arr.length > 0) setPayload.education = arr; else unsetPayload['education'] = '';
    }
    if (Array.isArray(updateData.experience)) {
      const arr = updateData.experience
        .map((e: unknown) => {
          const item = e as { position?: unknown; institution?: unknown; startYear?: unknown; endYear?: unknown; description?: unknown };
          const startYear = typeof item?.startYear === 'number' ? item.startYear : (typeof item?.startYear === 'string' && item.startYear.trim() !== '' ? Number(item.startYear) : undefined);
          const endYear = typeof item?.endYear === 'number' ? item.endYear : (typeof item?.endYear === 'string' && item.endYear.trim() !== '' ? Number(item.endYear) : undefined);
          return {
            position: typeof item?.position === 'string' ? item.position.trim() : undefined,
            institution: typeof item?.institution === 'string' ? item.institution.trim() : undefined,
            startYear,
            endYear,
            description: typeof item?.description === 'string' ? item.description.trim() : undefined,
          };
        })
        .filter((e: { position?: string; institution?: string; startYear?: number; endYear?: number; description?: string }) =>
          Boolean(e.position && e.institution && typeof e.startYear === 'number' && !Number.isNaN(e.startYear))
        );
      if (arr.length > 0) setPayload.experience = arr; else unsetPayload['experience'] = '';
    }

    // isActive 布尔
    if (typeof updateData.isActive === 'boolean') {
      setPayload.isActive = updateData.isActive;
    }
    // source 枚举与 importedFrom
    if (typeof updateData.source === 'string') {
      const source = updateData.source.trim();
      if (source === '') { unsetPayload['source'] = ''; }
      else if (['user', 'admin', 'imported'].includes(source)) setPayload.source = source;
    }
    if (typeof updateData.importedFrom === 'string') {
      const importedFrom = updateData.importedFrom.trim();
      if (importedFrom === '') { unsetPayload['importedFrom'] = ''; }
      else setPayload.importedFrom = importedFrom;
    }

    if (Object.keys(setPayload).length > 0) update.$set = setPayload;
    if (Object.keys(unsetPayload).length > 0) update.$unset = unsetPayload;

    // 获取原有数据以便对比修改的字段
    const originalTeacher = await TeacherModel.findById(id).select('-__v').lean();
    if (!originalTeacher) {
      return NextResponse.json({ success: false, error: '导师不存在' }, { status: 404 });
    }

    // 若没有任何可更新内容，直接返回当前数据
    if (!update.$set && !update.$unset) {
      return NextResponse.json({ success: true, data: originalTeacher });
    }

    // 对比原有数据，只记录真正改变的字段
    const actuallyUpdatedFields: string[] = [];
    const actuallyRemovedFields: string[] = [];

    // 检查 setPayload 中真正改变的字段
    if (update.$set) {
      for (const [key, newValue] of Object.entries(setPayload)) {
        const oldValue = (originalTeacher as Record<string, unknown>)[key];
        // 深度对比数组和对象
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          actuallyUpdatedFields.push(key);
        }
      }
    }

    // 检查 unsetPayload 中真正存在且有内容的字段
    if (update.$unset) {
      for (const key of Object.keys(unsetPayload)) {
        const oldValue = (originalTeacher as Record<string, unknown>)[key];
        // 只有原值存在且有实际内容时，才算是真正的"移除"
        if (oldValue !== undefined && oldValue !== null) {
          // 字符串：非空才算有内容
          if (typeof oldValue === 'string' && oldValue.trim() !== '') {
            actuallyRemovedFields.push(key);
          }
          // 数组：非空才算有内容
          else if (Array.isArray(oldValue) && oldValue.length > 0) {
            actuallyRemovedFields.push(key);
          }
          // 其他类型（对象、布尔、数字等）：只要存在就算有内容
          else if (typeof oldValue !== 'string' && !Array.isArray(oldValue)) {
            actuallyRemovedFields.push(key);
          }
        }
      }
    }

    // 如果没有真正的修改，直接返回原数据
    if (actuallyUpdatedFields.length === 0 && actuallyRemovedFields.length === 0) {
      return NextResponse.json({ success: true, data: originalTeacher });
    }

    const teacher = await TeacherModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select('-__v');

    if (!teacher) {
      return NextResponse.json(
        { 
          success: false, 
          error: '导师不存在' 
        },
        { status: 404 }
      );
    }

    // 记录众包行为 - 只记录真正改变的字段
    try {
      await CrowdActionModel.findOneAndUpdate(
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'update',
          targetType: 'teacher',
          targetId: id
        },
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'update',
          targetType: 'teacher',
          targetId: id,
          payload: {
            updatedFields: actuallyUpdatedFields,
            removedFields: actuallyRemovedFields
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
    });

  } catch (error) {
    console.error('更新导师信息失败:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: '数据验证失败',
          details: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: '更新导师信息失败' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    // 尝试解析请求体，如果没有则使用默认值
    let walletAddress: string | undefined;
    let signature: string | undefined;
    let timestamp: number | undefined;
    
    try {
      const body = await request.json();
      walletAddress = body.walletAddress;
      signature = body.signature;
      timestamp = body.timestamp;
    } catch {
      // 如果没有请求体或解析失败，跳过钱包验证（管理员删除）
      console.log('DELETE 请求没有请求体，跳过钱包验证');
    }

    // 检查删除权限
    const allowedWalletAddress = '2zodmoNmqjvrvYXb4tYqSBHn4VMKdDis9o44xhc2teME';
    
    if (walletAddress) {
      // 检查钱包地址是否被授权删除
      if (walletAddress.toLowerCase() !== allowedWalletAddress.toLowerCase()) {
        return NextResponse.json({ 
          success: false, 
          error: '您没有权限删除导师，只有授权钱包可以执行此操作' 
        }, { status: 403 });
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
      const message = generateSignatureMessage(walletAddress, timestamp, 'delete-teacher');
      if (!verifyWalletSignature(message, signature, walletAddress)) {
        return NextResponse.json({ success: false, error: '签名验证失败' }, { status: 400 });
      }
    } else {
      // 没有钱包信息时，拒绝删除
      return NextResponse.json({ 
        success: false, 
        error: '删除导师需要钱包签名验证' 
      }, { status: 401 });
    }

    // 硬删除：直接从数据库移除文档
    const teacher = await TeacherModel.findByIdAndDelete(id);

    if (!teacher) {
      return NextResponse.json(
        { 
          success: false, 
          error: '导师不存在' 
        },
        { status: 404 }
      );
    }

    // 记录众包行为 - 使用 findOneAndUpdate 避免重复记录
    try {
      await CrowdActionModel.findOneAndUpdate(
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'delete',
          targetType: 'teacher',
          targetId: id
        },
        {
          walletAddress: walletAddress.toLowerCase(),
          actionType: 'delete',
          targetType: 'teacher',
          targetId: id,
          payload: {
            teacherName: teacher.name,
            university: teacher.university,
            deletedBy: 'authorized-wallet'
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
      message: '导师已删除'
    });

  } catch (error) {
    console.error('删除导师失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '删除导师失败' 
      },
      { status: 500 }
    );
  }
}