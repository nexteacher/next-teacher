import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';


const sampleTeachers = [
  {
    name: '张教授',
    title: '教授',
    department: '计算机科学与技术',
    university: '清华大学',
    email: 'zhang.prof@tsinghua.edu.cn',
    homepage: 'http://www.cs.tsinghua.edu.cn/zhang',
    education: [
      {
        degree: '博士',
        major: '计算机科学',
        university: '斯坦福大学',
        year: 1998
      },
      {
        degree: '硕士',
        major: '计算机科学',
        university: '清华大学',
        year: 1994
      }
    ],
    experience: [
      {
        position: '教授',
        institution: '清华大学计算机系',
        startYear: 2005,
        description: '负责人工智能相关课程教学和科研工作'
      },
      {
        position: '副教授',
        institution: '清华大学计算机系',
        startYear: 2000,
        endYear: 2005
      }
    ],
    isActive: true
  },
  {
    name: '李副教授',
    title: '副教授',
    department: '电子工程',
    university: '北京大学',
    email: 'li.prof@pku.edu.cn',
    education: [
      {
        degree: '博士',
        major: '电子工程',
        university: 'MIT',
        year: 2010
      }
    ],
    experience: [
      {
        position: '副教授',
        institution: '北京大学信息科学技术学院',
        startYear: 2015
      }
    ],
    isActive: true
  },
  {
    name: '王研究员',
    title: '研究员',
    department: '数学',
    university: '复旦大学',
    email: 'wang.researcher@fudan.edu.cn',
    bio: '王研究员在应用数学和统计学方面有着丰富的研究经验,特别是在数据科学和统计建模领域。',
    researchAreas: ['应用数学', '统计学', '数据科学', '概率论'],
    education: [
      {
        degree: '博士',
        major: '数学',
        university: '哈佛大学',
        year: 2008
      }
    ],
    experience: [
      {
        position: '研究员',
        institution: '复旦大学数学科学学院',
        startYear: 2012
      }
    ],
    isActive: true
  }
];

export async function POST() {
    try {
        // 连接数据库
        await connectDB();
        
        // 清空现有数据
        await TeacherModel.deleteMany({});
        
        // 添加示例导师数据到数据库
        await TeacherModel.insertMany(sampleTeachers);
        
        const teacherCount = await TeacherModel.countDocuments();

        return NextResponse.json({
            message: '数据库初始化成功',
            data: {
                teacherCount,
            }
        }, { status: 200 });
    } catch (error) {
        console.error('初始化数据库时出错:', error);
        return NextResponse.json({
            message: '初始化数据库失败',
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}