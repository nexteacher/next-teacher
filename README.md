# NexTeacher - Web3 导师评价平台

<div align="center">
  <img src="public/nt_logo.png" alt="NexTeacher Logo" width="120" height="120">
  
  **匿名透明导师信息 Wiki 与评价系统**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6-green)](https://www.mongodb.com/)
  [![Solana](https://img.shields.io/badge/Solana-Web3-purple)](https://solana.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
</div>

## 项目概述

NexTeacher 是一个基于 Web3 技术的导师信息汇总与评价平台，旨在为学生提供真实、透明的导师评价信息，帮助研究生和博士生选择合适的研究导师。平台采用 Solana 签名作为身份验证机制，确保所有交互的高度匿名性和透明度。

### 核心特性

- **🔐 身份验证** - 使用 Solana 钱包签名作为唯一身份标识
- **🛡️ 防恶意攻击** - 社区投票系统自动识别和过滤恶意内容
- **📊 透明评价** - 所有评价和导师信息都经过社区验证
- **🌐 完全开源** - 免费使用，代码完全开源
- **⚡ 高性能** - 基于 Next.js 15 和 Vercel 无服务器架构

## 技术架构

### 前端技术栈
- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS 4
- **语言**: TypeScript
- **钱包集成**: Solana Wallet Adapter

### 后端技术栈
- **运行时**: Node.js (Vercel Serverless)
- **数据库**: MongoDB Atlas
- **身份验证**: Solana 钱包签名验证
- **加密**: TweetNaCl 签名验证

### Web3 集成
- **网络**: Solana 主网
- **签名算法**: Ed25519
- **钱包支持**: Phantom, Solflare, Backpack 等主流 Solana 钱包

## 核心功能

### 1. 导师信息管理
- 创建和编辑导师档案
- 支持教育背景、工作经历、研究领域等信息
- 自动生成随机邮箱（如未提供）
- 支持个人主页链接

### 2. 评价系统
- 匿名评价和评论
- 多维度评分（教学、科研、指导等）
- 评价点赞/点踩机制
- 社区投票验证评价质量

### 3. 众包完善
- 按信息缺失程度排序导师
- 贡献排行榜
- 实时统计信息
- 社区协作完善导师信息

### 4. 搜索与筛选
- 按大学、院系、研究领域筛选
- 全文搜索功能
- 分页浏览
- 快速导航

## 安全机制

### 签名验证流程
1. 用户操作时生成包含时间戳的签名消息
2. 使用 Solana 钱包对消息进行签名
3. 服务端验证签名和时间戳有效性
4. 签名有效期内（5分钟）允许操作

### 防恶意攻击
- 所有内容都需要钱包签名验证
- 社区投票系统识别低质量内容
- 时间戳验证防止重放攻击
- 唯一性约束防止重复操作

## 快速开始

### 环境要求
- Node.js 18+
- MongoDB 数据库
- Solana 钱包（Phantom 推荐）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/next-teacher.git
cd next-teacher
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
创建 `.env.local` 文件：
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexteacher?retryWrites=true&w=majority
```

4. **初始化数据库**
```bash
npm run seed
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 部署指南

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量 `MONGODB_URI`
4. 自动部署完成

### 其他平台部署

确保平台支持：
- Node.js 18+
- MongoDB 连接
- 环境变量配置

## 开发指南

### 项目结构
```
next-teacher/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── teachers/          # 导师页面
│   ├── crowdsource/       # 众包页面
│   └── search/           # 搜索页面
├── components/            # React 组件
├── lib/                   # 工具库
│   ├── mongodb.ts         # 数据库连接
│   └── walletAuth.ts      # 钱包验证
├── models/                # Mongoose 模型
├── types/                 # TypeScript 类型
└── public/                # 静态资源
```

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Tailwind CSS 工具类
- 组件采用函数式写法
- API 路由统一错误处理

### 添加新功能
1. 在 `types/` 中定义类型
2. 在 `models/` 中创建 Mongoose 模型
3. 在 `app/api/` 中创建 API 路由
4. 在 `components/` 中创建 UI 组件
5. 在 `app/` 中创建页面

## 路线图

### 已完成功能
- ✅ Solana 钱包集成
- ✅ 导师信息管理
- ✅ 评价和评论系统
- ✅ 社区投票机制
- ✅ 众包信息完善
- ✅ 搜索和筛选功能

### 开发中功能
- 🔄 完善众包系统
- 🔄 钱包行为浏览器查询
- 🔄 社区投票自动删除恶意数据

### 计划功能
- 📋 代币经济系统
- 📋 高级数据分析
- 📋 移动端应用
- 📋 多语言支持

## 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目地址: [https://nexteacher.wiki](https://nexteacher.wiki)
- 问题反馈: [GitHub Issues](https://github.com/nexteacher/next-teacher/issues)
- 讨论交流: [GitHub Discussions](https://github.com/nexteacher/next-teacher/discussions)

---

<div align="center">
  <p>本项目由生成式 AI 生成</p>
</div>