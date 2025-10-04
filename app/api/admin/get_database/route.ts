import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';

export async function GET() {
    try {
        // 连接数据库
        await connectDB();
        
        // 获取所有导师数据
        const teachers = await TeacherModel.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ 
            success: true,
            data: {
                teachers,
            }
        }, { status: 200 });
    } catch (error) {
        console.error('获取数据库数据时出错:', error);
        return NextResponse.json({ 
            success: false,
            message: '获取数据库数据失败',
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}