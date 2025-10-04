import { Metadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import TeacherModel from "@/models/Teacher";
import TeacherDetailClient from "./TeacherDetailClient";
import { Teacher } from "@/types/teacher";
import { serializeMongoObject } from "@/lib/serialize";

// 生成动态元数据
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    await connectDB();
    const { id } = await params;
    
    const teacher = await TeacherModel.findById(id).lean() as Teacher | null;
    
    if (!teacher) {
      return {
        title: "导师不存在 - NexTeacher",
        description: "您查找的导师信息不存在"
      };
    }

    const title = `${teacher.name} - ${teacher.title || ''} ${teacher.university} ${teacher.department || ''}`.trim();
    const description = teacher.researchAreas && teacher.researchAreas.length > 0 
      ? `${teacher.name}是${teacher.university}${teacher.department ? teacher.department : ''}的${teacher.title || '导师'}，研究领域包括：${teacher.researchAreas.join('、')}。查看详细信息和学生评价。`
      : `${teacher.name}是${teacher.university}${teacher.department ? teacher.department : ''}的${teacher.title || '导师'}。查看详细信息和学生评价。`;

    return {
      title,
      description,
      keywords: [
        teacher.name,
        teacher.university,
        teacher.department || '',
        teacher.title || '',
        ...(teacher.researchAreas || []),
        '导师评价',
        '研究生导师',
        '博士导师'
      ].filter(Boolean).join(', '),
      openGraph: {
        title,
        description,
        type: 'profile',
        images: teacher.avatar ? [teacher.avatar] : ['/images/default-avatar.png'],
        siteName: 'NexTeacher - 导师 Wiki'
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: teacher.avatar ? [teacher.avatar] : ['/images/default-avatar.png']
      },
      alternates: {
        canonical: `https://nexteacher.wiki/teachers/${teacher._id}`
      }
    };
  } catch (error) {
    console.error('生成元数据失败:', error);
    return {
      title: "导师详情 - NexTeacher",
      description: "查看导师详细信息和学生评价"
    };
  }
}

// 生成静态参数（用于 SSG）
export async function generateStaticParams() {
  try {
    await connectDB();
    const teachers = await TeacherModel.find(
      { isActive: true },
      { _id: 1 }
    ).lean();
    
    return teachers.map(teacher => ({
      id: String(teacher._id)
    }));
  } catch (error) {
    console.error('生成静态参数失败:', error);
    return [];
  }
}

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const teacher = await TeacherModel.findById(id).lean() as Teacher | null;
    
    if (!teacher) {
      notFound();
    }

    // 将 MongoDB 对象转换为普通 JavaScript 对象
    const serializedTeacher = serializeMongoObject(teacher) as Teacher;

    return <TeacherDetailClient teacher={serializedTeacher} />;
  } catch (error) {
    console.error('获取导师详情失败:', error);
    notFound();
  }
}
