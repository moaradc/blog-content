// clean-frontmatter.js
// 清理 posts/*.md：
// 1. 移除值为 false 的 boolean 字段（pinned/locked/draft）
// 2. 移除空字符串字段（type: ""）
// 3. 重排字段顺序：title, date, last_modified, author, category, tags, desc, type, image, coverImage, content_url, pinned, locked, draft
// 4. 确保 frontmatter 和 body 之间有空行
// 5. 把 /img/ 相对路径替换为绝对 URL（SITE_URL 环境变量）
//    不误伤已经是绝对 URL（https://xxx/img/1.jpg）的链接
// 6. 把列表式数组字段（`category:\n  - Demo`）规范化为内联数组（`category: ["Demo"]`）
//
// 用法: SITE_URL=https://cdn.jsdelivr.net/gh/moaradc/blog-content@main node clean-frontmatter.js
// 在 GitHub Action 中 generate-posts.js 之前运行

const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");

const POSTS_DIR = join(__dirname, "docs", "posts");
const SITE_URL = process.env.SITE_URL || "";

/**
 * 把 /img/ 或 img/ 相对路径替换为绝对 URL
 * - 已经是绝对的（http/https）→ 不变
 * - URL 中间含 /img/（如 https://xxx/img/xxx）→ 不变
 * - 以 /img/ 或 img/ 开头 → 拼接 SITE_URL
 */
function rewriteImgPaths(content) {
  if (!SITE_URL) return content;
  let modified = content;

  // 1. markdown 图片/链接：![](/img/xxx) 或 ![](img/xxx)
  //    不匹配 https://xxx/img/xxx（URL 中间的 /img/）
  modified = modified.replace(
    /(!?\[[^\]]*\]\()((?:\/)?img\/[^)]+)\)/g,
    (match, prefix, url) => {
      // 跳过已经是绝对 URL 的
      if (url.startsWith("http://") || url.startsWith("https://")) return match;
      // 拼接 SITE_URL（url 已含 /img/ 或 img/）
      const path = url.startsWith("/") ? url : "/" + url;
      return prefix + SITE_URL + path + ")";
    }
  );

  // 2. frontmatter: coverImage: /img/xxx.jpg  或  image: /img/xxx.jpg
  modified = modified.replace(
    /^(coverImage|image):\s*(\/?img\/.+)$/gm,
    (match, key, url) => {
      if (url.startsWith("http://") || url.startsWith("https://")) return match;
      const path = url.startsWith("/") ? url : "/" + url;
      return `${key}: ${SITE_URL}${path}`;
    }
  );

  // 3. HTML img 标签：src="/img/xxx" 或 src="img/xxx"
  modified = modified.replace(
    /src=["'](\/?img\/[^"']+)["']/g,
    (match, url) => {
      if (url.startsWith("http://") || url.startsWith("https://")) return match;
      const path = url.startsWith("/") ? url : "/" + url;
      return `src="${SITE_URL}${path}"`;
    }
  );

  return modified;
}

// 期望的字段顺序（未列出的字段排在最后）
const FIELD_ORDER = [
  "title",
  "date",
  "last_modified",
  "author",
  "category",
  "tags",
  "desc",
  "type",
  "image",
  "coverImage",
  "content_url",
  "pinned",
  "locked",
  "draft",
];

// 需要在值为 false 时移除的 boolean 字段
const BOOLEAN_FIELDS = ["pinned", "locked", "draft"];

// 需要在值为空字符串时移除的字段
const EMPTY_REMOVABLE = ["type", "image", "coverImage", "content_url", "desc"];

/** 解析 frontmatter 为键值对（保留原始行格式） */
function parseFrontmatterLines(fm) {
  const lines = fm.split("\n");
  const fields = []; // [{key, rawLines: []}]
  let current = null;

  for (const line of lines) {
    // 键值行: key: value
    const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (kvMatch) {
      current = { key: kvMatch[1], rawLines: [line] };
      fields.push(current);
      continue;
    }
    // 列表项或续行
    if (current && (line.match(/^\s+-\s/) || line.match(/^\s+/) || line === "")) {
      current.rawLines.push(line);
    }
  }
  return fields;
}

/** 从字段原始行提取值（用于判断 boolean/string） */
function getFieldValue(field) {
  const firstLine = field.rawLines[0];
  const m = firstLine.match(/^\w[\w_-]*:\s*(.*)$/);
  if (!m) return null;
  const val = m[1].trim();
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === '""' || val === "''") return "";
  return val.replace(/^['"]|['"]$/g, "");
}

/**
 * 把列表式数组字段规范化为内联数组
 * 输入:  rawLines = ["category:", "  - Demo", "  - 技术"]
 * 输出:  ["category: [\"Demo\", \"技术\"]"]
 * 非列表字段（单行键值，或后续行非 `- item` 格式）原样返回
 */
function normalizeListField(field) {
  const { key, rawLines } = field;
  if (rawLines.length <= 1) return rawLines;

  // 第一行必须为 `key:` 形式（键后无值）
  if (!/^(\w[\w_-]*):\s*$/.test(rawLines[0])) return rawLines;

  // 后续行必须为列表项 `  - value`（允许空行）
  const items = [];
  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.trim() === "") continue;
    const liMatch = line.match(/^\s*-\s+(.*)$/);
    if (!liMatch) return rawLines; // 非列表格式，保持原样
    items.push(liMatch[1].trim().replace(/^['"]|['"]$/g, ""));
  }

  if (items.length === 0) return rawLines; // 空列表交给上层过滤处理

  const itemsStr = items.map((i) => JSON.stringify(i)).join(", ");
  return [`${key}: [${itemsStr}]`];
}

/** 处理单个 md 文件 */
function cleanFile(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return false;

  const fmContent = match[1];
  const body = raw.slice(match[0].length);
  const fields = parseFrontmatterLines(fmContent);

  // 规范化列表字段为内联数组
  for (const field of fields) {
    field.rawLines = normalizeListField(field);
  }

  // 过滤字段
  const cleanedFields = [];
  for (const field of fields) {
    const value = getFieldValue(field);

    // 移除值为 false 的 boolean 字段
    if (BOOLEAN_FIELDS.includes(field.key) && value === false) {
      continue;
    }
    // 移除空字符串字段
    if (EMPTY_REMOVABLE.includes(field.key) && (value === "" || value === null)) {
      continue;
    }
    cleanedFields.push(field);
  }

  // 按指定顺序排序
  cleanedFields.sort((a, b) => {
    const ia = FIELD_ORDER.indexOf(a.key);
    const ib = FIELD_ORDER.indexOf(b.key);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  // 重建 frontmatter
  const fmLines = cleanedFields.flatMap((f) => f.rawLines);
  const newFm = "---\n" + fmLines.join("\n") + "\n---";

  // body 确保以单个空行开头（移除开头多余空行）
  // 同时把 body 里的 /img/ 相对路径替换为绝对 URL
  const trimmedBody = body.replace(/^\n+/, "");
  const newBody = "\n" + rewriteImgPaths(trimmedBody);

  // frontmatter 里的 coverImage/image 也替换 /img/
  const newFmRewritten = rewriteImgPaths(newFm);

  const newContent = newFmRewritten + newBody;

  if (newContent !== raw) {
    writeFileSync(filePath, newContent, "utf-8");
    return true;
  }
  return false;
}

// 主逻辑
if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const files = readdirSync(POSTS_DIR).filter(
  (f) => f.endsWith(".md") && f !== "README.md"
);

console.log(`🧹 清理 ${files.length} 个 markdown 文件的 frontmatter`);

let changed = 0;
for (const file of files.sort()) {
  const changed2 = cleanFile(join(POSTS_DIR, file));
  if (changed2) {
    changed++;
    console.log(`  ✏️  ${file}: 已清理`);
  }
}

console.log(`\n✅ 完成: ${changed}/${files.length} 个文件被修改`);
