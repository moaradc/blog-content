// rewrite-img-paths.js
// 把 posts/*.md 中所有出现的 /img/ 替换为绝对 URL（SITE_URL 环境变量）
// 不误伤已经是绝对 URL（https://xxx.xxx/img/1.jpg）的链接
//
// 规则：
//   /img/xxx.jpg          → https://cdn.jsdelivr.net/.../img/xxx.jpg
//   https://xxx/img/1.jpg → 保持不变
//   ](/img/xxx.jpg)       → ](https://cdn.jsdelivr.net/.../img/xxx.jpg)（markdown 图片/链接）
//
// 用法: SITE_URL=https://cdn.jsdelivr.net/gh/moaradc/blog-content@main node rewrite-img-paths.js

const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");

const POSTS_DIR = join(__dirname, "posts");
const SITE_URL = process.env.SITE_URL;

if (!SITE_URL) {
  console.error("❌ 环境变量 SITE_URL 未设置");
  process.exit(1);
}

if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const files = readdirSync(POSTS_DIR).filter(
  (f) => f.endsWith(".md") && f !== "README.md"
);

console.log(`🔄 扫描 ${files.length} 个 markdown 文件，替换 /img/ → ${SITE_URL}/img/`);

let changed = 0;
for (const file of files.sort()) {
  const filePath = join(POSTS_DIR, file);
  let content = readFileSync(filePath, "utf-8");
  let modified = false;

  // 1. 替换 markdown 图片/链接里的 /img/：![](/img/xxx) 和 [](/img/xxx)
  //    不匹配已经含协议的（https://xxx/img/）
  content = content.replace(
    /(!?\[[^\]]*\]\()(\/img\/[^)]+)\)/g,
    (match, prefix, url) => {
      if (url.startsWith("http://") || url.startsWith("https://")) return match;
      modified = true;
      return prefix + SITE_URL + url + ")";
    }
  );

  // 2. 替换 frontmatter 里的 coverImage: /img/xxx.jpg
  content = content.replace(
    /^(coverImage|image):\s*(\/img\/.+)$/gm,
    (match, key, url) => {
      if (url.startsWith("http://") || url.startsWith("https://")) return match;
      modified = true;
      return `${key}: ${SITE_URL}${url}`;
    }
  );

  // 3. 替换 HTML img 标签 src="/img/xxx"
  content = content.replace(
    /src=["'](\/img\/[^"']+)["']/g,
    (match, url) => {
      if (url.startsWith("http://") || url.startsWith("https://")) return match;
      modified = true;
      return `src="${SITE_URL}${url}"`;
    }
  );

  if (modified) {
    writeFileSync(filePath, content, "utf-8");
    changed++;
    console.log(`  ✏️  ${file}: 已替换`);
  }
}

console.log(`\n✅ 完成: ${changed}/${files.length} 个文件被修改`);
