// generate-llms-txt.js
// 消费 docs/posts.json，生成 docs/llms.txt（llmstxt.org 约定的 LLM 站点导航）。

const { readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");
const site = require("./site");

const POSTS_JSON = join(__dirname, "docs", "posts.json");
const OUTPUT = join(__dirname, "docs", "llms.txt");

if (!existsSync(POSTS_JSON)) {
  console.error(`❌ posts.json 不存在: ${POSTS_JSON}`);
  process.exit(1);
}

const data = JSON.parse(readFileSync(POSTS_JSON, "utf-8"));
const posts = data.posts || [];

const blogUrl = site.blogUrl.replace(/\/$/, "");
const rawPostsUrl = site.siteUrl.replace(/\/$/, "");

const SITE_DESCRIPTION = "MOARA 的个人博客 —— 技术、生活、闲谈、创作、归档";

let text = "";

text += `# ${site.title}\n\n`;
text += `> ${SITE_DESCRIPTION}\n\n`;
text += `内容存储在 ${rawPostsUrl}（Cloudflare Workers），主站 ${blogUrl}（Vercel）通过 rewrite 代理。前者是纯静态文件，后者带前端交互。\n`;
text += `文章正文 Markdown 原文在 ${rawPostsUrl}/posts/<id>.md，站内链接与图片均已绝对化。\n`;
text += `文章 SEO HTML 在 ${rawPostsUrl}/posts/<id>（含完整正文，可直接读）。\n\n`;

text += `## 博客\n\n`;
text += `- [文章列表](${blogUrl}/): 全部文章\n`;
text += `- [RSS 全文订阅源](${blogUrl}/rss.xml): RSS 2.0，含 rendered HTML 正文\n`;
text += `- [文章 sitemap](${blogUrl}/sitemap.xml): 全部文章 URL 与更新时间\n`;
text += `- [文章 JSON 索引](${rawPostsUrl}/posts.json): 全量文章元数据\n\n`;

text += `## 博客文章\n\n`;
for (const post of posts) {
  const url = `${rawPostsUrl}/posts/${encodeURIComponent(post.id)}`;
  const date = (post.date || "").slice(0, 10);
  const desc = post.desc ? ` — ${post.desc}` : "";
  text += `- [${post.title || post.id}](${url}): ${date}${desc}\n`;
}

writeFileSync(OUTPUT, text, "utf-8");
