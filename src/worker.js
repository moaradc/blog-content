export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/") {
      const rangeHeader = request.headers.get("Range");
      if (rangeHeader && request.method === "GET") {
        return serveRange(env, url, rangeHeader);
      }
      return withAssetCors(await env.ASSETS.fetch(request));
    }

    const shellPromise = env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
    const postsPromise = env.ASSETS.fetch(new Request(new URL("/posts.json", request.url)));

    const [shellRes, postsRes] = await Promise.all([shellPromise, postsPromise]);

    let posts = [];
    let generatedAt = "";
    if (postsRes.ok) {
      try {
        const data = await postsRes.json();
        posts = data.posts || [];
        generatedAt = data.generatedAt || "";
      } catch (e) {}
    }

    const cardsHtml = posts.map((post, index) => renderCard(post, index, url.origin)).join("");

    const metaTotal = posts.length;
    const metaUpdated = generatedAt ? generatedAt.slice(0, 10) : "-";

    return new HTMLRewriter()
      .on("#items-container", {
        element(el) {
          el.setInnerContent(cardsHtml || '<div class="empty">暂无文章，posts.json 为空。</div>', { html: true });
        },
      })
      .on("#meta-total", {
        element(el) {
          el.setInnerContent(String(metaTotal));
        },
      })
      .on("#meta-updated", {
        element(el) {
          el.setInnerContent(metaUpdated);
        },
      })
      .transform(shellRes);
  },
};

/* ===== HTTP Range（音频进度条拖拽定位依赖） =====
   静态资产层对带 Range 的请求一律回 200 全量且不发 Accept-Ranges（实测 2026-10-12：
   raw-posts 的 mp3 收到 bytes=0-1 仍返回完整 4.7MB 文件），浏览器媒体管线因此把
   未缓冲的 seek 当作全新资源从头加载。此处由 Worker 代行标准 Range 语义：
   取整档 → 切片 → 206 + Content-Range + Accept-Ranges，拖拽定位原生生效。
   配合 wrangler.jsonc 的 run_worker_first: ["/", "/music/*"] 路由进 Worker。 */
async function serveRange(env, url, rangeHeader) {
  /* 向资产层取整档（不带 Range/条件头，避免干扰缓存语义） */
  const full = await env.ASSETS.fetch(new Request(url, { method: "GET" }));
  if (!full.ok) return full;

  const total = Number(full.headers.get("Content-Length") || 0);
  if (!total) return withAssetCors(full);

  /* 仅处理常规单区间；多区间等非常规格式回退整档 200 */
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m || (m[1] === "" && m[2] === "")) return withAssetCors(full);

  let start, end;
  if (m[1] === "") {
    /* bytes=-N 后缀式（Safari 用） */
    start = Math.max(0, total - Math.max(1, Number(m[2])));
    end = total - 1;
  } else {
    /* bytes=N- 开放式（Chrome seek 最常见）与 bytes=N-M 闭区间 */
    start = Number(m[1]);
    end = m[2] === "" ? total - 1 : Math.min(Number(m[2]), total - 1);
  }

  if (start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": "bytes */" + total,
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const headers = new Headers({
    "Content-Type": full.headers.get("Content-Type") || "application/octet-stream",
    "Content-Length": String(end - start + 1),
    "Content-Range": "bytes " + start + "-" + end + "/" + total,
    "Accept-Ranges": "bytes",
    "Access-Control-Allow-Origin": "*",
  });
  const etag = full.headers.get("ETag");
  if (etag) headers.set("ETag", etag);
  const cacheControl = full.headers.get("Cache-Control");
  if (cacheControl) headers.set("Cache-Control", cacheControl);

  const buf = await full.arrayBuffer();
  return new Response(buf.slice(start, end + 1), { status: 206, headers });
}

/* 兜底：经 Worker 转发的资产响应若未应用 _headers 的全局 ACAO 则补齐
   （站点跨域读 music.json / .lrc 依赖它；已带 ACAO 时零开销直通） */
function withAssetCors(res) {
  if (res.status !== 200 || res.headers.get("Access-Control-Allow-Origin")) return res;
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function formatDate(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

function renderCard(post, index, origin) {
  const id = post.id || "";
  const title = post.title || id;
  const blogUrl = "https://blog.945426.xyz";
  const postUrl = blogUrl + "/posts/" + encodeURIComponent(id);
  const mdUrl = "/posts/" + encodeURIComponent(id) + ".md";

  let html = '<article class="item"><div class="item__inner">';

  html += '<div class="item__head">';
  html += '<h3 class="item__title"><a href="' + escapeAttr(postUrl) + '" target="_blank" rel="noopener">' + escapeHtml(title) + '</a></h3>';
  html += '<span class="item__num">#' + (index + 1) + '</span>';
  html += '</div>';

  html += '<div class="item__meta">';
  if (post.date) {
    html += '<span class="item__date">' + escapeHtml(formatDate(post.date)) + '</span>';
  }
  if (post.author) {
    html += '<span class="item__author">' + escapeHtml(post.author) + '</span>';
  }
  if (post.type) {
    html += '<span class="item__type">' + escapeHtml(post.type) + '</span>';
  }
  if (post.pinned) {
    html += '<span class="item__pinned">PINNED</span>';
  }
  html += '</div>';

  if (post.image) {
    html += '<img class="item__cover" src="' + escapeAttr(post.image) + '" alt="' + escapeAttr(title) + '" loading="lazy">';
  }

  if (Array.isArray(post.category) && post.category.length) {
    html += '<div class="item__tags">';
    post.category.forEach(function(c) {
      html += '<span class="tag">' + escapeHtml(c) + '</span>';
    });
    html += '</div>';
  }

  if (post.desc) {
    html += '<p class="item__excerpt">' + escapeHtml(post.desc) + '</p>';
  }

  html += '<div class="item__actions">';
  html += '<a class="item__cta" href="' + escapeAttr(postUrl) + '" target="_blank" rel="noopener">阅读全文 <span class="arrow">→</span></a>';
  html += '<a class="item__cta secondary" href="' + escapeAttr(mdUrl) + '">查看 Markdown</a>';
  html += '</div>';

  html += '</div></article>';

  return html;
}
