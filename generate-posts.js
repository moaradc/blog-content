// generate-posts.js
// 扫描 posts/*.md，提取 frontmatter + body，生成 posts.json + rss.xml
// 输出结构匹配 moaradc/test2 项目的 articlesData 格式
//
// 关键逻辑：
//   - id 从文件名获取（如 102.md → id: "102"），不从 frontmatter 读
//   - content 只在 type=note 时写入 posts.json（列表页直接渲染说说）
//   - 普通文章不含 content（详情页 fetch .md 解析）
//   - 同时生成 RSS 2.0 订阅（rss.xml）
//
// 用法: node generate-posts.js

const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");

// marked 用于把 markdown body 转 HTML（RSS content:encoded 需要 HTML）
let marked;
try {
  ({ marked } = require("marked"));
} catch (e) {
  console.warn("⚠️  marked 未安装，RSS 将输出原始 markdown。请运行 npm install marked");
  marked = { parse: (s) => s };
}

const POSTS_DIR = join(__dirname, "posts");
const POSTS_OUTPUT = join(__dirname, "posts.json");
const RSS_OUTPUT = join(__dirname, "rss.xml");

// === RSS 站点配置 ===
const SITE_URL = "https://blog55.945426.xyz/";
const SITE_TITLE = "沫然Blog";
const SITE_DESC = "基于 Astro 的极简博客";
const RSS_SELF_URL = "https://blog55.945426.xyz/rss.xml";
const AUTHOR_NAME = "沫然";
const AUTHOR_EMAIL = "moara@foxmail.com";

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

writeFileSync(POSTS_OUTPUT, stringifyPosts(posts), "utf-8");
console.log(`\n✅ 生成 posts.json: ${posts.length} 篇文章`);
console.log(`   输出: ${POSTS_OUTPUT}`);

// === 生成 RSS 2.0 ===
function escapeXml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 把 frontmatter 里的日期字符串（如 "2026-07-17 21:03"）当作 UTC+8 时间解析
 * 返回 Date 对象
 *
 * 问题：new Date("2026-07-17 21:03") 在 UTC 环境下会被当作 UTC 时间，
 * 导致 RSS pubDate 偏差 8 小时。frontmatter 写的是北京时间，需要显式指定时区。
 */
function parseCnDate(dateStr) {
  if (!dateStr) return new Date();
  // 把 "2026-07-17 21:03" 转成 "2026-07-17T21:03:00+08:00"（ISO 8601 带时区）
  const isoStr = dateStr.replace(" ", "T") + ":00+08:00";
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * 把 Date 对象格式化为 RFC 822 日期（带 +0800 时区偏移）
 * 例如：Fri, 17 Jul 2026 21:03:00 +0800
 *
 * RSS 阅读器会根据 +0800 偏移量正确显示用户本地时间。
 */
function toRfc822Date(dateStr) {
  const d = parseCnDate(dateStr);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const pad = (n) => String(n).padStart(2, "0");
  // 用 UTC+8 时间部分（UTC + 8 小时）
  const utc8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return (
    weekdays[utc8.getUTCDay()] +
    ", " +
    pad(utc8.getUTCDate()) +
    " " +
    months[utc8.getUTCMonth()] +
    " " +
    utc8.getUTCFullYear() +
    " " +
    pad(utc8.getUTCHours()) +
    ":" +
    pad(utc8.getUTCMinutes()) +
    ":" +
    pad(utc8.getUTCSeconds()) +
    " +0800"
  );
}

const MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
};

function generateRssFeed(allPosts, allRawPosts) {
  // 只包含非草稿、非锁定、非隐藏的文章
  const visible = allPosts.filter((p) => !p.draft && !p.locked);
  const lastBuildDate =
    visible.length > 0 ? toRfc822Date(visible[0].date) : new Date().toUTCString();

  // slug -> body 映射
  const bodyMap = {};
  for (const rp of allRawPosts) {
    bodyMap[rp.slug] = rp.body;
  }

  const lines = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">');
  lines.push("  <channel>");
  lines.push("    <title>" + escapeXml(SITE_TITLE) + "</title>");
  lines.push("    <link>" + escapeXml(SITE_URL) + "</link>");
  lines.push("    <description>" + escapeXml(SITE_DESC) + "</description>");
  lines.push("    <language>zh-CN</language>");
  lines.push("    <lastBuildDate>" + lastBuildDate + "</lastBuildDate>");
  lines.push("    <generator>generate-posts.js (PagesCMS)</generator>");
  lines.push('    <atom:link href="' + escapeXml(RSS_SELF_URL) + '" rel="self" type="application/rss+xml"/>');
  lines.push("    <managingEditor>" + escapeXml(AUTHOR_EMAIL) + " (" + escapeXml(AUTHOR_NAME) + ")</managingEditor>");
  lines.push("    <webMaster>" + escapeXml(AUTHOR_EMAIL) + " (" + escapeXml(AUTHOR_NAME) + ")</webMaster>");

  for (const post of visible) {
    // 文章 URL（详情页）
    const postUrl = SITE_URL + "details/article?id=" + encodeURIComponent(post.id);

    // 正文：从 .md body 读取，用 marked 转成 HTML（RSS 阅读器需要 HTML）
    const rawBody = (bodyMap[post.id] || "").trim();
    const contentHtml = marked.parse(rawBody);

    // 完整内容：封面图 + 摘要 + 正文（都是 HTML）
    let fullContent = "";
    if (post.image) {
      fullContent += '<p><img src="' + escapeXml(post.image) + '" alt="' + escapeXml(post.title) + '" /></p>';
    }
    if (post.desc) {
      fullContent += "<p>" + escapeXml(post.desc) + "</p>";
    }
    fullContent += contentHtml;

    lines.push("    <item>");
    lines.push("      <title>" + escapeXml(post.title) + "</title>");
    lines.push("      <link>" + escapeXml(postUrl) + "</link>");
    lines.push('      <guid isPermaLink="false">' + escapeXml(post.id) + "</guid>");
    lines.push("      <pubDate>" + toRfc822Date(post.date) + "</pubDate>");

    if (post.desc) {
      lines.push("      <description>" + escapeXml(post.desc) + "</description>");
    }

    // 全文内容（CDATA 包裹）
    lines.push("      <content:encoded><![CDATA[" + fullContent + "]]></content:encoded>");

    // 封面图作为 media:content
    if (post.image) {
      const ext = (post.image.toLowerCase().match(/\.\w+$/) || [""])[0];
      const mime = MIME_MAP[ext] || "image/jpeg";
      lines.push('      <media:content url="' + escapeXml(post.image) + '" type="' + mime + '" medium="image" />');
      lines.push('      <media:thumbnail url="' + escapeXml(post.image) + '" />');
    }

    // 分类和标签
    if (Array.isArray(post.category)) {
      for (const cat of post.category) {
        lines.push("      <category>" + escapeXml(cat) + "</category>");
      }
    }
    if (Array.isArray(post.tags)) {
      for (const tag of post.tags) {
        lines.push("      <category>" + escapeXml(tag) + "</category>");
      }
    }

    // 作者（用 dc:creator，不要求邮箱）
    if (post.author) {
      lines.push("      <dc:creator>" + escapeXml(post.author) + "</dc:creator>");
    }

    lines.push("    </item>");
  }

  lines.push("  </channel>");
  lines.push("</rss>");
  return lines.join("\n") + "\n";
}

writeFileSync(RSS_OUTPUT, generateRssFeed(posts, rawPosts), "utf-8");
const rssCount = posts.filter((p) => !p.draft && !p.locked).length;
console.log(`✅ 生成 rss.xml: ${rssCount} 篇文章（RSS 2.0）`);
console.log(`   输出: ${RSS_OUTPUT}`);
