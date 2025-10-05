# MongoDB 自动备份 CI 配置说明

## 功能概述

这个 GitHub Actions 工作流会自动执行以下操作：
- ✅ 每天北京时间零点自动备份 MongoDB 数据库
- ✅ 将备份压缩成 `.tar.gz` 格式
- ✅ 自动创建 GitHub Release 并上传备份文件
- ✅ 使用日期作为版本号（例如：`backup-2025-10-05`）
- ✅ 自动清理超过 30 天的旧备份
- ✅ 支持手动触发备份

## 配置步骤

### 1. 设置 GitHub Secrets

在 GitHub 仓库中添加 MongoDB 连接字符串：

1. 访问你的 GitHub 仓库
2. 进入 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 添加以下 secret：
   - **Name**: `MONGODB_URI`
   - **Secret**: 你的 MongoDB 连接字符串（例如：`mongodb+srv://username:password@cluster.mongodb.net/database`）

### 2. 确认 GitHub Token 权限

确保 GitHub Actions 有权限创建 Releases：

1. 进入 `Settings` → `Actions` → `General`
2. 滚动到 `Workflow permissions`
3. 选择 `Read and write permissions`
4. 勾选 `Allow GitHub Actions to create and approve pull requests`
5. 点击 `Save`

## 使用方法

### 自动备份

工作流会在每天北京时间零点（UTC 16:00）自动运行，无需手动操作。

### 手动触发备份

如果需要立即执行备份：

1. 进入 GitHub 仓库的 `Actions` 页面
2. 选择 `MongoDB 数据库备份` 工作流
3. 点击 `Run workflow` 按钮
4. 选择分支（通常是 `master`）
5. 点击 `Run workflow` 确认

## 查看和下载备份

1. 进入仓库的 `Releases` 页面
2. 找到对应日期的备份（标签格式：`backup-YYYY-MM-DD`）
3. 下载 `nexteacher-backup-YYYY-MM-DD.tar.gz` 文件

## 恢复数据库

```bash
# 1. 下载备份文件
wget https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/backup-2025-10-05/nexteacher-backup-2025-10-05.tar.gz

# 2. 解压文件
tar -xzf nexteacher-backup-2025-10-05.tar.gz

# 3. 恢复到 MongoDB（替换为你的连接字符串）
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/database" nexteacher/

# 4. 如果需要删除现有数据后再恢复，添加 --drop 参数
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/database" --drop nexteacher/
```

## 备份保留策略

- 自动保留最近 30 天的备份
- 超过 30 天的备份会被自动删除
- 如需修改保留天数，编辑 `.github/workflows/mongodb-backup.yml` 文件中的 `keep_latest` 参数

## 调整备份时间

如需修改备份时间，编辑 `.github/workflows/mongodb-backup.yml` 文件中的 cron 表达式：

```yaml
schedule:
  - cron: '0 16 * * *'  # UTC 16:00 = 北京时间 00:00
```

常用时间对照：
- 北京时间 00:00 → UTC 16:00 → `0 16 * * *`
- 北京时间 02:00 → UTC 18:00 → `0 18 * * *`
- 北京时间 12:00 → UTC 04:00 → `0 4 * * *`

## 故障排查

### 备份失败

1. 检查 `Actions` 页面的运行日志
2. 确认 `MONGODB_URI` secret 配置正确
3. 确认 MongoDB 连接字符串可以从 GitHub Actions 访问（检查 IP 白名单）

### Release 创建失败

1. 检查 Workflow permissions 是否设置为 `Read and write permissions`
2. 确认没有相同标签的 Release 已存在

### MongoDB 连接超时

如果使用 MongoDB Atlas：
1. 进入 MongoDB Atlas 控制台
2. 选择你的 Cluster
3. 进入 `Network Access`
4. 添加 `0.0.0.0/0` 到 IP 白名单（允许所有 IP，或添加 GitHub Actions 的 IP 段）

## 文件说明

- **工作流文件**: `.github/workflows/mongodb-backup.yml`
- **备份输出目录**: `nexteacher/`
- **压缩文件命名**: `nexteacher-backup-YYYY-MM-DD.tar.gz`
- **Release 标签**: `backup-YYYY-MM-DD`

