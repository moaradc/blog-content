# 媒体目录

PagesCMS 上传的图片会自动存到这里。

## 访问方式

通过 jsdelivr CDN：
```
https://cdn.jsdelivr.net/gh/moaradc/blog-content@main/img/{filename}
```

## 命名规则

PagesCMS 配置了 `rename: safe`，会保留可读文件名但移除特殊字符。
建议上传前手动重命名为有意义的英文文件名（如 `markdown-guide-cover.jpg`）。
