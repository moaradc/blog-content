// clean-frontmatter.js
// 清理 posts/*.md 的 frontmatter：
// 1. 移除值为 false 的 boolean 字段（pinned/locked/draft）
// 2. 移除空字符串字段（type: ""）
// 3. 重排字段顺序：title, date, last_modified, author, category, tags, desc, type, image, coverImage, content_url, pinned, locked, draft
// 4. 确保 frontmatter 和 body 之间有空行
//
// 用法: node clean-frontmatter.js
// 在 GitHub Action 中 generate-posts.js 之前运行

const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");

const POSTS_DIR = join(__dirname, "posts");

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

/** 处理单个 md 文件 */
function cleanFile(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return false;

  const fmContent = match[1];
  const body = raw.slice(match[0].length);
  const fields = parseFrontmatterLines(fmContent);

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

  // body 确保以单个空行开头（移除开头多余空行，不处理 body 内部）
  const trimmedBody = body.replace(/^\n+/, "");
  const newBody = "\n" + trimmedBody;

  const newContent = newFm + newBody;

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
