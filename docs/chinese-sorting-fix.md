# 中文排序问题修复文档

## 修复时间
2025年10月5日

## 问题描述

在使用分页加载大学列表时，发现大学的排序不是按照字母/拼音顺序排列的。例如：
- **期望**：安徽大学、北京大学、三峡大学...（按拼音首字母 A、B、S 排序）
- **实际**：三峡大学、安徽大学...（按 Unicode 编码排序）

## 根本原因

MongoDB 的默认排序使用 Unicode 编码顺序，而不是中文拼音顺序。对于中文字符：
- Unicode 编码顺序：根据字符的 Unicode 码点排序
- 拼音顺序：根据汉字的拼音首字母排序

例如：
- "三" 的 Unicode: U+4E09
- "安" 的 Unicode: U+5B89

因为 `0x4E09 < 0x5B89`，所以在默认排序中"三峡大学"会排在"安徽大学"之前。

## 解决方案

在所有涉及中文排序的 MongoDB 查询中添加 `collation` 选项：

```typescript
.collation({ locale: 'zh', strength: 2 })
```

### 参数说明：
- `locale: 'zh'`：指定中文（Chinese）排序规则
- `strength: 2`：设置比较强度
  - `1`：只比较基本字符（忽略大小写、重音等）
  - `2`：比较基本字符和重音（推荐用于中文）
  - `3`：比较基本字符、重音和大小写

## 修复的文件和位置

### 1. `/app/api/teachers/structure/route.ts`
**修复位置**：
- 第 41 行：获取所有学校的聚合查询
- 第 95 行：获取学校详细结构的聚合查询

**代码示例**：
```typescript
const allUniversities = await TeacherModel.aggregate([
  { $match: matchStage },
  { $group: { _id: { $ifNull: ['$university', '未知学校'] } } },
  { $sort: { _id: 1 } }
]).collation({ locale: 'zh', strength: 2 }); // ✅ 添加中文排序
```

### 2. `/app/api/teachers/list/route.ts`
**修复位置**：第 24 行

**代码示例**：
```typescript
const teachers = await TeacherModel.find(...)
  .sort({ university: 1, department: 1, name: 1 })
  .collation({ locale: 'zh', strength: 2 }) // ✅ 添加中文排序
  .lean();
```

### 3. `/app/api/teachers/by-department/route.ts`
**修复位置**：第 47 行

**代码示例**：
```typescript
const teachers = await TeacherModel.find(...)
  .sort({ name: 1 })
  .collation({ locale: 'zh', strength: 2 }) // ✅ 添加中文排序
  .lean();
```

### 4. `/app/api/teachers/search/route.ts`
**修复位置**：第 52 行

**代码示例**：
```typescript
const results = await TeacherModel.find(...)
  .sort({ university: 1, department: 1, name: 1 })
  .collation({ locale: 'zh', strength: 2 }) // ✅ 添加中文排序
  .limit(limit)
  .lean();
```

## 测试验证

### 预期结果：

现在大学列表应该按照拼音首字母排序：

```
A
- 安徽大学 (Anhui)
- 澳门大学 (Aomen)

B
- 北京大学 (Beijing)
- 北京理工大学 (Beijing Ligong)

C
- 长安大学 (Chang'an)

...

S
- 三峡大学 (Sanxia)
- 山东大学 (Shandong)
```

### 测试步骤：

1. **清除缓存**：确保不使用旧数据
   ```bash
   # 如果有 Redis 或其他缓存，清除它
   # MongoDB 查询会立即使用新的 collation
   ```

2. **测试首页**：
   - 打开首页 `/`
   - 向下滚动加载更多大学
   - 验证大学按拼音顺序排列

3. **测试搜索页**：
   - 打开搜索页 `/search`
   - 搜索关键词
   - 验证结果按拼音顺序排列

4. **测试 API**：
   ```bash
   # 测试 structure API
   curl http://localhost:3000/api/teachers/structure?page=1&limit=10
   
   # 测试 list API
   curl http://localhost:3000/api/teachers/list
   
   # 测试 search API
   curl http://localhost:3000/api/teachers/search?q=大学
   ```

## 影响范围

### ✅ 已修复的功能：
1. 首页大学列表排序
2. 分页加载时的大学顺序
3. 搜索结果排序
4. 院系内教师列表排序
5. 所有涉及大学、院系、教师名称的排序

### ⚠️ 注意事项：
1. **性能影响**：添加 `collation` 可能会对查询性能有轻微影响，但对于项目规模来说可以忽略不计
2. **索引优化**：如果需要进一步优化性能，可以考虑创建带 collation 的索引：
   ```javascript
   db.teachers.createIndex(
     { university: 1 },
     { collation: { locale: 'zh', strength: 2 } }
   );
   ```

## MongoDB Collation 参考

### 常用 locale：
- `zh`：中文（按拼音排序）
- `en`：英文
- `ja`：日文
- `ko`：韩文

### Strength 级别：
- `1`：Primary - 只比较基本字符
- `2`：Secondary - 比较基本字符和重音（推荐中文使用）
- `3`：Tertiary - 比较基本字符、重音和大小写
- `4`：Quaternary - 比较所有差异，包括标点符号
- `5`：Identical - 完全相同

### 更多选项：
```typescript
{
  locale: 'zh',
  strength: 2,
  caseLevel: false,      // 是否区分大小写
  numericOrdering: true, // 数字按数值排序（如 "1" < "10"）
  normalization: false   // Unicode 规范化
}
```

## 相关资源

- [MongoDB Collation 文档](https://docs.mongodb.com/manual/reference/collation/)
- [MongoDB 中文排序指南](https://docs.mongodb.com/manual/reference/collation-locales-defaults/#chinese-collation)
- [Unicode 排序算法](http://www.unicode.org/reports/tr10/)

## 总结

通过在所有涉及中文排序的查询中添加 `.collation({ locale: 'zh', strength: 2 })`，我们成功修复了大学、院系和教师名称的排序问题。现在所有列表都会按照中文拼音顺序正确排列，提供了更好的用户体验。

## 版本信息

- MongoDB 版本：需要 >= 3.4（首次引入 collation 支持）
- Mongoose 版本：项目使用的版本已支持 collation
- Node.js 版本：项目使用的版本已支持

