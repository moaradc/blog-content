<?xml version="1.0" encoding="UTF-8"?>
<!--
  docs/xsl/sitemap.xsl
  沫然Blog sitemap 可视化样式表（原创设计）

  功能：让浏览器打开 sitemap.xml 时渲染成可读的 HTML 表格，而非裸 XML。
  对爬虫无影响（爬虫忽略 <?xml-stylesheet?> 处理指令，只读 XML 节点）。

  特性：
  - 单文件兼顾 sitemapindex 和 urlset 两种文档类型
  - 响应式暗色/亮色双主题（跟随系统 prefers-color-scheme）
  - 表格布局，窄屏可横向滚动
  - 顶部 banner 说明用途
  - lastmod 截取前 10 字符（YYYY-MM-DD），去掉时间部分
  - <meta name="robots" content="noindex"> 防止样式表渲染的 HTML 被搜索引擎误收
  - XSLT 1.0（浏览器只实现 1.0，不能用 2.0 语法）
-->
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
                exclude-result-prefixes="sm">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex" />
        <title>Sitemap · 沫然Blog</title>
        <style>
          :root {
            --bg: #ffffff;
            --bg-alt: #f6f7f9;
            --fg: #1a1a1a;
            --fg-muted: #6b7280;
            --border: #e5e7eb;
            --accent: #2563eb;
            --accent-hover: #1d4ed8;
            --shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #1a1a1a;
              --bg-alt: #222222;
              --fg: #e5e5e5;
              --fg-muted: #9ca3af;
              --border: #374151;
              --accent: #60a5fa;
              --accent-hover: #93c5fd;
              --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: var(--bg-alt);
            color: var(--fg);
            padding: 2rem 1rem;
            line-height: 1.6;
            min-height: 100vh;
          }
          .container { max-width: 960px; margin: 0 auto; }
          header { margin-bottom: 1.5rem; }
          h1 {
            font-size: 1.6rem;
            font-weight: 700;
            margin-bottom: 0.4rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .subtitle { color: var(--fg-muted); font-size: 0.95rem; }
          .banner {
            background: var(--bg);
            border: 1px solid var(--border);
            border-left: 4px solid var(--accent);
            border-radius: 6px;
            padding: 0.875rem 1.125rem;
            margin-bottom: 1.25rem;
            font-size: 0.9rem;
            color: var(--fg-muted);
          }
          .banner strong { color: var(--fg); font-weight: 600; }
          .banner a { color: var(--accent); text-decoration: none; }
          .banner a:hover { text-decoration: underline; }
          .table-wrap {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow-x: auto;
            box-shadow: var(--shadow);
          }
          table { width: 100%; border-collapse: collapse; min-width: 480px; }
          thead { background: var(--bg-alt); }
          th {
            text-align: left;
            padding: 0.75rem 1rem;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--fg-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid var(--border);
            white-space: nowrap;
          }
          td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.9rem;
            vertical-align: top;
          }
          tr:last-child td { border-bottom: none; }
          tbody tr:hover { background: var(--bg-alt); }
          td.num { color: var(--fg-muted); font-variant-numeric: tabular-nums; white-space: nowrap; width: 3rem; }
          td.url a {
            color: var(--accent);
            text-decoration: none;
            word-break: break-all;
          }
          td.url a:hover { color: var(--accent-hover); text-decoration: underline; }
          td.date {
            color: var(--fg-muted);
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 0.85rem;
          }
          td.empty { text-align: center; color: var(--fg-muted); padding: 2rem; }
          footer {
            margin-top: 1.5rem;
            text-align: center;
            color: var(--fg-muted);
            font-size: 0.85rem;
          }
          footer a { color: var(--accent); text-decoration: none; }
          footer a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>🗺️ Sitemap</h1>
            <p class="subtitle">沫然Blog 的站点地图，列出所有可被搜索引擎抓取的 URL</p>
          </header>

          <!-- sitemapindex 模式：分片索引 -->
          <xsl:if test="/*/local-name() = 'sitemapindex'">
            <div class="banner">
              📂 这是一个 <strong>Sitemap 索引</strong>文件，包含 <strong><xsl:value-of select="count(//sm:sitemap)" /></strong> 个子 sitemap。
              搜索引擎会分别抓取每个子 sitemap。
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>子 Sitemap 地址</th>
                    <th>更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="//sm:sitemap">
                    <tr>
                      <td class="num"><xsl:value-of select="position()" /></td>
                      <td class="url">
                        <a href="{sm:loc}"><xsl:value-of select="sm:loc" /></a>
                      </td>
                      <td class="date">
                        <xsl:value-of select="substring(sm:lastmod, 1, 10)" />
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </xsl:if>

          <!-- urlset 模式：URL 列表 -->
          <xsl:if test="/*/local-name() = 'urlset'">
            <div class="banner">
              📄 这个 Sitemap 包含 <strong><xsl:value-of select="count(//sm:url)" /></strong> 个 URL。
              <a href="/">← 返回首页</a>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL</th>
                    <th>最后修改</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="//sm:url">
                    <tr>
                      <td class="num"><xsl:value-of select="position()" /></td>
                      <td class="url">
                        <a href="{sm:loc}"><xsl:value-of select="sm:loc" /></a>
                      </td>
                      <td class="date">
                        <xsl:value-of select="substring(sm:lastmod, 1, 10)" />
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </xsl:if>

          <footer>
            <p>此页面由 <a href="https://github.com/moaradc/blog-content/blob/main/docs/xsl/sitemap.xsl">sitemap.xsl</a> 自动生成 · <a href="/">沫然Blog</a></p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
