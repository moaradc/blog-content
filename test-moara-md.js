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
    t('脚注：回引协议 v4（fn-jump 按钮化）', h.includes('data-fn-jump'));
    t('脚注：未定义引用保留原文', render('只剩未定义[^missing]').includes('[^missing]'));
}
/* ── 4. 视频发射（纵横比 + 无边框依赖） ── */
{
    const h = render(':::video{type="bilibili" id="BV1x" title="B"}');
    t('视频：16:9 内联纵横比', h.includes('aspect-ratio:16 / 9'));
    t('视频：门面容器（无iframe直出）', h.includes('video-embed') && !h.includes('<iframe'));
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

/* 由生成器追加的 v4 断言组（独立计数） */
{
    let v4pass = 0, v4fail = 0;
    const t4 = (name, cond) => { if (cond) v4pass++; else { v4fail++; console.error('  ✗ [v4] ' + name); } };
    const h_fn = render('正文[^1]文字\n\n[^1]: 脚注定义');
    t4('脚注：标题书本图标存在', (h_fn.match(/ri-book-open-line/g) || []).length >= 1);
    t4('脚注 v4：前置跳转按钮、无尾部回引', h_fn.includes('data-fn-jump') && !h_fn.includes('footnote-backref'));
    t4('脚注 v6：圈号与正文共用 fn-ref 源码 class', /class="fn-ref fn-jump"[^>]*data-fn-jump="fnref-1"[^>]*>1</.test(h_fn));
    t4('脚注 v6：标题图标回退 book-open', h_fn.includes('ri-book-open-line'));
    t4('脚注 v4：sup 引用保留', h_fn.includes('fn-ref'));
    const h_v = render(':::video{type="youtube" id="aqz-KE-bpKQ" title="演示"}');
    t4('视频 v4：门面按钮、无 iframe 直出', h_v.includes('data-video-embed') && h_v.includes('video-poster') && !h_v.includes('<iframe'));
    t4('视频 v4：autoplay=1 点击即播', /autoplay=1/.test(h_v));
    const h_vb = render(':::video{type="bilibili" id="BV1GJ411x7h7" title="演示"}');
    t4('视频 v4：B站门面 + autoplay', h_vb.includes('ri-bilibili-line') && /autoplay=1/.test(h_vb));
    t4('提示框 v4：无尾缀默认折叠', (() => { const h = render('> [!TIP] 无尾缀\n> 内容'); return h.includes('data-collapsible') && !h.includes('data-open="true"'); })());
    t4('提示框 v4：+ 默认展开', (() => { const h = render('> [!TIP]+ 展开\n> 内容'); return h.includes('data-open="true"'); })());
    t4('提示框 v4：- 显式折叠', (() => { const h = render('> [!TIP]- 收起\n> 内容'); return h.includes('data-collapsible') && !h.includes('data-open="true"'); })());
    console.log(`v4 组：${v4pass + v4fail} 项：${v4pass} 通过，${v4fail} 失败`);
    if (v4fail) process.exitCode = 1;
}

console.log(`${pass + fail} 项断言：${pass} 通过，${fail} 失败`);
/* ── 7. 选项卡折叠协议 + 注释外链新标签页（v13） ── */
{
    const h = render('::::tabs\n\n:::tab{title="A"}\n甲\n:::\n\n:::tab{title="B"}\n乙\n:::\n\n::::');
    t('tabs v13：默认折叠（无 open 类）', h.includes('class="md-tabs" data-md-tabs>') && !h.includes('md-tabs open'));
    t('tabs v13：右上折叠图标（同 details-icon）', h.includes('md-tabs-toggle') && h.includes('details-icon ri-arrow-right-s-line'));
    t('tabs v13：折叠图标 aria-expanded=false', /md-tabs-toggle[^>]*aria-expanded="false"/.test(h));
    t('tabs v13：面板包裹进 md-tabs-body', h.includes('md-tabs-body'));
    const h2 = render('::::tabs{open}\n\n:::tab{title="A"}\n甲\n:::\n\n::::');
    t('tabs v13：{open} 默认展开', h2.includes('class="md-tabs open"') && /md-tabs-toggle[^>]*aria-expanded="true"/.test(h2));
    const hfn = render('见[^1]\n\n[^1]: 参见 [规范](https://example.com/spec) 与锚点');
    t('注释 v13：外链新标签页（target=_blank + noopener）', hfn.includes('<a href="https://example.com/spec" target="_blank" rel="noopener noreferrer"'));
    t('注释 v13：fn-jump 回引不受影响（无 target）', /class="fn-ref fn-jump"[^>]*>1</.test(hfn) && !/fn-jump[^>]*target=/.test(hfn));
}
console.log((pass + fail) + ' 项断言：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
