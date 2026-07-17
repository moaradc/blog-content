// generate-posts.js
// 扫描 posts/*.md，提取 frontmatter，生成 posts.json
// 输出结构匹配 moaradc/test2 项目的 articlesData 格式
//
// 用法: node generate-posts.js

const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");

const POSTS_DIR = join(__dirname, "posts");
const OUTPUT = join(__dirname, "posts.json");

/** 解析类 YAML frontmatter 为对象 */
function parseFrontmatter(fm) {
  const lines = fm.split("\n");
  const result = {};
  let currentKey = null;
  let currentList = [];

  for (const line of lines) {
    // Key: value
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
        // 内联数组: [a, b, c]
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
    // 列表项:  - value
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

// 主逻辑
if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const posts = [];
const files = readdirSync(POSTS_DIR).filter(
  (f) => f.endsWith(".md") && f !== "README.md"
);

console.log(`📄 扫描到 ${files.length} 个 markdown 文件`);

for (const file of files.sort()) {
  const raw = readFileSync(join(POSTS_DIR, file), "utf-8");
  const slug = file.replace(/\.md$/, "");
  const { frontmatter, body } = parseMarkdown(raw);

  // 构建 article 对象（匹配 articlesData 结构）
  const article = {
    id: frontmatter.id || slug,
    title: frontmatter.title || "",
    date: frontmatter.date || "",
    last_modified: frontmatter.last_modified || frontmatter.date || "",
  };

  // 可选字段（只在有值时添加，保持 JSON 紧凑）
  if (frontmatter.author) article.author = frontmatter.author;
  if (frontmatter.category) article.category = frontmatter.category;
  if (frontmatter.tags) article.tags = frontmatter.tags;
  if (frontmatter.type) article.type = frontmatter.type;
  if (frontmatter.desc) article.desc = frontmatter.desc;
  if (frontmatter.image) article.image = frontmatter.image;
  if (frontmatter.coverImage) article.image = frontmatter.coverImage; // 优先用上传的封面
  if (frontmatter.content_url) article.content_url = frontmatter.content_url;
  // locked: 从 frontmatter 读取，写入 posts.json（详情页通过 fetch .md 解析 frontmatter 也读 locked）
  if (frontmatter.locked === true) article.locked = true;
  if (frontmatter.pinned === true) article.pinned = true;
  if (frontmatter.draft === true) article.draft = true;

  // content 字段：
  // - type=note 的说说：content 直接存到 posts.json（列表页直接渲染）
  // - 普通文章：content 也存到 posts.json（详情页从 posts.json 读取，不用单独 fetch .md）
  //   但如果文章很长，建议只存摘要到 desc，content 留空，详情页通过 fetch .md 获取
  // 这里默认把 body 存到 content（匹配现有 articles.js 的 note 行为）
  if (body && body.trim()) {
    article.content = body.trim();
  } else if (frontmatter.content) {
    article.content = frontmatter.content;
  }

  posts.push(article);
  console.log(`  ✅ ${file}: ${article.title}`);
}

// 按日期降序排序（最新在前）
posts.sort((a, b) => {
  const dateA = new Date(a.date).getTime() || 0;
  const dateB = new Date(b.date).getTime() || 0;
  return dateB - dateA;
});

writeFileSync(OUTPUT, JSON.stringify(posts, null, 2), "utf-8");
console.log(`\n✅ 生成 posts.json: ${posts.length} 篇文章`);
console.log(`   输出: ${OUTPUT}`);
