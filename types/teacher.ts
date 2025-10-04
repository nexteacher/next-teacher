// 导师基本信息类型定义
export interface Teacher {
  _id?: string;
  name: string;                    // 导师姓名 (必填)
  title?: string;                  // 职称 (可选)
  department?: string;             // 所属院系 (可选)
  university: string;              // 所属大学 (必填)
  email?: string | null;           // 邮箱 (可选)
  homepage?: string;              // 个人主页 (可选)
  researchAreas?: string[];        // 研究领域 (可选)
  education?: EducationBackground[]; // 教育背景 (可选)
  experience?: WorkExperience[];    // 工作经历 (可选)
  awards?: string[];               // 获奖情况 (可选)
  avatar?: string;               // 头像URL (可选)
  isActive: boolean;               // 是否在职
  createdAt: Date;                 // 创建时间
  updatedAt: Date;                 // 更新时间
  source: 'user' | 'admin' | 'imported'; // 数据来源
  importedFrom?: string;        // 如果是导入的数据, 记录来源 (可选)
}

// 教育背景
export interface EducationBackground {
  degree: string;                  // 学位 (学士、硕士、博士)
  major: string;                   // 专业
  university: string;              // 毕业院校
  year: number;                    // 毕业年份
}

// 工作经历
export interface WorkExperience {
  position: string;                // 职位
  institution: string;             // 机构
  startYear: number;               // 开始年份
  endYear?: number;                // 结束年份 (可选，表示至今)
  description?: string;            // 工作描述 (可选)
}


// 搜索过滤条件
export interface TeacherFilter {
  university?: string;             // 大学筛选
  department?: string;             // 院系筛选
  researchArea?: string;           // 研究领域筛选
  minRating?: number;              // 最低评分
  tags?: string[];                 // 标签筛选
}

// 排序选项
export type SortOption = 'rating' | 'reviewCount' | 'name' | 'createdAt';
export type SortOrder = 'asc' | 'desc';