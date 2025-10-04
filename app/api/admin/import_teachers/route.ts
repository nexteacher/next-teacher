import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';

interface ImportTeacherData {
  school: string;
  department: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // 验证是否是数组
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { 
          success: false, 
          error: '请提供教师数据数组' 
        },
        { status: 400 }
      );
    }

    const teachersData: ImportTeacherData[] = body;
    
    // 批量创建教师
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < teachersData.length; i++) {
      const data = teachersData[i];
      
      // 只检查 name 和 school 必填字段
      if (!data.school || !data.name) {
        results.skipped++;
        results.errors.push(`第 ${i + 1} 条数据缺少必填字段 (school, name)，已跳过`);
        continue;
      }
      
      try {
        // 生成唯一邮箱 - 使用随机数和索引避免冲突
        const randomStr = Math.random().toString(36).substring(2, 8);
        const timestamp = Date.now();
        const nameSlug = data.name.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'teacher';
        const email = `${nameSlug}-${timestamp}-${i}-${randomStr}@imported.edu`;
        
        const teacher = new TeacherModel({
          name: data.name.trim(),
          university: data.school.trim(),
          department: data.department ? data.department.trim() : '',
          email: email,
          isActive: true,
          source: 'imported',
          importedFrom: 'JSON文件批量导入',
        });

        await teacher.save();
        results.success++;
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        // 只记录前10个错误，避免信息过多
        if (results.errors.length < 10) {
          results.errors.push(`第 ${i + 1} 条 "${data.name}" 失败: ${errorMsg}`);
        }
        console.error(`导入第 ${i + 1} 条数据失败:`, errorMsg, data);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `成功导入 ${results.success} 位导师${results.skipped > 0 ? `，跳过 ${results.skipped} 条` : ''}${results.failed > 0 ? `，失败 ${results.failed} 位` : ''}`
    });

  } catch (error) {
    console.error('批量导入教师失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '批量导入教师失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}