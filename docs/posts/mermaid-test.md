---
title: Mermaid 渲染测试
date: 2026-07-20 20:09
last_modified: 2026-07-20 20:09
desc: 测试 Mermaid 图表渲染
category:
  - Demo
tags:
  - Demo
author: Admin
pinned: false
locked: false
draft: false
---
本文仅用于测试 Mermaid 各类图表的渲染。

### 1. Flowchart 流程图

```mermaid

flowchart TD

    A[用户访问博客] --> B{是否首次访问}

    B -- 是 --> C[加载文章列表]

    B -- 否 --> D[读取本地缓存]

    C --> E[渲染 marked]

    D --> E

    E --> F{是否含代码块}

    F -- 是 --> G[加载 hljs 高亮]

    F -- 否 --> H[完成]

    G --> H

```

### 2. Sequence Diagram 时序图

```mermaid

sequenceDiagram

    participant U as 浏览器

    participant F as 前端 Astro

    participant R as raw-posts CDN

    participant W as Waline server

    U->>F: 打开 /details/article?id=103

    F->>R: fetch posts.json

    R-->>F: 文章元数据

    F->>R: fetch [103.md](http://103.md)

    R-->>F: markdown 内容

    F->>F: marked.parse + hljs

    F->>W: 加载评论组件

    W-->>U: 渲染评论框

```

### 3. Class Diagram 类图

```mermaid

classDiagram

    class Article {

        +String id

        +String title

        +String author

        +Date published

        +render() String

    }

    class TOC {

        +Array~TOCItem~ items

        +generate(html) void

        +highlightActive() void

    }

    class Comment {

        +String userId

        +String content

        +Date createdAt

    }

    Article --> TOC : has

    Article --> Comment : has many

```

### 4. State Diagram 状态图

```mermaid

stateDiagram-v2

    [*] --> 加载中

    加载中 --> 渲染中 : fetch 成功

    加载中 --> 错误 : 网络失败

    渲染中 --> 已完成 : marked + hljs 完成

    渲染中 --> 错误 : 解析异常

    已完成 --> [*]

    错误 --> 加载中 : 用户重试

```

### 5. Gantt Chart 甘特图

```mermaid

gantt

    title 博客重构计划

    dateFormat  YYYY-MM-DD

    section 前端

    设计文章页样式      :a1, 2026-07-01, 7d

    实现 TOC 组件       :a2, after a1, 4d

    接入 Waline 评论    :a3, after a2, 3d

    section 后端

    搭建内容仓库        :b1, 2026-07-01, 5d

    配置 GitHub Actions :b2, after b1, 3d

    生成 posts.json     :b3, after b2, 2d

    section 部署

    Vercel 上线         :c1, after a3, 1d

```

### 6. Pie Chart 饼图

```mermaid

pie showData

    title 博客文章类型分布

    "技术笔记" : 45

    "生活随笔" : 25

    "教程文档" : 20

    "项目复盘" : 10

```

### 7. ER Diagram 实体关系图

```mermaid

erDiagram

    POST ||--o{ COMMENT : has

    POST ||--o{ TAG : tagged

    POST {

        string id PK

        string title

        string author

        date published

    }

    COMMENT {

        string id PK

        string post_id FK

        string user_id

        text content

    }

    TAG {

        string id PK

        string name

    }

```

### 8. User Journey 用户旅程

```mermaid

journey

    title 读者访问文章的体验

    section 进入

      搜索引擎: 5: 读者

      点击链接: 5: 读者

      首屏加载: 3: 读者

    section 阅读

      渲染正文: 5: 读者

      滚动浏览: 5: 读者

      点击 TOC: 4: 读者

    section 互动

      留下评论: 3: 读者

      分享文章: 2: 读者

```

### 9. Git Graph 提交图

```mermaid

gitGraph

    commit id: "init"

    commit id: "add posts.json"

    branch feature/toc

    checkout feature/toc

    commit id: "toc sidebar"

    commit id: "mobile toc"

    checkout main

    merge feature/toc

    commit id: "release v1"

    branch fix/comments

    commit id: "waline fix"

    checkout main

    merge fix/comments

    commit id: "release v1.1"

```