// clean-frontmatter.js
// 清理 posts/*.md 的 frontmatter 与 body：
//   1. 移除值为 false 的 boolean 字段（pinned/locked/draft）
//   2. 移除空字符串字段（type/image/coverImage/content_url/desc）
//   3. 字段按固定顺序重排
//   4. body 与 frontmatter 间确保一个空行
//   5. /img/ 相对路径 → 绝对 URL（site.absUrl，已绝对的链接不动）
//   6. YAML 块状列表 → inline JSON 数组（PagesCMS 偶尔写回块状形式，统一为 inline）
//
// 用法：
//   全量:  node clean-frontmatter.js
//   增量:  node clean-frontmatter.js docs/posts/102.md docs/posts/mermaid-test.md
// GitHub Action 中在 generate-posts.js 之前运行。

const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");
const site = require("./site");

const POSTS_DIR = join(__dirname, "docs", "posts");
const SITE_URL = site.siteUrl;

/** /img/ 相对路径 → 绝对 URL（已绝对的链接不动） */
function rewriteImgPaths(content) {
  if (!SITE_URL) return content;

  // markdown 图片/链接：![](/img/xxx) 或 ![](img/xxx)，不匹配 https://xxx/img/xxx
  content = content.replace(
    /(!?\[[^\]]*\]\()((?:\/)?img\/[^)]+)\)/g,
    (m, prefix, url) => prefix + site.absUrl(url) + ")"
  );

  // frontmatter: coverImage: /img/xxx  或  image: /img/xxx
  content = content.replace(
    /^(coverImage|image):\s*(\/?img\/.+)$/gm,
    (m, key, url) => `${key}: ${site.absUrl(url)}`
  );

  // HTML img 标签：src="/img/xxx" 或 src="img/xxx"
  content = content.replace(
    /src=["'](\/?img\/[^"']+)["']/g,
    (m, url) => `src="${site.absUrl(url)}"`
  );

  return content;
}

// 期望的字段顺序（未列出的字段排在最后）
const FIELD_ORDER = [
  "title", "date", "last_modified", "author", "category", "tags", "desc",
  "type", "image", "coverImage", "content_url", "pinned", "locked", "draft",
];

const BOOLEAN_FIELDS = ["pinned", "locked", "draft"];
const EMPTY_REMOVABLE = ["type", "image", "coverImage", "content_url", "desc"];

/** 解析 frontmatter 为 [{key, rawLines}]（保留原始行格式便于后续重排） */
function parseFrontmatterLines(fm) {
  const fields = [];
  let current = null;
  for (const line of fm.split("\n")) {
    const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (kvMatch) {
      current = { key: kvMatch[1], rawLines: [line] };
      fields.push(current);
      continue;
    }
    if (current && (line.match(/^\s+-\s/) || line.match(/^\s+/) || line === "")) {
      current.rawLines.push(line);
    }
  }
  return fields;
}

/** 从字段原始行提取值（用于判断 boolean/空字符串） */
function getFieldValue(field) {
  const m = field.rawLines[0].match(/^\w[\w_-]*:\s*(.*)$/);
  if (!m) return null;
  const val = m[1].trim();
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === '""' || val === "''") return "";
  return val.replace(/^['"]|['"]$/g, "");
}

/**
 * YAML 块状列表 → inline JSON 数组：
 *   category:
 *     - Demo
 *     - 杂项
 * 转为：
 *   category: ["Demo", "杂项"]
 *
 * 仅处理首行 `key:`（值为空）且后续全是 `  - xxx` 列表项的字段；
 * 列表项剥外层引号 + 内部双引号转义为 \"；非标准形式原样返回不冒险。
 */
function normalizeField(field) {
  if (field.rawLines.length <= 1) return field;
  const m = field.rawLines[0].match(/^(\w[\w_-]*):\s*$/);
  if (!m) return field;
  const key = m[1];

  const items = [];
  for (let i = 1; i < field.rawLines.length; i++) {
    const im = field.rawLines[i].match(/^\s+-\s+(.+?)\s*$/);
    if (!im) return field;
    let item = im[1].replace(/^['"]|['"]$/g, "").replace(/"/g, '\\"');
    items.push(`"${item}"`);
  }
  if (items.length === 0) return field;
  return { key, rawLines: [`${key}: [${items.join(", ")}]`] };
}

/** 处理单个 md 文件 */
function cleanFile(filePath) {
  // CRLF → LF：让 Windows 本地编辑的 .md 在 CI（Linux）上行为一致，
  // 否则 `^---\n` 正则失配会让整篇文章被静默丢弃。
  const raw = readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return false;

  const fmContent = match[1];
  const body = raw.slice(match[0].length);

  // 过滤字段
  const cleanedFields = [];
  for (const field of parseFrontmatterLines(fmContent)) {
    const value = getFieldValue(field);
    if (BOOLEAN_FIELDS.includes(field.key) && value === false) continue;
    if (EMPTY_REMOVABLE.includes(field.key) && (value === "" || value === null)) continue;
    cleanedFields.push(field);
  }

  // 块状列表 → inline 数组 + 按指定顺序排序
  const normalizedFields = cleanedFields.map(normalizeField);
  normalizedFields.sort((a, b) => {
    const ia = FIELD_ORDER.indexOf(a.key);
    const ib = FIELD_ORDER.indexOf(b.key);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const fmLines = normalizedFields.flatMap((f) => f.rawLines);
  const newFm = "---\n" + fmLines.join("\n") + "\n---";
  const newBody = "\n" + rewriteImgPaths(body.replace(/^\n+/, ""));
  const newContent = rewriteImgPaths(newFm) + newBody;

  if (newContent !== raw) {
    writeFileSync(filePath, newContent, "utf-8");
    return true;
  }
  return false;
}

// === 主逻辑：支持全量或命令行传参增量 ===
if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

function resolveTargetFile(input) {
  if (input.startsWith("/")) return input;
  if (input.startsWith("docs/posts/")) return join(__dirname, input);
  return join(POSTS_DIR, input);
}

const argv = process.argv.slice(2);
let files;
if (argv.length > 0) {
  files = argv
    .map(resolveTargetFile)
    .filter((p) => existsSync(p) || (console.warn(`⚠️  跳过不存在的文件: ${p}`), false))
    .filter((p) => p.endsWith(".md"))
    .map((p) => p.split("/").pop());
  console.log(`🧹 增量清理 ${files.length} 个 markdown 文件`);
} else {
  files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
  console.log(`🧹 全量清理 ${files.length} 个 markdown 文件`);
}

let changed = 0;
for (const file of files.sort()) {
  if (cleanFile(join(POSTS_DIR, file))) {
    changed++;
    console.log(`  ✏️  ${file}: 已清理`);
  }
}

console.log(`\n✅ 完成: ${changed}/${files.length} 个文件被修改`);
