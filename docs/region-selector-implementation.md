# 全站地区选择器实现文档

## 功能概述

在网站头部添加了地区选择器，实现全站按地区筛选教师的功能。用户可以选择不同地区（如中国大陆、美国、日本等），系统会自动过滤并仅显示该地区的教师。

## 实现细节

### 1. 地区选择器组件 (`components/RegionSelector.tsx`)

**功能特点：**
- 硬编码的地区列表（13个地区）
- 使用 Cookie 保存用户选择的地区偏好（有效期 365 天）
- 切换地区时自动刷新页面以应用新的过滤条件
- 避免 SSR 水合不匹配问题
- 响应式设计（小屏幕隐藏"地区"文字）

**支持的地区：**
```typescript
CN - 中国大陆（默认）
HK - 中国香港
TW - 中国台湾
MO - 中国澳门
US - 美国
UK - 英国
CA - 加拿大
AU - 澳大利亚
JP - 日本
KR - 韩国
SG - 新加坡
DE - 德国
FR - 法国
```

### 2. 全局布局集成 (`components/ClientLayout.tsx`)

地区选择器已添加到全局导航栏的右侧控件区域，位于钱包按钮左侧：

```tsx
<div className="hidden sm:block">
  <RegionSelector />
</div>
```

### 3. API 路由修改

所有教师相关的 API 都已支持按地区过滤：

#### a. 教师结构 API (`/api/teachers/structure`)
- 读取 Cookie 中的地区设置
- 在聚合查询中添加 `region` 过滤条件
- 返回当前选中的地区信息

**修改内容：**
```typescript
const cookieStore = await cookies();
const region = cookieStore.get('region')?.value || 'CN';

const matchStage = { 
  isActive: { $ne: false },
  region: region // 添加地区过滤
}
```

#### b. 按院系查询 API (`/api/teachers/by-department`)
- 在查询条件中添加地区过滤
- 确保展开院系时只显示当前地区的教师

#### c. 搜索 API (`/api/teachers/search`)
- 在搜索过滤条件中添加地区限制
- 搜索结果自动限制在当前选中的地区内
- 返回字段中包含 `region` 信息

### 4. 工作原理

```
用户选择地区
    ↓
保存到 Cookie (region=XX)
    ↓
页面自动刷新
    ↓
服务端读取 Cookie
    ↓
API 查询添加 region 过滤
    ↓
返回该地区的教师数据
```

## 使用示例

### 前端访问流程

1. 用户访问网站，默认显示"中国大陆"的教师
2. 点击头部地区选择器，选择"美国"
3. 页面自动刷新，显示所有美国地区的教师
4. 下次访问时自动记住用户的地区偏好

### Cookie 格式

```
region=US; expires=Sun, 05 Oct 2026 12:00:00 GMT; path=/
```

## 测试验证

### 1. 基本功能测试

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 并验证：

1. ✅ 头部显示地区选择器（默认"中国大陆"）
2. ✅ 选择其他地区后页面自动刷新
3. ✅ 教师列表仅显示选中地区的教师
4. ✅ 刷新页面后地区选择保持不变

### 2. API 测试

```bash
# 测试结构 API（设置 region cookie）
curl -H "Cookie: region=US" http://localhost:3000/api/teachers/structure

# 测试搜索 API
curl -H "Cookie: region=JP" http://localhost:3000/api/teachers/search?q=张

# 测试按院系查询 API
curl -H "Cookie: region=CN" \
  http://localhost:3000/api/teachers/by-department?university=清华大学&department=计算机系
```

### 3. 数据分布测试

使用迁移脚本查看各地区的教师分布：

```bash
npm run migrate:add-region
```

输出示例：
```
📊 按地区统计：
   CN: 17388 位教师
```

## 性能优化

1. **缓存策略**
   - API 响应设置了 5 分钟缓存
   - 使用 `Cache-Control` 头优化性能

2. **Cookie 持久化**
   - 365 天有效期，减少重复选择
   - 路径设置为 `/`，全站共享

3. **SSR 优化**
   - 组件使用客户端渲染避免水合错误
   - 加载状态显示骨架屏

## 注意事项

1. **数据完整性**
   - 所有教师记录必须有 `region` 字段
   - 已通过迁移脚本更新所有现有记录

2. **默认值**
   - 未设置 Cookie 时默认为 'CN'（中国大陆）
   - 新创建的教师默认为 'CN'

3. **区分大小写**
   - region 字段在数据库中存储为大写
   - API 自动转换为大写

## 相关文件

### 新增文件
- `components/RegionSelector.tsx` - 地区选择器组件

### 修改文件
- `components/ClientLayout.tsx` - 添加地区选择器
- `app/api/teachers/structure/route.ts` - 支持地区过滤
- `app/api/teachers/by-department/route.ts` - 支持地区过滤
- `app/api/teachers/search/route.ts` - 支持地区过滤

### 数据模型
- `models/Teacher.ts` - 包含 region 字段
- `types/teacher.ts` - TypeScript 类型定义

## 未来扩展

1. **添加更多地区**
   - 在 `REGIONS` 数组中添加新的地区代码和名称
   - 确保数据库中有对应地区的教师数据

2. **地区统计信息**
   - 在地区选择器中显示每个地区的教师数量
   - 添加地区热度排行

3. **多语言支持**
   - 根据用户选择的地区自动切换界面语言
   - 地区名称支持多语言显示

## 故障排除

### 问题：选择地区后没有数据
**解决方案：**
- 确认该地区是否有教师数据
- 运行迁移脚本确保所有教师都有 region 字段
- 检查数据库中的 region 值是否为大写

### 问题：Cookie 未保存
**解决方案：**
- 检查浏览器是否允许 Cookie
- 确认域名和路径设置正确
- 清除浏览器缓存后重试

### 问题：页面未刷新
**解决方案：**
- 检查 `window.location.reload()` 是否被阻止
- 确认没有 JavaScript 错误
- 尝试硬刷新（Ctrl+Shift+R）

