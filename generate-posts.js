// generate-posts.js
// 扫描 docs/posts/*.md，生成 posts.json + posts-{n}.json 分页。
// locked / draft 字段存在即跳过。排序：pinned 优先 + date 降序。

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

if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const posts = [];
const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
console.log(`📄 扫描 markdown 文件`);

for (const file of files.sort()) {
  const raw = readFileSync(join(POSTS_DIR, file), "utf-8").replace(/\r\n/g, "\n");
  const slug = file.replace(/\.md$/, "");
  const { frontmatter, body } = parseMarkdown(raw);

  if ("locked" in frontmatter) continue;
  if ("draft" in frontmatter) continue;

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

  if (frontmatter.type === "note" && body && body.trim()) {
    article.content = body.trim();
  }

  posts.push(article);
}

console.log(`   共 ${posts.length} 篇（${files.length} 个文件）`);

const visibleSorted = posts.sort((a, b) => {
  if (a.pinned && !b.pinned) return -1;
  if (!a.pinned && b.pinned) return 1;
  const dateA = new Date(a.date).getTime() || 0;
  const dateB = new Date(b.date).getTime() || 0;
  return dateB - dateA;
});

const total = visibleSorted.length;
const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
const generatedAt = new Date().toISOString();

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
