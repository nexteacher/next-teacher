# Region 字段更新说明

## 问题描述
在前端页面修改教师的地区（region）字段后，刷新页面发现修改没有保存，仍然显示为"中国大陆"。

## 原因分析
PUT `/api/teachers/[id]` API 路由中缺少对 `region` 字段的处理逻辑，导致前端提交的 region 值被忽略。

## 修复内容

### 1. 添加 region 字段更新逻辑
在 `app/api/teachers/[id]/route.ts` 的 PUT 方法中添加了 region 字段的处理：

```typescript
// region 字段处理（必须是大写的英文缩写）
if (typeof updateData.region === 'string') {
  const region = updateData.region.trim().toUpperCase();
  if (region === '') { 
    setPayload.region = 'CN'; // region 是必填字段，空时设为默认值
  } else {
    setPayload.region = region;
  }
}
```

### 2. 字段处理特点
- 自动转换为大写（符合数据库字段要求）
- 去除首尾空格
- 如果为空，自动设置为默认值 'CN'

## 验证步骤

1. 启动开发服务器（如果未启动）：
   ```bash
   npm run dev
   ```

2. 访问任意教师详情页面

3. 点击"完善导师信息"按钮进入编辑模式

4. 在地区下拉选择器中选择其他地区（如"日本"）

5. 点击"签名并保存"按钮

6. 刷新页面，确认地区已正确保存和显示

## 支持的地区列表

- CN - 中国大陆（默认）
- HK - 中国香港
- TW - 中国台湾
- MO - 中国澳门
- US - 美国
- UK - 英国
- CA - 加拿大
- AU - 澳大利亚
- JP - 日本
- KR - 韩国
- SG - 新加坡
- DE - 德国
- FR - 法国

## 数据库迁移

所有现有的教师记录已通过迁移脚本添加了默认的 region 字段（CN）：

```bash
npm run migrate:add-region
```

迁移结果：17,388 位教师已成功更新。

## 相关文件

- `app/api/teachers/[id]/route.ts` - API 路由（修复）
- `app/teachers/[id]/TeacherDetailClient.tsx` - 教师详情页（前端显示和编辑）
- `app/admin/teachers/[id]/page.tsx` - 管理员教师详情页（前端显示和编辑）
- `models/Teacher.ts` - 教师数据模型
- `types/teacher.ts` - TypeScript 类型定义
- `scripts/migrate-add-region.ts` - 数据库迁移脚本

