// generate-posts.js
// 扫描 docs/posts/*.md，生成 posts.json（索引对象）+ posts-{n}.json（分页文件）。
//
// 关键逻辑：
//   - id 从文件名获取（如 102.md → id: "102"），不从 frontmatter 读
//   - type=note 时 body 内联进 posts.content（列表页直接渲染说说）
//   - locked: true 整篇跳过（不进任何输出）
//   - draft: true 不进 visible 集合（不出现在 posts.json.posts 和分页中）
//   - 排序：pinned 优先，再按 date 降序
//   - 当 pageCount 缩小时，自动清理多余的 posts-{n}.json
//
// 用法: node generate-posts.js

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } = require("fs");
const { join } = require("path");
const site = require("./site");
const { parseFrontmatter } = require("./parse-frontmatter");

const POSTS_DIR = join(__dirname, "docs", "posts");
const DOCS_DIR = join(__dirname, "docs");
const POSTS_OUTPUT = join(DOCS_DIR, "posts.json");
const PER_PAGE = site.perPage;

function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: raw };
  return { frontmatter: parseFrontmatter(match[1]), body: raw.slice(match[0].length) };
}

// === 扫描文章 ===
if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const posts = [];
const rawPosts = [];
const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
console.log(`📄 扫描 markdown 文件`);

for (const file of files.sort()) {
  // CRLF → LF：让 Windows 本地编辑的 .md 在 CI（Linux）上行为一致
  const raw = readFileSync(join(POSTS_DIR, file), "utf-8").replace(/\r\n/g, "\n");
  const slug = file.replace(/\.md$/, "");
  const { frontmatter, body } = parseMarkdown(raw);

  if (frontmatter.locked === true) continue;

  const article = {
    id: slug,
    title: frontmatter.title || "",
    date: frontmatter.date || "",
    last_modified: frontmatter.last_modified || frontmatter.date || "",
  };

  if (frontmatter.author) article.author = frontmatter.author;
  if (frontmatter.category) article.category = frontmatter.category;
  if (frontmatter.tags) article.tags = frontmatter.tags;
  if (frontmatter.type) article.type = frontmatter.type;
  if (frontmatter.desc) article.desc = frontmatter.desc;
  if (frontmatter.image) article.image = frontmatter.image;
  if (frontmatter.coverImage) article.image = frontmatter.coverImage;
  if (frontmatter.content_url) article.content_url = frontmatter.content_url;
  if (frontmatter.pinned === true) article.pinned = true;
  if (frontmatter.draft === true) article.draft = true;

  if (frontmatter.type === "note" && body && body.trim()) {
    article.content = body.trim();
  }

  posts.push(article);
  rawPosts.push({ slug, body, frontmatter });
  console.log(`  ✅ ${file}: ${article.title}`);
}

// rawPosts 按 date 降序（供 RSS 用）
rawPosts.sort((a, b) => {
  const dateA = new Date(a.frontmatter.date).getTime() || 0;
  const dateB = new Date(b.frontmatter.date).getTime() || 0;
  return dateB - dateA;
});

// visible 集合：过滤 draft，pinned 优先 + date 降序
const visibleSorted = posts
  .filter((p) => !p.draft)
  .sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return dateB - dateA;
  });

const total = visibleSorted.length;
const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
const generatedAt = new Date().toISOString();

// 序列化：posts 数组多行展开（每篇文章一行字段），顶层基本类型 inline。
// 这样 category/tags 等基本类型数组天然 inline，
// 不会被 JSON.stringify(obj, null, 2) 强行展开成多行。
function stringifyIndex(obj) {
  const lines = ["{"];
  const entries = Object.entries(obj);
  entries.forEach(([k, v], i) => {
    const sep = i < entries.length - 1 ? "," : "";
    if (k === "posts") {
      lines.push('  "posts": [');
      v.forEach((post, j) => {
        const fields = Object.entries(post).map(
          ([fk, fv]) => `      ${JSON.stringify(fk)}: ${JSON.stringify(fv)}`
        );
        lines.push("    {\n" + fields.join(",\n") + "\n    }" + (j < v.length - 1 ? "," : ""));
      });
      lines.push("  ]" + sep);
    } else {
      lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)}${sep}`);
    }
  });
  lines.push("}");
  return lines.join("\n");
}

// === 生成 docs/posts.json + 分页文件 ===
mkdirSync(DOCS_DIR, { recursive: true });
const indexObj = { generatedAt, perPage: PER_PAGE, total, pageCount, posts: visibleSorted };
writeFileSync(POSTS_OUTPUT, stringifyIndex(indexObj) + "\n", "utf-8");
console.log(`\n✅ 生成 posts.json`);
console.log(`   输出: ${POSTS_OUTPUT}`);

for (let pg = 0; pg < pageCount; pg++) {
  const slice = visibleSorted.slice(pg * PER_PAGE, (pg + 1) * PER_PAGE);
  const pageObj = { page: pg, perPage: PER_PAGE, total, pageCount, posts: slice };
  writeFileSync(join(DOCS_DIR, `posts-${pg}.json`), stringifyIndex(pageObj) + "\n", "utf-8");
}
console.log(`   生成分页文件`);

// === 清理多余的 posts-{n}.json（文章减少时） ===
let cleaned = 0;
for (const entry of readdirSync(DOCS_DIR)) {
  const m = entry.match(/^posts-(\d+)\.json$/);
  if (!m) continue;
  if (parseInt(m[1], 10) >= pageCount) {
    try {
      unlinkSync(join(DOCS_DIR, entry));
      cleaned++;
      console.log(`   🗑️  清理过期分页文件: ${entry}`);
    } catch (e) {
      console.warn(`   ⚠️  清理 ${entry} 失败: ${e.message}`);
    }
  }
}
if (cleaned > 0) console.log(`   已清理过期分页文件`);
