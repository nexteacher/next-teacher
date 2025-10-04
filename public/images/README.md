# 图片资源目录

此目录用于存放项目中使用的图片资源。

## 需要的图片

### 默认头像
- **文件名**: `default-avatar.png`
- **尺寸**: 200x200 像素
- **格式**: PNG
- **说明**: 当导师没有上传头像时使用的默认头像

您可以：
1. 使用 [Gravatar](https://www.gravatar.com/) 生成默认头像
2. 使用 [UI Avatars](https://ui-avatars.com/) 生成文字头像
3. 使用自定义的默认头像图片

### 示例代码生成默认头像

```bash
# 使用 UI Avatars API 生成默认头像
curl "https://ui-avatars.com/api/?name=Teacher&size=200&background=3B82F6&color=fff" -o default-avatar.png
```

## 其他图片资源

根据需要，您可以添加：
- 大学 logo
- 背景图片
- 图标等