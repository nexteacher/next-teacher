import mongoose, { Schema, model, models } from 'mongoose';
import { Teacher, EducationBackground, WorkExperience } from '@/types/teacher';

// 教育背景子模式
const EducationBackgroundSchema = new Schema<EducationBackground>({
  degree: { type: String, required: true },
  major: { type: String, required: true },
  university: { type: String, required: true },
  year: { type: Number, required: true }
}, { _id: false });

// 工作经历子模式
const WorkExperienceSchema = new Schema<WorkExperience>({
  position: { type: String, required: true },
  institution: { type: String, required: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number },
  description: { type: String }
}, { _id: false });


// 导师主模式
const TeacherSchema = new Schema<Teacher>({
  name: {
    type: String,
    required: [true, '导师姓名是必填项'],
    trim: true,
    maxlength: [50, '导师姓名不能超过50个字符']
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  university: {
    type: String,
    required: [true, '所属大学是必填项'],
    trim: true
  },
  region: {
    type: String,
    required: true,
    default: 'CN',
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,  // 允许多个null值
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址'],
    default: null
  },
  homepage: {
    type: String,
    match: [/^https?:\/\/.+/, '请输入有效的个人主页URL'],
    default: ''
  },
  avatar: {
    type: String,
    default: '/images/default-avatar.png'
  },
  researchAreas: {
    type: [String],
    default: []
  },
  education: {
    type: [EducationBackgroundSchema],
    default: []
  },
  experience: {
    type: [WorkExperienceSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['user', 'admin', 'imported'],
    default: 'admin'
  },
  importedFrom: {
    type: String
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 创建索引以提高查询性能
TeacherSchema.index({ name: 'text', department: 'text', university: 'text' });
TeacherSchema.index({ university: 1, department: 1 });
TeacherSchema.index({ researchAreas: 1 });
TeacherSchema.index({ isActive: 1 });

// 虚拟字段：完整姓名和职称
TeacherSchema.virtual('fullTitle').get(function() {
  return `${this.title} ${this.name}`;
});


// 中间件：保存前验证
TeacherSchema.pre('save', function(next) {
  // 移除了研究领域和教育背景的必填验证
  // 允许创建没有这些信息的教师记录
  next();
});

// 静态方法：按大学和院系查找导师
TeacherSchema.statics.findByUniversityAndDepartment = function(university: string, department?: string) {
  const query: { university: string; isActive: boolean; department?: string } = { university, isActive: true };
  if (department) {
    query.department = department;
  }
  return this.find(query);
};

// 静态方法：按研究领域查找导师
TeacherSchema.statics.findByResearchArea = function(researchArea: string) {
  return this.find({ 
    researchAreas: { $in: [researchArea] }, 
    isActive: true 
  });
};


// 防止重复编译模型
const TeacherModel = models.Teacher || model<Teacher>('Teacher', TeacherSchema);

export default TeacherModel;