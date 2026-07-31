<?xml version="1.0" encoding="UTF-8"?>
<!--
  public/xsl/sitemap.xsl
  沫然Blog sitemap 可视化样式表

  功能：让浏览器打开 sitemap.xml 时渲染成可读的 HTML 表格，而非裸 XML。
  对爬虫无影响（爬虫忽略 <?xml-stylesheet?> 处理指令，只读 XML 节点）。

  视觉语言对齐 KawaYiLab/InterKnot-Web：
  - 深色底 (#0a0a0a) + 荧光黄绿主色 (#BFFF09)
  - 非对称切角容器 (24px 24px 0 24px，左下收直角)
  - 棋盘格 / 对角斜线纹理点缀
  - 胶囊按钮 (9999px) + 斜体粗体小标签
  - 选中/悬停行：主色背景 + 黑字（InterKnot 标准选中态规范）
-->
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <!-- 根模板：输出 HTML 骨架，再 apply-templates 让 sitemapindex/urlset 模板填充 -->
  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>Sitemap · 沫然Blog</title>
        <style>
          :root {
            color-scheme: dark;
            --ik-bg: #0a0a0a;
            --ik-bg-elevated: #1a1a1a;
            --ik-bg-card: #222222;
            --ik-text: #e8e8e8;
            --ik-muted: #9a9a9a;
            --ik-primary: #BFFF09;
            --ik-primary-bright: #fbfe00;
            --ik-accent: #00e5ff;
            --ik-border: #2d2d2d;
            --ik-border-strong: #3a3a3a;
            --radius-cut: 24px 24px 0 24px;
            --radius-cut-inner: 20px 20px 0 20px;
            --mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: var(--ik-bg);
            color: var(--ik-text);
            line-height: 1.6;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            /* 极淡网格底纹，呼应 InterKnot 全局 grid pattern */
            background-image:
              linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
            background-size: 48px 48px;
            background-position: center top;
          }
          .container {
            width: min(1100px, calc(100% - 40px));
            margin: 0 auto;
            padding: 40px 0 64px;
          }

          /* ── 头部信息卡 ────────────────────────────── */
          .hero {
            position: relative;
            padding: 36px 32px;
            background: linear-gradient(180deg, #1c1c1c 0%, #121212 100%);
            border: 1px solid var(--ik-border);
            border-radius: var(--radius-cut);
            overflow: hidden;
          }
          /* 右上角棋盘格点缀（InterKnot chessboard-background） */
          .hero::before {
            content: '';
            position: absolute;
            top: 0; right: 0;
            width: 140px; height: 140px;
            background-image:
              linear-gradient(45deg, rgba(191,255,9,0.10) 25%, transparent 25% 75%, rgba(191,255,9,0.10) 75%),
              linear-gradient(45deg, rgba(191,255,9,0.10) 25%, transparent 25% 75%, rgba(191,255,9,0.10) 75%);
            background-position: 0 0, 10px 10px;
            background-size: 20px 20px;
            border-radius: 0 24px 0 100%;
            pointer-events: none;
            opacity: 0.9;
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 12px;
            font-weight: 800;
            font-style: italic;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: var(--ik-primary);
          }
          .eyebrow::before {
            content: '';
            width: 28px; height: 2px;
            background: var(--ik-primary);
          }
          .hero-title {
            position: relative;
            margin: 14px 0 8px;
            font-size: clamp(1.8rem, 4vw, 2.6rem);
            font-weight: 900;
            letter-spacing: -0.5px;
            line-height: 1.1;
            color: #fff;
          }
          .hero-desc {
            position: relative;
            color: var(--ik-muted);
            font-size: 1rem;
            max-width: 60ch;
          }

          /* 统计胶囊条 */
          .stats {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 24px;
            position: relative;
          }
          .stat {
            display: inline-flex;
            align-items: baseline;
            gap: 8px;
            padding: 10px 16px;
            background: #0e0e0e;
            border: 1px solid var(--ik-border);
            border-radius: 9999px;
          }
          .stat__num {
            font-size: 1.1rem;
            font-weight: 900;
            color: var(--ik-primary);
            font-variant-numeric: tabular-nums;
            line-height: 1;
          }
          .stat__label {
            font-size: 12px;
            color: var(--ik-muted);
            letter-spacing: 0.3px;
          }
          /* 缩小版统计胶囊（用于精简展示） */
          .stat--sm { padding: 7px 13px; }
          .stat--sm .stat__num { font-size: 0.85rem; }
          .stat--sm .stat__label { font-size: 11px; }

          /* ── 说明横幅（对角斜线纹理，InterKnot linear-pattern-background） ── */
          .banner {
            position: relative;
            margin-top: 20px;
            padding: 16px 20px;
            background: var(--ik-bg-elevated);
            border: 1px solid var(--ik-border);
            border-left: 3px solid var(--ik-primary);
            border-radius: 12px;
            font-size: 0.9rem;
            color: var(--ik-muted);
            overflow: hidden;
          }
          .banner::after {
            content: '';
            position: absolute;
            inset: 0;
            background-image: repeating-linear-gradient(40deg, transparent 0 5px, rgba(191,255,9,0.04) 5px 10px);
            pointer-events: none;
          }
          .banner strong { color: var(--ik-text); font-weight: 600; position: relative; }
          .banner a { color: var(--ik-primary); text-decoration: none; position: relative; }
          .banner a:hover { text-decoration: underline; }
          .banner > * { position: relative; }

          /* ── 章节标题 ──────────────────────────────── */
          .section-head {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 12px;
            margin: 40px 4px 20px;
          }
          .section-title {
            font-size: 1.05rem;
            font-weight: 800;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: #fff;
          }
          .section-count {
            font-size: 13px;
            color: var(--ik-muted);
            font-variant-numeric: tabular-nums;
          }
          .section-count strong { color: var(--ik-primary); font-weight: 800; }

          /* ── 表格容器（非对称切角） ─────────────────── */
          .table-wrap {
            position: relative;
            padding: 4px;
            background: #000;
            border: 1px solid var(--ik-border);
            border-radius: var(--radius-cut);
            overflow-x: auto;
          }
          .table-wrap__inner {
            background: linear-gradient(180deg, #1e1e1e 0%, #161616 100%);
            border-radius: var(--radius-cut-inner);
            overflow: hidden;
            min-width: 480px;
          }
          table { width: 100%; border-collapse: collapse; }
          thead { background: rgba(255,255,255,0.02); }
          th {
            text-align: left;
            padding: 14px 18px;
            font-size: 0.74rem;
            font-weight: 800;
            color: var(--ik-muted);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-bottom: 1px solid var(--ik-border);
            white-space: nowrap;
          }
          td {
            padding: 13px 18px;
            border-bottom: 1px solid var(--ik-border);
            font-size: 0.9rem;
            vertical-align: top;
          }
          tr:last-child td { border-bottom: none; }
          /* 选中/悬停行：主色背景 + 黑字（InterKnot 标准选中态规范） */
          tbody tr { transition: background-color 0.12s ease, color 0.12s ease; }
          tbody tr:hover { background: var(--ik-primary); }
          tbody tr:hover td { color: #000; }
          tbody tr:hover td.num,
          tbody tr:hover td.date { color: #000; opacity: 0.7; }
          tbody tr:hover td.url a { color: #000; text-decoration: underline; }
          td.num {
            color: var(--ik-border-strong);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
            width: 3.5rem;
            font-family: var(--mono);
            font-size: 0.85rem;
          }
          td.url { min-width: 200px; }
          td.url a {
            color: var(--ik-text);
            text-decoration: none;
            word-break: break-all;
            transition: color 0.12s ease;
          }
          td.url a:hover { color: var(--ik-primary); }
          td.date {
            color: var(--ik-muted);
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
            font-family: var(--mono);
            font-size: 0.85rem;
          }

          /* ── 空状态 ────────────────────────────────── */
          .empty {
            padding: 48px 24px;
            text-align: center;
            color: var(--ik-muted);
            background: var(--ik-bg-elevated);
            border: 1px dashed var(--ik-border);
            border-radius: var(--radius-cut);
          }

          /* ── 页脚 ──────────────────────────────────── */
          .ik-footer {
            margin-top: 56px;
            padding: 28px 0 0;
            border-top: 1px solid #1e1e1e;
            text-align: center;
            color: var(--ik-muted);
            font-size: 13px;
            line-height: 1.7;
          }
          .ik-footer a { color: var(--ik-primary); text-decoration: none; }
          .ik-footer a:hover { text-decoration: underline; }
          .ik-footer .brand { color: #fff; font-weight: 800; letter-spacing: 0.3px; }

          /* ── 响应式 ────────────────────────────────── */
          @media (max-width: 640px) {
            .container { width: calc(100% - 24px); padding: 24px 0 48px; }
            .hero { padding: 26px 20px; }
            .hero::before { width: 90px; height: 90px; }
            .stats { gap: 8px; }
            .stat { padding: 8px 12px; }
            th, td { padding: 11px 14px; }
          }

          @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <xsl:apply-templates/>
          <footer class="ik-footer">
            <p><span class="brand">沫然Blog</span> · Sitemap</p>
            <p>此页面由 <a href="https://github.com/moaradc/blog-content/blob/main/docs/xsl/sitemap.xsl">sitemap.xsl</a> 自动渲染 · <a href="/">返回首页</a></p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>

  <!-- sitemapindex 模式：分片索引 -->
  <xsl:template match="sm:sitemapindex">
    <section class="hero">
      <span class="eyebrow">Sitemap Index</span>
      <h1 class="hero-title">Sitemap 索引</h1>
      <p class="hero-desc">这是一个分片索引文件，搜索引擎会分别抓取其中的每个子 sitemap。</p>
      <div class="stats">
        <span class="stat"><span class="stat__num"><xsl:value-of select="count(sm:sitemap)"/></span><span class="stat__label">个子 Sitemap</span></span>
      </div>
      <div class="banner">
        📂 这是 <strong>Sitemap 索引</strong>文件，包含 <strong><xsl:value-of select="count(sm:sitemap)"/></strong> 个子 sitemap。搜索引擎会分别抓取每个子 sitemap。
      </div>
    </section>

    <div class="section-head">
      <h2 class="section-title">子 Sitemap 列表</h2>
      <span class="section-count">共 <strong><xsl:value-of select="count(sm:sitemap)"/></strong> 条</span>
    </div>

    <xsl:choose>
      <xsl:when test="sm:sitemap">
        <div class="table-wrap">
          <div class="table-wrap__inner">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>子 Sitemap 地址</th>
                  <th>更新时间</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sm:sitemap">
                  <tr>
                    <td class="num"><xsl:value-of select="position()"/></td>
                    <td class="url">
                      <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                    </td>
                    <td class="date">
                      <xsl:value-of select="substring(sm:lastmod, 1, 10)"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <div class="empty">索引为空，暂无子 sitemap。</div>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- urlset 模式：URL 列表 -->
  <xsl:template match="sm:urlset">
    <section class="hero">
      <span class="eyebrow">Sitemap</span>
      <h1 class="hero-title">站点地图</h1>
      <p class="hero-desc">沫然Blog 的站点地图，列出所有可被搜索引擎抓取的 URL。</p>
      <div class="stats">
        <span class="stat stat--sm"><span class="stat__num"><xsl:value-of select="count(sm:url)"/></span><span class="stat__label">个 URL</span></span>
      </div>
    </section>

    <div class="section-head">
      <h2 class="section-title">URL 列表</h2>
    </div>

    <xsl:choose>
      <xsl:when test="sm:url">
        <div class="table-wrap">
          <div class="table-wrap__inner">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>URL</th>
                  <th>最后修改</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sm:url">
                  <tr>
                    <td class="num"><xsl:value-of select="position()"/></td>
                    <td class="url">
                      <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                    </td>
                    <td class="date">
                      <xsl:value-of select="substring(sm:lastmod, 1, 10)"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <div class="empty">Sitemap 为空，暂无 URL。</div>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>
