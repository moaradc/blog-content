// generate-posts.js
// 扫描 posts/*.md，提取 frontmatter + body，生成 posts.json
// 输出结构匹配 moaradc/test2 项目的 articlesData 格式
// push 触发（GitHub Action push to main）
//
// 关键逻辑：
//   - id 从文件名获取（如 102.md → id: "102"），不从 frontmatter 读
//   - content 只在 type=note 时写入 posts.json（列表页直接渲染说说）
//   - 普通文章不含 content（详情页 fetch .md 解析）
//
// 用法: node generate-posts.js

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");

const POSTS_DIR = join(__dirname, "docs", "posts");
const POSTS_OUTPUT = join(__dirname, "docs", "posts.json");

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

const posts = [];
const rawPosts = []; // 保留 body 供 RSS 使用
const files = readdirSync(POSTS_DIR).filter(
  (f) => f.endsWith(".md") && f !== "README.md"
);

console.log(`📄 扫描到 ${files.length} 个 markdown 文件`);

for (const file of files.sort()) {
  const raw = readFileSync(join(POSTS_DIR, file), "utf-8");
  const slug = file.replace(/\.md$/, "");
  const { frontmatter, body } = parseMarkdown(raw);

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

// 按日期降序排序
posts.sort((a, b) => {
  const dateA = new Date(a.date).getTime() || 0;
  const dateB = new Date(b.date).getTime() || 0;
  return dateB - dateA;
});
rawPosts.sort((a, b) => {
  const dateA = new Date(a.frontmatter.date).getTime() || 0;
  const dateB = new Date(b.frontmatter.date).getTime() || 0;
  return dateB - dateA;
});

// === 生成 posts.json ===
function stringifyPosts(posts) {
  const lines = ["["];
  posts.forEach((post, i) => {
    const entries = Object.entries(post);
    const fields = entries.map(([key, value]) => {
      return `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`;
    });
    const objStr = "  {\n" + fields.join(",\n") + "\n  }";
    lines.push(objStr + (i < posts.length - 1 ? "," : ""));
  });
  lines.push("]");
  return lines.join("\n");
}

// 确保 docs/ 目录存在（GitHub Pages 服务目录）
mkdirSync(join(__dirname, "docs"), { recursive: true });
writeFileSync(POSTS_OUTPUT, stringifyPosts(posts), "utf-8");
console.log(`\n✅ 生成 posts.json: ${posts.length} 篇文章`);
console.log(`   输出: ${POSTS_OUTPUT}`);
