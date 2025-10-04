import connectDB from '../lib/mongodb';
import TeacherModel from '../models/Teacher';
import CommentModel from '../models/Comment';

const sampleTeachers = [
  {
    name: '张教授',
    title: '教授',
    department: '计算机科学与技术',
    university: '清华大学',
    email: 'zhang.prof@tsinghua.edu.cn',
    phone: '13800138001',
    bio: '张教授是计算机科学与技术领域的知名专家，专注于人工智能和机器学习研究。拥有20多年的教学和科研经验，指导过100多名研究生，其中多人获得国家奖学金。',
    researchAreas: ['人工智能', '机器学习', '深度学习', '计算机视觉'],
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
    publications: [
      {
        title: 'Deep Learning for Computer Vision: A Comprehensive Survey',
        journal: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
        year: 2023,
        authors: ['张教授', 'John Smith', 'Alice Johnson']
      }
    ],
    awards: ['国家杰出青年基金', '教育部长江学者', 'IEEE Fellow'],
    rating: {
      overall: 4.8,
      teaching: 4.9,
      research: 4.7,
      guidance: 4.8,
      reviewCount: 25
    },
    tags: ['严格', '专业', '学术型', '耐心'],
    isActive: true
  },
  {
    name: '李副教授',
    title: '副教授',
    department: '电子工程',
    university: '北京大学',
    email: 'li.prof@pku.edu.cn',
    bio: '李副教授专注于信号处理和通信系统研究，在无线通信领域有深入研究。教学风格生动有趣，深受学生喜爱。',
    researchAreas: ['信号处理', '无线通信', '5G技术', '物联网'],
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
    rating: {
      overall: 4.5,
      teaching: 4.6,
      research: 4.4,
      guidance: 4.5,
      reviewCount: 18
    },
    tags: ['友善', '创新', '实践型'],
    isActive: true
  },
  {
    name: '王研究员',
    title: '研究员',
    department: '数学',
    university: '复旦大学',
    email: 'wang.researcher@fudan.edu.cn',
    bio: '王研究员在应用数学和统计学方面有着丰富的研究经验，特别是在数据科学和统计建模领域。',
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
    rating: {
      overall: 4.3,
      teaching: 4.2,
      research: 4.5,
      guidance: 4.2,
      reviewCount: 12
    },
    tags: ['认真', '学术型', '专业'],
    isActive: true
  }
];

const sampleReviews = [
  {
    teacherId: '', // 将在创建导师后填入
    walletAddress: '11111111111111111111111111111111',
    rating: 5,
    content: '张教授是我遇到过最好的导师之一！他在学术上要求严格，但同时也非常耐心地指导学生。在他的指导下，我不仅学到了扎实的专业知识，还培养了独立思考和解决问题的能力。强烈推荐！'.repeat(2)
  },
  {
    teacherId: '',
    walletAddress: '22222222222222222222222222222222',
    rating: 4,
    content: '张教授的研究水平很高，经常能给出很有价值的建议。不过有时候比较忙，约时间讨论需要提前预约。总体来说是很好的导师。'.repeat(2)
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 开始初始化数据库...');
    
    await connectDB();
    
    // 清空现有数据
    await TeacherModel.deleteMany({});
    await CommentModel.deleteMany({});
    console.log('✅ 清空现有数据完成');
    
    // 创建导师数据
    const createdTeachers = await TeacherModel.insertMany(sampleTeachers);
    console.log(`✅ 创建了 ${createdTeachers.length} 个导师`);
    
    // 为第一个导师创建评价
    if (createdTeachers.length > 0) {
      const teacherId = createdTeachers[0]._id.toString();
      const reviewsWithTeacherId = sampleReviews.map(review => ({
        teacher: teacherId,
        walletAddress: review.walletAddress,
        rating: review.rating,
        content: review.content
      }));

      const createdReviews = await CommentModel.insertMany(reviewsWithTeacherId);
      console.log(`✅ 创建了 ${createdReviews.length} 条评论`);
    }
    
    console.log('🎉 数据库初始化完成！');
    console.log('📊 数据统计:');
    console.log(`   - 导师数量: ${await TeacherModel.countDocuments()}`);
    console.log(`   - 评论数量: ${await CommentModel.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  } finally {
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;