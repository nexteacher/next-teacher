# 地区选择器同步问题修复

## 问题描述

用户报告："选择器选择的地区和页面显示的完全不对上"

这个问题是由于客户端 Cookie 和服务端读取的 Cookie 不同步造成的。

## 根本原因

1. **Cookie 属性缺失**：原来的 Cookie 没有设置 `SameSite` 属性，可能导致浏览器在某些情况下不发送 Cookie
2. **缓存问题**：API 请求使用了浏览器缓存，导致切换地区后获取的还是旧数据
3. **视觉反馈缺失**：用户无法直观看到当前页面实际显示的是哪个地区的数据

## 修复内容

### 1. 修复 Cookie 设置 (`components/RegionSelector.tsx`)

**修改前：**
```typescript
document.cookie = `${name}=${value}; expires=${expires}; path=/`;
```

**修改后：**
```typescript
document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
```

添加了 `SameSite=Lax` 属性，确保：
- Cookie 在同站请求中总是发送
- 提高 Cookie 的兼容性和安全性
- 符合现代浏览器的 Cookie 策略

### 2. 禁用 API 缓存 (`app/page.tsx`, `app/admin/database/page.tsx`)

**修改前：**
```typescript
const response = await fetch('/api/teachers/structure');
```

**修改后：**
```typescript
const response = await fetch('/api/teachers/structure', {
  cache: 'no-store' // 禁用缓存，确保获取最新数据
});
```

确保每次请求都从服务端获取最新数据，而不是使用缓存的响应。

### 3. 添加当前地区显示

在首页和管理员页面添加了明确的地区显示：

```tsx
<div className="text-sm text-gray-500">
  当前地区：<span className="font-medium text-gray-900">{currentRegion.name}</span>
  {structure.length > 0 && (
    <span className="ml-2 text-gray-400">
      ({教师总数} 位教师)
    </span>
  )}
</div>
```

**显示内容包括：**
- 当前选中的地区名称
- 该地区的教师总数

### 4. 创建调试工具 (`components/RegionDebug.tsx`)

创建了一个调试组件，仅在开发环境显示，用于：
- 显示客户端读取的 Cookie 值
- 显示服务端返回的地区值
- 检查两者是否同步
- 显示所有 Cookie 内容

## 测试步骤

### 1. 清理测试环境

```bash
# 清除浏览器所有 Cookie
# 在浏览器开发者工具中：Application > Cookies > 删除所有
```

### 2. 基本功能测试

1. 访问首页 http://localhost:3000
2. 检查页面左上角显示："当前地区：中国大陆 (17388 位教师)"
3. 检查右上角地区选择器显示"中国大陆"
4. 两者应该一致

### 3. 切换地区测试

1. 点击地区选择器，选择"美国"
2. 页面应该自动刷新
3. 刷新后检查：
   - 左上角显示："当前地区：美国 (0 位教师)"
   - 右上角选择器显示"美国"
   - 教师列表为空（因为没有美国地区的数据）

### 4. 持久化测试

1. 选择任意地区（如"日本"）
2. 刷新页面（F5）
3. 关闭浏览器标签页
4. 重新打开 http://localhost:3000
5. 地区选择应该保持为"日本"

### 5. Cookie 验证

使用浏览器开发者工具检查 Cookie：

```
名称: region
值: JP (或其他地区代码)
路径: /
过期时间: 1 年后
SameSite: Lax
```

### 6. 开发环境调试

在开发环境中，页面右下角会显示调试面板：

```
🐛 地区调试信息
客户端 Cookie: JP
服务端读取: JP
✅ Cookie 同步正常
```

如果显示 ❌，说明存在同步问题。

## 常见问题排查

### 问题 1：切换地区后数据没变化

**可能原因：**
- 浏览器缓存问题
- Service Worker 缓存问题

**解决方案：**
```bash
# 1. 硬刷新页面 (Ctrl+Shift+R / Cmd+Shift+R)
# 2. 清除浏览器缓存
# 3. 在开发者工具中禁用缓存
```

### 问题 2：选择器显示的地区和页面不一致

**可能原因：**
- Cookie 未正确设置
- 请求头中未包含 Cookie

**解决方案：**
```bash
# 1. 检查浏览器控制台是否有 Cookie 相关错误
# 2. 检查网络请求头中是否包含 Cookie
# 3. 确认域名和路径设置正确
# 4. 查看调试面板的详细信息
```

### 问题 3：页面显示 0 位教师

**可能原因：**
- 该地区确实没有教师数据
- 数据库中的 region 字段值不匹配

**解决方案：**
```bash
# 1. 检查数据库中是否有该地区的教师
db.teachers.count({ region: "JP", isActive: true })

# 2. 如果需要，运行迁移脚本确保所有教师都有 region 字段
npm run migrate:add-region

# 3. 手动添加测试数据
```

## API 请求流程

```
1. 用户点击地区选择器
   ↓
2. 设置 Cookie: region=US; SameSite=Lax; path=/
   ↓
3. 页面刷新 (window.location.reload())
   ↓
4. 浏览器发送请求到 /api/teachers/structure
   请求头包含: Cookie: region=US
   ↓
5. 服务端读取 Cookie
   const region = cookies().get('region')?.value || 'CN';
   ↓
6. 数据库查询
   TeacherModel.find({ region: 'US', isActive: true })
   ↓
7. 返回数据
   { success: true, data: [...], region: 'US' }
   ↓
8. 页面渲染
   显示: "当前地区：美国 (X 位教师)"
```

## 性能优化建议

1. **考虑使用 URL 参数**
   - 优点：更好的 SEO，可分享的 URL
   - 缺点：需要更多代码修改
   
2. **添加地区切换动画**
   - 改善用户体验
   - 明确告知用户正在切换

3. **预加载相邻地区数据**
   - 提高切换速度
   - 减少等待时间

## 相关文件

- `components/RegionSelector.tsx` - 地区选择器（修复 Cookie）
- `components/RegionDebug.tsx` - 调试工具（新增）
- `app/page.tsx` - 首页（添加地区显示）
- `app/admin/database/page.tsx` - 管理页（添加地区显示）
- `app/api/teachers/structure/route.ts` - 结构 API（已支持地区）
- `app/api/teachers/by-department/route.ts` - 院系 API（已支持地区）
- `app/api/teachers/search/route.ts` - 搜索 API（已支持地区）

## 验证清单

- [x] Cookie 设置包含 SameSite 属性
- [x] API 请求禁用缓存
- [x] 页面显示当前地区名称
- [x] 地区选择器和页面显示一致
- [x] 切换地区后数据正确过滤
- [x] 地区选择持久化（刷新页面保持）
- [x] 创建调试工具辅助排查
- [ ] 所有地区都有测试数据（可选）
- [ ] 生产环境测试（待部署后）

