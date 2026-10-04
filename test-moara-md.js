#!/usr/bin/env node
/* moara-md 单元测试（第三轮：含嵌套折叠/图标动画联动回归） */
const M = require('./moara-md.js');
const { marked } = require('marked');
let pass = 0, fail = 0;
function t(name, cond) {
    if (cond) { pass++; }
    else { fail++; console.error('  ✗ ' + name); }
}
function render(md) {
    const pre = M.preprocess(md, { onWarn: () => {} });
    let html = marked.parse(pre.text, { breaks: true, gfm: true });
    return M.postprocess(html, pre.ctx, { parseInline: (x) => marked.parseInline(x) });
}

/* ── 1. 嵌套折叠 ── */
{
    const md = [':::folding{title="外层" open}', '', '外层文字', '', ':::folding{title="内层"}', '', '内层文字', '', ':::', '', ':::', '', '后续'].join('\n');
    const h = render(md);
    const boxes = (h.match(/details-box/g) || []).length;
    t('嵌套：恰好两个折叠盒', boxes === 2);
    t('嵌套：内层盒在外层 open 盒内', h.indexOf('details-box open') < h.indexOf('内层文字') && h.indexOf('内层文字') < h.lastIndexOf('</div>'));
    t('嵌套：外层内容保留', h.includes('外层文字'));
    t('嵌套：无裸 fence 残留', !h.includes('::::') && !/:{3,}\s*<\/p>/.test(h));
}
/* ── 2. 嵌套折叠 + 代码围栏 + 选项卡 ── */
{
    const md = [':::folding{title="外"}', '', '::::tabs', ':::tab{title="A"}', '面板A', ':::', '::::', '', ':::'].join('\n');
    const h = render(md);
    t('嵌套：tabs 折叠内渲染', h.includes('md-tabs') && h.includes('details-box') && h.indexOf('md-tabs') > h.indexOf('details-box'));
}
/* ── 3. 脚注区结构（div 标题 + 命中 header 规避） ── */
{
    const md = ['正文[^1]', '', '[^1]: 解释文字'].join('\n');
    const h = render(md);
    t('脚注：<div> 标题（非 header）', h.includes('<div class="footnotes-title">') && !h.includes('<header'));
    t('脚注：回引按钮', h.includes('footnote-backref'));
    t('脚注：未定义引用保留原文', render('只剩未定义[^missing]').includes('[^missing]'));
}
/* ── 4. 视频发射（纵横比 + 无边框依赖） ── */
{
    const h = render(':::video{type="bilibili" id="BV1x" title="B"}');
    t('视频：16:9 内联纵横比', h.includes('aspect-ratio:16 / 9'));
    t('视频：iframe 填充协议', h.includes('video-embed') && h.includes('<iframe'));
    t('视频：直链裸 video', render('::video{url="https://x/v.mp4"}').includes('<video'));
}
/* ── 5. 数学（回归） ── */
{
    const pre = M.preprocess('$$\\nabla$$ 与 $E$ 与 \\(x\\)', {});
    t('数学：占位符摘离', pre.text.indexOf('%%MD_MATH') > -1 && !pre.text.includes('$$'));
}
/* ── 6. 裸 gallery 自动闭合（回归） ── */
{
    const h = render('<gallery src="a, b">\n\n后续段落');
    t('gallery：自动补闭合', h.includes('</gallery>') || (h.includes('gallery') && h.includes('后续段落')));
}
/* ── 7. 折叠内叶子指令（回归） ── */
{
    const h = render([':::folding{title="T"}', '', '::video{url="https://x/v.mp4"}', '', ':::'].join('\n'));
    t('叶子进容器：视频在折叠内', /details-inner[\s\S]*?<video/.test(h));
}
/* ── 8. 提示框（回归） ── */
{
    const h = render('> [!TIP]+ 提示\n> 内容');
    t('提示框：折叠态渲染', h.includes('admonition') && h.includes('提示'));
}
/* ── 9. 链接卡（回归） ── */
{
    const h = render(':::linkcard{url="https://example.com/a" title="标"}');
    t('链接卡：首字回退', h.includes('md-linkcard-fallback'));
}
/* ── 10. 未闭合降级（回归） ── */
{
    const md = ':::folding{title="X"}\n内容未闭合';
    const h = render(md);
    t('未闭合：内容不丢', h.includes('内容未闭合'));
}

console.log(`${pass + fail} 项断言：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
