---
title: Markdown 组件语法全览
date: 2026-10-03 08:20
last_modified: 2026-11-25 20:30
author: moara
category: ["Demo"]
tags: ["Demo", "Markdown"]
desc: 沫然Blog 全部 Markdown 扩展组件与嵌套组合矩阵：折叠、选项卡、提示框、视频、卡片、图表、数学、脚注等。
math: true
---
本文是博客 Markdown 扩展语法的**完整演示**：先逐一列举全部组件，再给出**嵌套组合矩阵**。所有组件由 `moara-md` 扩展层渲染（浏览器端与 `/posts/<id>` 直出共用同一实现，产物一致）。

> [!NOTE]
> 提示框（Admonition）共 **13 种类型**：`NOTE` `ABSTRACT` `INFO` `TIP` `SUCCESS` `QUESTION` `WARNING` `FAILURE` `DANGER` `BUG` `EXAMPLE` `QUOTE` `IMPORTANT`。全部默认可折叠；同义别名（`TLDR` `CAUTION` `ERROR` 等）自动归并。

> [!TIP]+ 可折叠提示框
> 尾缀 `+` 默认展开，`-` 或无尾缀默认收起。展开/收起为即时切换（无动画、零闪烁）。

> [!WARNING]- 收起状态的警告
> 这一栏默认收起，点击标题即可展开。内部支持嵌套任意块级语法（见下方 §2 / §3 矩阵）。

## 1. 提示框 13 类型全览

> [!NOTE]
> 备注类型：用于补充说明与背景信息。

> [!ABSTRACT]
> 摘要类型：文章概要、TLDR。

> [!INFO]
> 信息类型：中性提示。

> [!TIP]
> 提示类型：小技巧与最佳实践。

> [!SUCCESS]
> 成功类型：完成状态确认。

> [!QUESTION]
> 问题类型：常见疑问。

> [!WARNING]
> 警告类型：需要注意的事项。

> [!FAILURE]
> 失败类型：出错的场景。

> [!DANGER]
> 危险类型：高风险操作警示。

> [!BUG]
> 缺陷类型：已知问题记录。

> [!EXAMPLE]+ 示例类型（已展开）
> 示例类型默认展开的样子：内部可以继续嵌套**行内元素** <mark>标记</mark>、<kbd>Ctrl</kbd> 按键、:spoiler[黑幕] 与[链接](https://example.com)。

> [!QUOTE]
> 引用类型：摘录他人观点。

> [!IMPORTANT]
> 重要类型：关键结论。

别名归一演示（`CAUTION` → 警告色、`TLDR` → 摘要色）：

> [!CAUTION]
> 这是 `CAUTION` 别名，渲染为 warning 样式。

> [!TLDR]
> 这是 `TLDR` 别名，渲染为 abstract 样式。

## 2. 折叠面板 :::folding

折叠面板取代了旧版手写 HTML。**内部支持所有块级语法**：列表、表格、代码块、甚至嵌套折叠。

:::folding{title="点击展开 — 查看代码块与列表"}

- 列表项一
- 列表项二
- 列表项三

```ts
export interface Post {
  id: string;
  title: string;
  html: string;
}
```

:::

:::folding{title="嵌套折叠：外层面板" open}

外层默认展开（`open` 属性）。内层默认收起，**内层里面还有第三层**：

:::folding{title="内层折叠 — 双层嵌套"}

内层折叠内容：内层面板内部再嵌一层：

:::folding{title="三层折叠 — 第三层"}

这里是在折叠内、折叠内的**第三层折叠**——外层、内层、第三层逐层缩进嵌套。

:::

:::

:::

### 折叠面板内的组件全家桶

以下折叠面板**默认展开**，内部逐项演示每种组件的嵌套形态：

:::folding{title="组件全家桶：折叠内嵌套一切" open}

普通段落：折叠面板内的正文文字，支持**加粗**、*斜体*、`行内代码`、[链接](https://example.com)。

无序列表与有序列表：

- 无序项 A
- 无序项 B

1. 有序项一
2. 有序项二

任务列表（GFM）：

- [x] 已完成的任务
- [ ] 待办任务
- [ ] 另一个待办

表格：

| 组件 | 嵌套 | 说明 |
|---|:---:|---|
| 折叠 | ✓ | 任意层级 |
| 选项卡 | ✓ | 见 §3 |
| 提示框 | ✓ | 下一项演示 |

代码块：

```js
console.log('折叠面板内的代码块');
```

提示框：

> [!TIP]
> 折叠面板内的提示框：绿色左边条同样生效。

Mermaid 图表：

```mermaid
flowchart LR
    A[折叠内图表] --> B[正常渲染]
```

数学公式：

$$
E = mc^2 \quad \text{（折叠内公式）}
$$

链接卡与仓库卡：

::linkcard{url="https://github.com/moaradc/MOARA" title="折叠内的链接卡"}

::github{repo="markedjs/marked"}

视频（叶子形式）：

::video{type="bilibili" id="BV1GJ411x7h7" title="折叠内的视频"}

图片与引用块：

![折叠内图片](https://picsum.photos/600/340)

> 折叠面板内的引用块（普通 blockquote）。

原生 `<details>`（HTML 直写在折叠内）：

<details>
<summary>折叠内的原生 details</summary>

原生 details 嵌套在 :::folding 内部。

</details>

行内元素一排：<mark>荧光标记</mark>、<kbd>Ctrl</kbd>、:spoiler[黑幕]、H<sub>2</sub>O、x<sup>2</sup>。

:::

## 3. 选项卡 ::::tabs

选项卡两种形态：`{open}` 默认展开；无属性默认折叠（仅标题栏可见）。

`notoc` 属性控制容器内标题是否进目录：提示框 `> [!NOTE]{notoc}`、折叠面板
`:::folding{notoc}`、选项卡面板 `:::tab{notoc}` 均可单点排除；组级
`::::tabs{notoc}` 一键排除整组面板，面板级 `notoc=false` 可单独放开。

::::tabs{notoc}

:::tab{title="组级排除"}

```bash
npm install moara-md
```

面板内小节（组级 `notoc` 排除，不进目录）：

### 组级排除的小节

:::

:::tab{title="单独放开" notoc=false}

面板写 `notoc=false`：仅本面板标题回到目录。

### 面板级放开的小节

:::

::::

> [!NOTE]{notoc} 提示框排除（标题自定义）
> `> [!NOTE]{notoc}`：框内标题不进目录。
>
> ### 提示框排除的小节
> 此 H3 不出现在目录卡片中。

:::folding{title="折叠面板 notoc 演示" notoc open}

`:::folding{notoc}`：面板内标题不进目录。

### 折叠面板排除的小节

:::


:::::tabs{open}

:::tab{title="安装" notoc}

```bash
npm install moara-md
```

面板内小节（`notoc` 属性使标题不进目录）：

### 面板内小节（不进目录）

此处 H3 不会出现在目录卡片中。

:::

:::tab{title="配置与表格"}

选项卡内的表格：

| 项 | 值 |
|---|---|
| 主题 | oklch |
| 字体 | Space Grotesk |

选项卡内的提示框：

> [!EXAMPLE]+ 选项卡内提示框
> 提示框嵌在选项卡面板里，默认展开。

:::

:::tab{title="折叠与代码"}

选项卡内的折叠面板：

:::folding{title="选项卡内的折叠" open}

折叠面板嵌在选项卡面板里，内部再有代码块：

```js
console.log('tabs > folding > code');
```

:::

:::

:::tab{title="图表与公式"}

选项卡内的 Mermaid：

```mermaid
pie showData
    title 选项卡内饼图
    "A" : 60
    "B" : 40
```

选项卡内的数学：

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

:::

:::tab{title="嵌套选项卡"}

选项卡嵌套选项卡（内层五冒号围栏）：

:::::tabs{open}

:::tab{title="内层 A"}

内层选项卡面板 A。

:::

:::tab{title="内层 B"}

内层选项卡面板 B：嵌套层级不受限制（栈式解析）。

:::

:::::

:::

:::tab{title="卡片与视频"}

选项卡内的叶子指令（单行压缩）：

::linkcard{url="https://github.com/moaradc/MOARA" title="选项卡内链接卡"}

::github{repo="markedjs/marked"}

::video{type="youtube" id="aqz-KE-bpKQ" title="选项卡内视频"}

:::

:::::

横向滑动演示（10 个选项卡，无属性默认折叠）：

:::::tabs

:::tab{title="第 1 步：安装"}

第 1 步内容。

:::

:::tab{title="第 2 步：初始化"}

第 2 步内容。

:::

:::tab{title="第 3 步：配置"}

第 3 步内容。

:::

:::tab{title="第 4 步：迁移"}

第 4 步内容。

:::

:::tab{title="第 5 步：构建"}

第 5 步内容。

:::

:::tab{title="第 6 步：测试"}

第 6 步内容。

:::

:::tab{title="第 7 步：联调"}

第 7 步内容。

:::

:::tab{title="第 8 步：灰度"}

第 8 步内容。

:::

:::tab{title="第 9 步：发布"}

第 9 步内容。

:::

:::tab{title="第 10 步：运维"}

第 10 步内容。

:::

:::::

## 4. 提示框内嵌套容器

提示框（引用块变换）内部同样支持容器指令——每行加 `>` 前缀即可：

> [!INFO]+ 提示框内的折叠面板
> 提示框内部直接嵌套 :::folding：
>
> :::folding{title="提示框内的折叠" open}
>
> 折叠面板渲染在提示框内部。
>
> :::
>
> 提示框内也可以放**普通嵌套引用**：
>
> > 提示框内的一层引用。
> >
> > > 提示框内的两层引用。

> [!QUESTION]+ 提示框内的图表与公式
> ```mermaid
> flowchart LR
>     Q[提示框内] --> R[图表正常]
> ```
>
> $$a^2 + b^2 = c^2$$

> [!NOTE]+ 提示框内的卡片与表格
> ::linkcard{url="https://github.com/moaradc/MOARA" title="提示框内链接卡"}
>
> ::github{repo="markedjs/marked"}
>
> ::video{type="bilibili" id="BV1GJ411x7h7" title="提示框内的视频"}
>
> | 位置 | 卡片 |
> |---|---|
> | 提示框内 | ✓ |

## 5. 视频嵌入 :::video

::::video{type="bilibili" id="BV1GJ411x7h7" title="演示：Bilibili 嵌入"}

::::video{type="youtube" id="aqz-KE-bpKQ" title="演示：YouTube 嵌入"}

直链视频（裸 `<video>` 标签，无外壳跟随原始比例）：

<video src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" controls muted title="演示：直链原生视频"></video>

折叠块内既可用叶子形式 `::video`，也可用块形式（见 §2 全家桶）。

## 6. 链接卡片 :::linkcard

:::linkcard{url="https://github.com/moaradc/MOARA" title="MOARA 主仓库"}

:::linkcard{url="https://example.com/docs/guide.pdf" title="文件链接：按后缀显示文件图标"}

:::linkcard{post="103" title="站内文章卡片（标题由目标文章 frontmatter 自动填充）"}

:::linkcard{url="https://www.baidu.com" title="直连 favicon 演示：取自 www.baidu.com/favicon.ico"}

## 7. 仓库卡片 :::github

:::github{repo="markedjs/marked"}

## 8. 数学公式（frontmatter `math: true`）

行内公式 $e^{i\pi} + 1 = 0$ 与块级公式：

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0
\end{aligned}
$$

## 9. 行内元素

- 高亮 <mark>荧光笔标记</mark>（酸绿色，双模式高对比）
- 键盘按键 <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Del</kbd>
- 上下标：H<sub>2</sub>O 与 x<sup>2</sup> + y<sup>2</sup> = r<sup>2</sup>
- 行内黑幕（防剧透）：凶手是 :spoiler[黑衣人]，点击显示。
- 行内代码 `const x = 42;`

## 10. 链接包裹图片与裸图

链接包裹的图片：**点击图片本身打开灯箱**预览；跳转链接收在灯箱的 *i* 信息面板里：

[![示例图片：点击开灯箱](https://picsum.photos/800/450)](https://unsplash.com)

裸图（无链接）点击同样打开灯箱预览：

![裸图：点击打开灯箱](https://picsum.photos/800/450)

## 11. 脚注

摩尔 Blog 的脚注语法与 GFM 一致[^gfm]，定义可以写在任意位置[^anywhere]，渲染时统一汇总到文末「注释」区。**未写定义的引用**（如这条[^missing]）按原文显示、不进入注释区；点击脚注不更新地址栏。

[^gfm]: 参见 GitHub Flavored Markdown Spec 的脚注扩展。
[^anywhere]: 引用处按首次出现顺序编号，支持[**行内 Markdown**](https://github.github.com/gfm/) 与多行定义。

## 12. 表格对齐

| 左对齐列 | 居中列 | 右对齐列 |
|:---|:---:|---:|
| GitHub | 1 | 100 |
| 掘金 | 2 | 200 |
| 知乎 | 3 | 300 |
| b 站 | 1 | 1000 |
| 云盘 | 2 | 2000 |
| 邮箱 | 3 | 3000 |

## 13. Mermaid 图表类型全集

`moara-md` 不拦截 Mermaid——交给 `article.js` 加载的 Mermaid 10.9 渲染。常用 12 种图：

```mermaid
flowchart TD
    A[开始] --> B{条件?}
    B -- 是 --> C[执行]
    B -- 否 --> D[跳过]
    C --> E[结束]
    D --> E
```

```mermaid
sequenceDiagram
    participant U as 用户
    participant S as 服务器
    U->>S: 请求文章
    S-->>U: 返回 HTML
    U->>S: 请求评论
    S-->>U: 返回 JSON
```

```mermaid
classDiagram
    class Article {
        +String title
        +String html
        +render()
    }
    class Comment {
        +String body
        +post()
    }
    Article "1" --> "n" Comment : 拥有
```

```mermaid
stateDiagram-v2
    [*] --> 草稿
    草稿 --> 发布: 审核通过
    发布 --> 修订: 更新
    修订 --> 发布
    发布 --> [*]
```

```mermaid
erDiagram
    USER ||--o{ POST : writes
    POST ||--o{ COMMENT : has
    USER ||--o{ COMMENT : leaves
```

```mermaid
gantt
    title 发版流程
    dateFormat YYYY-MM-DD
    section 开发
    功能开发 :a1, 2026-10-01, 6d
    section 测试
    回归测试 :a2, after a1, 3d
    section 上线
    灰度发布 :a3, after a2, 2d
```

```mermaid
pie showData
    title 流量来源
    "搜索" : 45
    "直接" : 30
    "外链" : 25
```

```mermaid
journey
    title 写博客的一天
    section 上午
      起床: 5: 我
      喝咖啡: 4: 我
    section 下午
      写文章: 5: 我, 读者
    section 晚上
      发布: 5: 我, 读者
```

```mermaid
mindmap
  root((博客))
    内容
      文章
      评论
    技术
      Astro
      moara-md
```

```mermaid
timeline
    title 博客演进
    2023 : 静态 HTML
    2024 : Hexo 迁移
    2025 : Astro 重构
    2026 : moara-md 扩展层
```

```mermaid
gitGraph
    commit id: "init"
    commit id: "posts"
    branch feature
    commit id: "moara-md"
    checkout main
    merge feature
    commit id: "release"
```

```mermaid
quadrantChart
    title 任务优先级
    x-axis "低价值" --> "高价值"
    y-axis "低成本" --> "高成本"
    quadrant-1 "重点关注"
    quadrant-2 "值得投入"
    quadrant-3 "顺手处理"
    quadrant-4 "果断放弃"
    "写文章": [0.8, 0.7]
    "修样式": [0.5, 0.3]
    "加彩蛋": [0.2, 0.6]
```

## 14. 原生 details 折叠

标准 HTML 折叠（与 `:::folding` 视觉风格统一）：

<details>
<summary>原生 details 折叠示例</summary>

内部同样支持 Markdown 语法（约定 summary 与内容间**保留空行**）。

- 项目 A
- 项目 B

</details>

<details>
<summary>原生 details（HTML 直写）</summary>

与 `:::folding` 视觉统一，垂直节奏同 0.8rem——用于校验裸 `<details>` 标签的留白一致性。

</details>

<details open>
<summary>默认展开 + 内部嵌套</summary>

原生 details 内的提示框与代码：

> [!TIP]
> 提示框嵌在原生 details 里。

```js
console.log('details > code');
```

</details>

## 15. 图集

### 15.1 新（主）语法：`:::gallery` 容器包裹 `![说明文字](图片地址)` 行

与折叠、选项卡同一套容器指令（栈式解析，支持嵌套）。每行 `![说明文字](地址)` 的说明文字渲染为图片下方的说明浮层；`{title="…"}` 可自定义标题栏：

:::gallery
![湖泊与山脉](https://picsum.photos/seed/lake-m/600/400)
![绿色森林中的小路](https://picsum.photos/seed/forest-m/600/750)
![海边日落](https://picsum.photos/seed/sunset-m/600/600)
![城市夜景](https://picsum.photos/seed/city-m/600/800)
:::

:::gallery{title="四时之景"}
![春 · 樱](https://picsum.photos/seed/spring-m/600/500)
![夏 · 海](https://picsum.photos/seed/summer-m/600/600)
![秋 · 山](https://picsum.photos/seed/autumn-m/600/700)
![冬 · 雪](https://picsum.photos/seed/winter-m/600/400)
:::

### 15.2 提示框内的图集

> [!NOTE] 提示框内图集
> 图集可出现在全部 13 种提示框内：
>
> :::gallery
> ![提示框内 · 蓝湖](https://picsum.photos/seed/note-m/600/600)
> ![提示框内 · 云杉](https://picsum.photos/seed/note2-m/600/800)
> :::

### 15.3 折叠面板内的图集

:::folding{title="展开查看折叠面板内的图集"}

:::gallery
![折叠内 · 晨雾](https://picsum.photos/seed/fold-m/600/500)
![折叠内 · 谷仓](https://picsum.photos/seed/fold2-m/600/650)
:::

:::

### 15.4 折叠面板嵌套折叠面板内的图集

:::folding{title="外层折叠（内有第二层）"}

内层折叠再嵌一层图集：

:::folding{title="内层折叠（图集在此层）"}

:::gallery
![双层折叠内 · 溪流](https://picsum.photos/seed/deep-m/600/700)
![双层折叠内 · 苔原](https://picsum.photos/seed/deep2-m/600/450)
:::

:::

:::

### 15.5 折叠面板内提示框内的图集

:::folding{title="折叠内提示框内图集"}

> [!TIP] 折叠面板内提示框
> 提示框位于折叠面板内，图集位于提示框内：
>
> :::gallery
> ![折叠内提示框内 · 极光](https://picsum.photos/seed/tip-m/600/600)
> ![折叠内提示框内 · 星轨](https://picsum.photos/seed/tip2-m/600/750)
> :::

:::

### 15.6 选项卡内的图集

::::tabs
:::tab{title="风景"}

:::gallery
![选项卡 · 山脊](https://picsum.photos/seed/tab1-m/600/600)
![选项卡 · 湖畔](https://picsum.photos/seed/tab2-m/600/800)
:::

:::
:::tab{title="街拍"}

:::gallery
![选项卡 · 巷口](https://picsum.photos/seed/tab3-m/600/500)
![选项卡 · 骑楼](https://picsum.photos/seed/tab4-m/600/650)
:::

:::
::::

### 15.7 属性控制与链接包裹（v1.2.0）

`notitle`（或 `title=""`）隐藏标题栏；`caption="false"` / `nocaption` 关闭说明浮层；`caption-color="…"` 调整说明文字颜色（图与文字撞色时用）；`[![说明](图)](链接)` 渲染为整格锚点（协议 v4：点击图片开灯箱，跳转链接显示在灯箱「i」信息面板）；长说明自动两行截断加省略号：

:::gallery{notitle}
![无标题栏 · 湖](https://picsum.photos/seed/nt1-m/600/600)
![无标题栏 · 林](https://picsum.photos/seed/nt2-m/600/800)
:::

:::gallery{title="pixiv"}
![](https://1814804152.cdn.123clouddisk.com/1814804152/ymjew503t0l000d7w32xne4num52gzj2DIYPAdYOAdeyDpxPDqJy.webp)
![](https://1814804152.cdn.123clouddisk.com/1814804152/ymjew503t0m000d7w32y3ocobrkotd34DIYPAdYOAdeyDpxPDqJy.jpg)
![](https://1814804152.cdn.123clouddisk.com/1814804152/yk6baz03t0l000d7w33g3oqn4u6j5t0eDIYPAdYOAdeyDpxPDqJy.webp)
![](https://1814804152.cdn.123clouddisk.com/1814804152/yk6baz03t0m000d7w33gwac32qm5i6zkDIYPAdYOAdeyDpxPDqJy.webp)
![](https://1814804152.cdn.123clouddisk.com/1814804152/yk6baz03t0n000d7w33hoq5x5d1rvsr6DIYPAdYOAdeyDpxPDqJy.webp)
:::

:::gallery{title="关闭说明浮层" caption="false"}
![说明被关闭 1](https://picsum.photos/seed/nc1-m/600/750)
![说明被关闭 2](https://picsum.photos/seed/nc2-m/600/400)
:::

:::gallery{title="金色说明文字" caption-color="#ffd54f"}
![金色 · 沙丘](https://picsum.photos/seed/gold1-m/600/500)
![金色 · 麦田](https://picsum.photos/seed/gold2-m/600/650)
:::

:::gallery{title="链接包裹与超长说明截断"}
[![点击跳转 Unsplash](https://picsum.photos/seed/lw1-m/600/600)](https://unsplash.com)
[![点击跳转 GitHub](https://picsum.photos/seed/lw2-m/600/800)](https://github.com)
![这是一段非常长的说明文字用来演示说明浮层的自动截断行为超过两行后应当以省略号收尾不再继续向下扩张](https://picsum.photos/seed/long-m/600/400)
:::

属性可任意组合（空格分隔，写在同一个 `{}` 内）；`notitle` 与 `title` 同用时 notitle 优先；浮层关闭时 `caption-color` 自然无效：

:::gallery{notitle caption-color="#7CFCB0"}
![组合 · 无标题且青色浮层 1](https://picsum.photos/seed/cb1-m/600/600)
![组合 · 无标题且青色浮层 2](https://picsum.photos/seed/cb2-m/600/800)
:::

:::gallery{title="链接 + 颜色组合" caption-color="#ffd54f"}
[![组合 · 点击跳 Unsplash](https://picsum.photos/seed/cb3-m/600/400)](https://unsplash.com)
![组合 · 金色浮层普通格](https://picsum.photos/seed/cb4-m/600/750)
:::

### 15.8 旧语法兜底（兼容旧文章）

<gallery src="https://picsum.photos/seed/a/600/400, https://picsum.photos/seed/b/600/750, https://picsum.photos/seed/c/600/600, https://picsum.photos/seed/d/600/800" links="https://unsplash.com, https://github.com, , "></gallery>

旧 `<gallery src="…">` 语法仍兼容渲染（无说明文字）。`links` 属性与 `src` 逐项位置对应：**有链接的项**点击开灯箱后于「i」面板显示跳转链接，**空项**维持灯箱预览。新文章请使用 15.1 的容器语法。

## 16. 长代码块自动折叠

超过 300px 高的代码块自动折叠，底部出现展开按钮：

```ts
// 长代码块折叠演示：mac-code-block 超高自动收起
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

async function fetchPost(id: string): Promise<Result<string>> {
    const res = await fetch(`/posts/${id}.html`);
    if (!res.ok) return { ok: false, error: new Error(String(res.status)) };
    const html = await res.text();
    return { ok: true, value: html };
}

function parseFrontmatter(md: string): { data: Record<string, unknown>; body: string } {
    const m = md.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) return { data: {}, body: md };
    const data: Record<string, unknown> = {};
    for (const line of m[1].split('\n')) {
        const idx = line.indexOf(':');
        if (idx < 2) continue;
        const key = line.slice(0, idx).trim();
        const raw = line.slice(idx + 1).trim();
        try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
    }
    return { data, body: md.slice(m[0].length) };
}

const DEMO_LINES = Array.from({ length: 20 }, (_, i) =>
    `console.log('line ${i + 1} of the long code demo');`);

DEMO_LINES.forEach((l) => eval(l));

async function main() {
    const r = await fetchPost('test001');
    if (r.ok) {
        const { body } = parseFrontmatter(r.value);
        console.log(body.slice(0, 80));
    } else {
        console.error(r.error);
    }
}

main();
```

## 17. 嵌套矩阵速查

下表汇总本文实际演示过的嵌套组合（✓ 均有对应段落）：

| 内层组件 \ 外层 | 顶层 | 折叠内 | 选项卡内 | 提示框内 | 原生 details 内 |
|---|:---:|:---:|:---:|:---:|:---:|
| 段落 / 列表 / 任务列表 | ✓ | ✓ §2 | ✓ §3 | ✓ §4 | ✓ §14 |
| 表格 | ✓ §12 | ✓ §2 | ✓ §3 | ✓ §4 | — |
| 代码块 / 长代码 | ✓ §16 | ✓ §2 | ✓ §3 | ✓ §4 | ✓ §14 |
| 提示框 | ✓ §1 | ✓ §2 | ✓ §3 | —（用嵌套引用 §4） | ✓ §14 |
| 折叠面板（含三层） | ✓ §2 | ✓ §2 | ✓ §3 | ✓ §4 | — |
| 选项卡（含嵌套选项卡） | ✓ §3 | — | ✓ §3 | — | — |
| Mermaid（12 类型） | ✓ §13 | ✓ §2 | ✓ §3 | ✓ §4 | — |
| 视频（iframe / 直链） | ✓ §5 | ✓ §2 | ✓ §3 | — | — |
| 链接卡 / 仓库卡 | ✓ §6-7 | ✓ §2 | ✓ §3 | ✓ §4 | — |
| 数学公式 | ✓ §8 | ✓ §2 | ✓ §3 | ✓ §4 | — |
| 原生 details | ✓ §14 | ✓ §2 | — | — | — |
| 行内元素（mark/kbd/spoiler 等） | ✓ §9 | ✓ §2 | ✓ §3 | ✓ §1 | ✓ §14 |
| 图集 gallery | ✓ §15 | ✓ §15 | ✓ §15 | ✓ §15 | — |

引擎要点：容器指令**栈式解析**（`::::tabs` > `:::tab` > `:::folding` 逐层闭合）；提示框先于容器变换，内部容器每行加 `>` 前缀；`::video` `::linkcard` `::github` 为叶子指令，容器内压缩为单行。

## 18. 代码块标题

`title="..."` 给代码块加标题栏（按文件名推断图标，支持所有语言）：

```ts title="src/config/site.ts"
type ColorMode = 'light' | 'dark' | 'auto';

export function setMode(mode: ColorMode) {
  const isDark = mode === 'dark'
    || (mode === 'auto'
      && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}
```

```bash title="终端命令"
pnpm install
pnpm dev
pnpm build
```

```json title="package.json"
{
  "name": "moara-blog",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
```

:::folding{title="折叠内的带标题代码块"}

```js title="utils/in-fold.js"
export const fold = (x) => x;
export const twice = (x) => fold(x) * 2;
```

:::

## 19. 音乐卡片（新语法 v2）

### 19.1 英文·逐行歌词（无翻译）

<music title="Blazing Heart (英文版)" artist="Chrissy Costanza、HOYO-MiX" src="music/Chrissy Costanza、HOYO-MiX - Blazing Heart (英文版).mp3" lrc="music/Chrissy Costanza、HOYO-MiX - Blazing Heart (英文版).lrc"></music>

### 19.2 英文·逐字歌词 + 中文翻译

<music title="唯有追赶风的方向 (Only By Chasing the Wind)" artist="知更鸟、HOYO-MiX、Chevy" src="music/知更鸟、HOYO-MiX、Chevy - 唯有追赶风的方向 (Only By Chasing the Wind).mp3" lrc="music/知更鸟、HOYO-MiX、Chevy - 唯有追赶风的方向 (Only By Chasing the Wind).lrc"></music>

### 19.3 日语·逐行歌词 + 翻译

<music title="てねてね" artist="悒うつぼ" src="music/悒うつぼ - てねてね.mp3" lrc="music/悒うつぼ - てねてね.lrc"></music>

### 19.4 中文·增强逐字歌词（无翻译）

<music title="天生鬼才" artist="萧敬腾、HOYO-MiX" src="music/萧敬腾、HOYO-MiX - 天生鬼才.mp3" lrc="music/萧敬腾、HOYO-MiX - 天生鬼才.lrc"></music>

### 19.5 法语·增强逐字歌词 + 中文翻译

<music title="轻涟 La vaguelette" artist="HOYO-MiX" src="music/HOYO-MiX - 轻涟 La vaguelette.mp3" lrc="music/HOYO-MiX - 轻涟 La vaguelette.lrc"></music>

### 19.6 旧语法兜底（music.json）

<music id="cry"></music>

# moara-md v1.3 四大组件

本文是 moara-md v1.3 版本的四大组件（文件树 / 代码树 / 内容边注 / 步骤流）的**全量视觉与交互测试**，覆盖规格中的每一种语法、每一种标记与所有降级路径。

## 20. 文件树（:::file-tree / ```file-tree）

文件树可将多层级项目结构、源码目录以及终端目录输出转化为紧凑的交互式树状视图，支持自动识别后缀图标、Diff 差异高亮以及可折叠分支。

### 20.1 嵌套列表语法（基础 · 规格原样）

使用 `:::file-tree` 块：

:::file-tree{title="Shirone 源码树"}
- src
  - components/
    - ++ Navigation.svelte
    - -- Button.astro
  - content
    - posts/
      - markdown-enhancements.md
  - layouts/
    - PostLayout.astro
  - plugins
    - markdown/
      - rehype-file-tree.mjs
  - styles
    - markdown/
      - trees.css
  - **content.config.ts**
- public/
  - favicon.svg
- package.json
:::

说明：
- 目录默认展开，显式带斜杠（如 `posts/`） → **默认折叠**，点击可展开
- `++ Navigation.svelte` → 绿色背景高亮
- `-- Button.astro` → 红色背景与删除线
- `**content.config.ts**` → 重点强调的高亮视觉层级

### 20.2 终端输出语法（Unicode 分支字符）

从命令行（如  `tree` ）直接复制时，可直接粘贴到 ```file-tree 块中：

```file-tree title="构建产物"
dist
├── _astro/
│   ├── index.css
│   └── page.js
└── favicon.ico
```

说明：
- title="string"：自定义文件树的标题

### 20.3 支持终端输出语法（ASCII 分支字符）

```file-tree title="Python 工程"
src
|-- main.py
|-- utils/
|   |-- __init__.py
|   `-- helpers.py
`-- README.md
```

### 20.4 图标多样性 + Diff 标记 + 深层嵌套

:::file-tree{title="图库工程 assets-check"}
- project
  - assets/
    - logo.png
    - banner.webp
    - photo.jpg
    - icon.svg
  - audio/
    - bgm.mp3
    - voice.flac
  - video/
    - intro.mp4
  - docs/
    - guide.md
    - api.pdf
    - data.xlsx
  - src/
    - components/
      - ++ Button.vue
      - -- OldButton.jsx
      - Modal.svelte
    - utils/
      - **App.tsx**
      - helpers.py
      - build.rs
    - index.html
    - main.go
  - package.json
  - .gitignore
  - LICENSE
:::

### 20.5 降级：容器内无列表

:::file-tree{title="这应该降级为普通文本"}
这里没有任何列表，容器应保持为普通 Markdown 展示，不会强行启发式解析。
:::

### 20.6 降级：终端输出非树文本

```file-tree title="这不是树"
随便一段文字
没有分支字符
无法解析为目录树
```

以上应显示为普通代码块。

## 21. 代码树（:::code-tree）

交互式代码树将左侧的多级文件层级导航与右侧（不同设备的位置不同：桌面左右、移动端上下）的代码即时预览组合呈现。

### 21.1 完整示例（entry 指定初始文件）

在 `:::code-tree` 块指令中组合多个代码块。每个代码块通过 title="path/to/file" 指定其相对路径：

:::code-tree{title="Shirone 组件演示" height="380px" entry="src/Button.svelte"}
```svelte title="src/Button.svelte"
<script lang="ts">
  let { label = "点击我" } = $props();
</script>

<button class="m3-btn">{label}</button>
```

```stylus title="src/styles/button.styl"
.m3-btn
  background: var(--primary)
  color: var(--on-primary)
  border-radius: var(--shape-corner-m)
```

```json title="package.json"
{
  "name": "button-demo",
  "version": "1.0.0"
}
```
:::

说明：
- title="string"：自定义代码树的标题
- height="string"：设置视图高度，默认 420px
- entry="filepath"：指定页面初次加载时默认激活展示的文件路径
- :active：在任意代码块后添加 :active 可将其设为默认激活的标签页

### 21.2 `:active` 标记（无 entry 时生效）

:::code-tree{title="配置文件集"}
```json title="tsconfig.json"
{
  "extends": "astro/tsconfigs/strict"
}
```

```js title="astro.config.mjs" :active
import { defineConfig } from 'astro/config';

export default defineConfig({});
```

```yaml title="vercel.json"
{
  "cleanUrls": true
}
```
:::

初始激活为 `astro.config.mjs`（`:active` 标记）。

### 21.3 默认高度 + 深层路径

:::code-tree{title="多级目录（默认 420px 高度）"}
```ts title="src/layouts/BaseLayout.astro"
<html lang="zh-CN"></html>
```

```css title="src/styles/global.css"
:root { --primary: #111; }
```

```md title="content/posts/hello.md"
# 你好，世界
```

```txt title="docs/release-notes/v1.3.txt"
- file-tree / code-tree / sidenote / steps
```
:::

### 21.4 超长代码

`height` 同时作用于桌面端与移动端，两端默认均 420px。

:::code-tree{title="超长代码（默认 420px）" entry="src/utils/format.ts"}
```ts title="src/utils/format.ts"
export function padLeft(input: string, len: number, ch = ' '): string {
    let out = input;
    while (out.length < len) out = ch + out;
    return out;
}

export function formatDate(d: Date, pattern = 'YYYY-MM-DD'): string {
    const y = d.getFullYear();
    const m = padLeft(String(d.getMonth() + 1), 2, '0');
    const day = padLeft(String(d.getDate()), 2, '0');
    return pattern
        .replace('YYYY', String(y))
        .replace('MM', m)
        .replace('DD', day);
}

export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return value.toFixed(decimals) + ' ' + units[i];
}

export function truncateMiddle(text: string, max = 40): string {
    if (text.length <= max) return text;
    const half = Math.floor((max - 1) / 2);
    return text.slice(0, half) + '…' + text.slice(text.length - half);
}

export function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

export function groupBy<T, K extends string>(arr: T[], key: (item: T) => K): Record<K, T[]> {
    const out = {} as Record<K, T[]>;
    for (const item of arr) {
        const k = key(item);
        (out[k] || (out[k] = [])).push(item);
    }
    return out;
}

export function debounce<F extends (...args: never[]) => void>(fn: F, wait = 200): (...args: Parameters<F>) => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return (...args: Parameters<F>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}

export function throttle<F extends (...args: never[]) => void>(fn: F, interval = 200): (...args: Parameters<F>) => void {
    let last = 0;
    return (...args: Parameters<F>) => {
        const now = Date.now();
        if (now - last >= interval) {
            last = now;
            fn(...args);
        }
    };
}
```

```txt title="README.txt"
format.ts 汇总：padLeft / formatDate / formatBytes / truncateMiddle / chunk / groupBy / debounce / throttle
```
:::

### 21.5 降级：代码块缺少 title

:::code-tree{title="这应该降级"}
```js
console.log('没有 title 的代码块');
```
:::

以上应整体保持为普通代码块输出（带原容器文字）。

## 22. 内容边注（[+label]）

内容边注将辅助背景信息紧邻特定句子放置，而不强行插入到正文阅读主线。它与脚注不同：脚注统一收录在文末注释区，而边注点击标记即出现悬浮气泡。

### 22.1 基本引用与富文本

在正文中添加 `[+label]` 引用标记，然后在其他位置定义对应的边注内容。渲染管线 [+pipeline] 会先摘离代码与公式，再逐级变换，最后统一还原 [+restore]。

[+pipeline]:
  预处理依次执行：代码摘离 → 遗留标签保护 → 数学摘离 → admonition → 容器指令栈式解析 → 脚注 → 边注 → 行内剧透 → 代码还原。

[+restore]:
  定义体支持**多段落**、加粗、链接、列表与行内代码：

[+restore]:
  - 就像这样，第二个同标签定义；
  - 与第三条一起，合并为**一组有序批注**。

### 22.2 多条关联定义与多次引用

同一个标签 [+multi] 可以被引用多次 [+multi]，多次引用共享同一份内容；重复定义 [+multi] 则合并为气泡内的一组批注列表。

[+multi]:
  第一条批注：说明该标签的职责。

[+multi]:
  第二条批注：补充边界情况，例如包含 [外部链接](https://docs.astro.build/zh-cn/concepts/islands/) 与 `行内代码`。

### 22.3 与脚注共存

边注 [+coexist] 与脚注[^note1]可以出现在同一句话里[^note2]，互不干扰 [+coexist]。

[+coexist]:
  边注气泡固定显示「+」，脚注标记自动编号「1、2、3」。

[^note1]: 这是脚注一。
[^note2]: 这是脚注二。

### 22.4 未定义引用

[+ref] 没有对应定义，原样保留为普通文本 [+ref] 。

## 23. 步骤流（:::steps）

步骤流适用于强调先后执行顺序的操作流程，通过低调优雅的数字导轨提供清晰导航。

### 23.1 方括号简写标题 + 代码块（规格原样）

:::steps[生产环境部署]
1. **克隆并准备工作区**

   克隆代码仓库并进入项目根目录：

   ```powershell
   git clone https://github.com/LyraVoid/Shirone.git
   Set-Location Shirone
   ```

2. **安装项目依赖**

   使用仓库指定的包管理器进行安装：

   ```powershell
   pnpm.cmd install
   ```

3. **执行项目校验**

   确认 Astro 诊断与 TypeScript 类型检查均通过：

   ```powershell
   npx.cmd astro check
   pnpm.cmd type-check
   ```

4. **构建生产站点**

   生成静态页面与搜索索引产物：

   ```powershell
   pnpm.cmd build
   ```
:::

说明：
- :::steps[标题] 或 title="标题" 可添加标题
- start=4 可修改起始展示的步骤编号
- 容器内必须且仅包含一个有序列表。格式不规范或混合的内容将保持为普通 Markdown 文本展示

### 23.2 花括号属性 + start 修改起始编号

:::steps{title="编号从 4 开始" start=4}
1. **第四步**

   这一步编号应显示为 4。

2. **第五步**

   内嵌列表：

   - 检查产物体积
   - 上传 CDN

3. **第六步**

   收尾，可含 [链接](https://example.com)。
:::

### 23.3 无标题

:::steps
1. **无标题步骤一**

   无标题时应只有数字导轨，没有标题栏。

2. **无标题步骤二**

   第二步。
:::

### 23.4 降级：混入顶层裸文本

:::steps[这应该降级]
这段顶层裸文本不属于任何列表项。

1. **不会被渲染为步骤**

   因为容器格式不规范。
:::

以上应保持为普通 Markdown（普通有序列表 + 段落），不出现数字导轨。

## 24. 混合嵌套

### 24.1 文件树嵌套在 admonition 内

> [!NOTE] 项目速览
> :::file-tree{title="引用块内的树"}
> - src
>   - main.py
> - tests/
>   - test_main.py
> :::

### 24.2 代码树嵌套在 folding 内

:::folding{title="展开查看代码树"}
:::code-tree{title="折叠面板里的代码树"}
```html title="index.html"
<!DOCTYPE html>
<html></html>
```

```css title="style.css"
body { margin: 0; }
```
:::
:::

### 24.3 步骤流内含边注混排

:::steps[综合演练]
1. **阅读源码结构**

   先看目录 [+structure]，再进入下一步。

2. **理解数据流**

   数据从 `:::code-tree` 左侧导航流向右侧预览面板 [+flow]。

3. **完成验证**

   所有组件视觉状态正确、点击正常、无卡顿。
:::

[+structure]:
  目录结构由嵌套列表推断，目录默认展开，带斜杠的目录默认折叠。

[+flow]:
  点击左侧文件 → 右侧面板切换 → 顶栏路径与复制按钮同步。