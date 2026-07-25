// generate-posts.js
// 扫描 posts/*.md，提取 frontmatter + body，生成 posts.json（索引对象）+ posts-{n}.json（分页文件）
// 输出结构匹配 moaradc/test2 项目的 articlesData 格式，并兼容 afoim/eleventy-blog-pagescms 的分页索引约定
// push 触发（GitHub Action push to main）
//
// 关键逻辑：
//   - id 从文件名获取（如 102.md → id: "102"），不从 frontmatter 读
//   - content 只在 type=note 时写入（列表页直接渲染说说）
//   - 普通文章不含 content（详情页 fetch .md 解析）
//   - locked: true 的文章直接跳过（不进任何输出）
//   - draft: true 的文章不进 visible 集合（不出现在 posts.json.posts 和 posts-{n}.json 中）
//   - 排序：pinned 优先，再按 date 降序（用 new Date(date).getTime() 兼容多种日期格式）
//
// 输出：
//   docs/posts.json       索引对象  { generatedAt, perPage, total, pageCount, posts: visibleSorted }
//   docs/posts-{n}.json   分页文件  { page, perPage, total, pageCount, posts: slice }
//                          n 从 0 起，到 pageCount-1；每页 perPage=16 篇
//   当 pageCount 缩小时，自动清理多余的 posts-{n}.json 文件
//
// 用法: node generate-posts.js

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } = require("fs");
const { join } = require("path");

const POSTS_DIR = join(__dirname, "docs", "posts");
const DOCS_DIR = join(__dirname, "docs");
const POSTS_OUTPUT = join(DOCS_DIR, "posts.json");

// 每页文章数（前端按页拉取 posts-{n}.json）
const PER_PAGE = 16;

/** 解析类 YAML frontmatter 为对象 */
function parseFrontmatter(fm) {
  const lines = fm.split("\n");
  const result = {};
  let currentKey = null;
  let currentList = [];

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey && currentList.length) {
        result[currentKey] = [...currentList];
        currentList = [];
      }
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === "") {
        currentList = [];
      } else if (val.startsWith("[")) {
        result[currentKey] = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
          .filter(Boolean);
        currentKey = null;
      } else if (val === "true") {
        result[currentKey] = true;
        currentKey = null;
      } else if (val === "false") {
        result[currentKey] = false;
        currentKey = null;
      } else {
        result[currentKey] = val.replace(/^['"]|['"]$/g, "");
        currentKey = null;
      }
      continue;
    }
    const liMatch = line.match(/^\s*-\s+(.*)$/);
    if (liMatch && currentKey) {
      currentList.push(liMatch[1].trim().replace(/^['"]|['"]$/g, ""));
    }
  }
  if (currentKey && currentList.length) {
    result[currentKey] = [...currentList];
  }
  return result;
}

/** 从 markdown 提取 frontmatter 和 body */
function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  const frontmatter = parseFrontmatter(match[1]);
  const body = raw.slice(match[0].length);
  return { frontmatter, body };
}

// === 主逻辑：扫描文章 ===
if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const posts = [];        // 全量（不含 locked），供历史/调试/RSS 使用
const rawPosts = [];     // 保留 body 供 RSS 使用
const files = readdirSync(POSTS_DIR).filter(
  (f) => f.endsWith(".md") && f !== "README.md"
);

console.log(`📄 扫描到 ${files.length} 个 markdown 文件`);

for (const file of files.sort()) {
  const raw = readFileSync(join(POSTS_DIR, file), "utf-8");
  const slug = file.replace(/\.md$/, "");
  const { frontmatter, body } = parseMarkdown(raw);

  // 跳过 locked: true 的文章（不写入 posts.json，不输出日志）
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
  if (frontmatter.locked === true) article.locked = true;
  if (frontmatter.pinned === true) article.pinned = true;
  if (frontmatter.draft === true) article.draft = true;

  if (frontmatter.type === "note" && body && body.trim()) {
    article.content = body.trim();
  }

  posts.push(article);
  rawPosts.push({ slug, body, frontmatter });
  console.log(`  ✅ ${file}: ${article.title}`);
}

// === 排序 ===
// rawPosts 仍按 date 降序（RSS 用），保持原有行为
rawPosts.sort((a, b) => {
  const dateA = new Date(a.frontmatter.date).getTime() || 0;
  const dateB = new Date(b.frontmatter.date).getTime() || 0;
  return dateB - dateA;
});

// === 计算 visible 集合（用于索引和分页文件） ===
// 过滤 draft: true（locked 已在扫描时跳过）
// 排序：pinned 优先，再按 date 降序
const visibleSorted = posts
  .filter((p) => !p.draft)
  .sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return dateB - dateA;
  });

// === 分页元信息 ===
const total = visibleSorted.length;
const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
const generatedAt = new Date().toISOString();

// === 生成 docs/posts.json（索引对象） ===
// 结构：{ generatedAt, perPage, total, pageCount, posts: visibleSorted }
// 前端可直接用 .posts 渲染，或按页拉取 posts-{n}.json
mkdirSync(DOCS_DIR, { recursive: true });
const indexObj = {
  generatedAt,
  perPage: PER_PAGE,
  total,
  pageCount,
  posts: visibleSorted,
};
writeFileSync(POSTS_OUTPUT, JSON.stringify(indexObj, null, 2) + "\n", "utf-8");
console.log(`\n✅ 生成 posts.json 索引: ${total} 篇可见文章 / ${pageCount} 页 (perPage=${PER_PAGE})`);
console.log(`   输出: ${POSTS_OUTPUT}`);

// === 生成 docs/posts-{n}.json 分页文件 ===
// 每个文件包含 { page, perPage, total, pageCount, posts: slice }
for (let pg = 0; pg < pageCount; pg++) {
  const slice = visibleSorted.slice(pg * PER_PAGE, (pg + 1) * PER_PAGE);
  const pageObj = {
    page: pg,
    perPage: PER_PAGE,
    total,
    pageCount,
    posts: slice,
  };
  const pagePath = join(DOCS_DIR, `posts-${pg}.json`);
  writeFileSync(pagePath, JSON.stringify(pageObj, null, 2) + "\n", "utf-8");
}
console.log(`   生成 ${pageCount} 个分页文件: posts-0.json .. posts-${pageCount - 1}.json`);

// === 清理多余的分页文件 ===
// 当 pageCount 缩小（文章被删/转草稿）时，删除不再需要的 posts-{n}.json
// 避免前端按旧的 pageCount 拉取到过时的分页内容
let cleaned = 0;
const pageFilePattern = /^posts-(\d+)\.json$/;
for (const entry of readdirSync(DOCS_DIR)) {
  const m = entry.match(pageFilePattern);
  if (!m) continue;
  const idx = parseInt(m[1], 10);
  if (idx >= pageCount) {
    try {
      unlinkSync(join(DOCS_DIR, entry));
      cleaned++;
      console.log(`   🗑️  清理过期分页文件: ${entry}`);
    } catch (e) {
      // 文件可能在并发场景下被删，warn 后继续
      console.warn(`   ⚠️  清理 ${entry} 失败: ${e.message}`);
    }
  }
}
if (cleaned > 0) {
  console.log(`   已清理 ${cleaned} 个过期分页文件`);
}
