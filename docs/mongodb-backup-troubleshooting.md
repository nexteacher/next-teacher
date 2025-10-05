# MongoDB 备份 CI 故障排查指南

## 问题：连接到 localhost 而不是实际的 MongoDB

### 错误信息
```
Failed: can't create session: failed to connect to mongodb://localhost/
```

这个错误说明 `MONGODB_URI` 环境变量**没有被正确读取**，mongodump 使用了默认的 localhost 连接。

## 🔍 排查步骤

### 1. 检查 Secret 名称是否完全匹配

**非常重要**：Secret 名称必须**完全一致**，包括大小写！

✅ 正确：`MONGODB_URI`  
❌ 错误：`mongodb_uri`、`MongoDB_URI`、`MONGO_URI`

#### 检查方法：
1. 访问 GitHub 仓库
2. 进入 `Settings` → `Secrets and variables` → `Actions`
3. 在 `Repository secrets` 列表中，确认 secret 名称是否**完全**为 `MONGODB_URI`

### 2. 重新创建 Secret

有时候 Secret 可能没有正确保存，尝试重新创建：

1. 如果列表中已有 `MONGODB_URI`，点击它，然后点击 `Remove secret` 删除
2. 点击 `New repository secret`
3. **Name**（必须完全一致）：`MONGODB_URI`
4. **Secret**：粘贴你的 MongoDB 连接字符串
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```
5. 点击 `Add secret`

### 3. 验证 MongoDB URI 格式

确保你的连接字符串格式正确：

#### MongoDB Atlas 格式（推荐）：
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority
```

#### 标准 MongoDB 格式：
```
mongodb://username:password@host:port/database
```

#### 常见错误：
- ❌ 缺少 `mongodb://` 或 `mongodb+srv://` 前缀
- ❌ 密码包含特殊字符但没有 URL 编码
- ❌ 连接字符串包含换行符或空格

### 4. 密码特殊字符处理

如果你的密码包含特殊字符（如 `@`、`:`、`/`、`?` 等），需要进行 URL 编码：

| 字符 | URL 编码 |
|-----|---------|
| @   | %40     |
| :   | %3A     |
| /   | %2F     |
| ?   | %3F     |
| #   | %23     |
| &   | %26     |

**示例**：
- 原密码：`p@ssw0rd!`
- 编码后：`p%40ssw0rd!`
- 完整 URI：`mongodb+srv://user:p%40ssw0rd!@cluster.mongodb.net/db`

### 5. 查看运行日志验证

修改后，重新运行工作流并查看日志：

1. 进入 `Actions` 页面
2. 点击失败的运行记录
3. 查看 `验证 MongoDB URI 配置` 步骤的输出

**期望看到**：
```
✅ MONGODB_URI 已配置 (前缀: mongodb+srv://user:...)
```

**如果看到错误**：
```
❌ 错误：MONGODB_URI 未设置
```
说明 Secret 没有正确配置或名称不匹配。

### 6. 检查分支保护规则

如果仓库有分支保护规则，确保 Actions 有权限访问 secrets：

1. `Settings` → `Branches`
2. 检查是否有规则限制 secrets 访问
3. 如有需要，调整规则允许 Actions 访问

### 7. 检查 MongoDB Atlas IP 白名单

如果使用 MongoDB Atlas，需要允许 GitHub Actions 访问：

1. 登录 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 选择你的 Project 和 Cluster
3. 点击 `Network Access`（左侧菜单）
4. 点击 `ADD IP ADDRESS`
5. 选择 `ALLOW ACCESS FROM ANYWHERE`，或输入 `0.0.0.0/0`
6. 点击 `Confirm`

> ⚠️ **注意**：允许所有 IP 访问会降低安全性。建议在 MongoDB Atlas 中设置强密码和数据库用户权限。

### 8. 测试连接字符串

在本地测试你的连接字符串是否有效：

```bash
# 安装 mongodump（如果还没有）
# macOS
brew tap mongodb/brew
brew install mongodb-database-tools

# 测试连接（替换为你的实际 URI）
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/database" --out="test-backup"
```

如果本地测试成功，但 CI 失败，问题可能在于：
- Secret 配置不正确
- MongoDB 网络访问限制

## 🔄 完整的重新配置步骤

如果以上都不行，请按以下步骤完整重新配置：

### 步骤 1：删除现有 Secret
1. `Settings` → `Secrets and variables` → `Actions`
2. 找到 `MONGODB_URI`，点击删除

### 步骤 2：准备正确的连接字符串
从 MongoDB Atlas 获取：
1. 进入 Cluster 页面
2. 点击 `Connect` 按钮
3. 选择 `Connect your application`
4. 复制连接字符串
5. 将 `<password>` 替换为实际密码（注意特殊字符编码）
6. 将 `<database>` 替换为实际数据库名

### 步骤 3：创建新 Secret
1. 点击 `New repository secret`
2. Name: `MONGODB_URI`（逐字输入，不要复制粘贴以避免隐藏字符）
3. Secret: 粘贴准备好的连接字符串（确保没有前后空格或换行）
4. 点击 `Add secret`

### 步骤 4：手动触发测试
1. 进入 `Actions` 页面
2. 选择 `MongoDB 数据库备份`
3. 点击 `Run workflow`
4. 查看运行日志

## 📝 快速检查清单

- [ ] Secret 名称是 `MONGODB_URI`（完全匹配，大小写一致）
- [ ] Secret 值是完整的 MongoDB 连接字符串
- [ ] 连接字符串以 `mongodb://` 或 `mongodb+srv://` 开头
- [ ] 密码中的特殊字符已进行 URL 编码
- [ ] MongoDB Atlas 的 IP 白名单包含 `0.0.0.0/0`
- [ ] Workflow permissions 设置为 `Read and write permissions`
- [ ] 在本地测试过连接字符串可以正常工作

## 💡 调试技巧

如果还是不行，可以临时添加调试步骤（**完成后记得删除，以免泄露敏感信息**）：

```yaml
- name: 调试信息
  run: |
    echo "当前环境变量："
    env | grep -i mongo || echo "未找到 MONGO 相关环境变量"
```

## 需要帮助？

如果按照以上步骤仍然无法解决，请检查：
1. GitHub Actions 运行日志的完整输出
2. Secret 配置的截图（不要显示 Secret 值）
3. MongoDB Atlas Network Access 配置

