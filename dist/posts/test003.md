---
title: 图表复杂度压力测试矩阵
date: 2026-10-09 08:20
last_modified: 2026-10-09 08:20
author: moara
category: ["Demo"]
tags: ["Demo", "Mermaid"]
desc: 各类 mermaid 图表在不同信息复杂程度（简单/中等/超复杂）下的显示效果压力测试矩阵：甘特长周期、宽流程图、多方时序、长名字标签等边界场景。
---
本文按「简单 → 中等 → 超复杂」三档构造各图型样本，验证自适应比例、缩放控件与布局在信息量增大时的表现。重点场景：**超长时间线甘特图**（约 190 天 / 20+ 任务 / 长任务名）。

## 1. 甘特图（用户重点场景：时间线拉长）

### 1.1 简单：6 任务 / 2 周

```mermaid
gantt
    title 简单发版流程
    dateFormat YYYY-MM-DD
    section 准备
    需求确认           :done, a1, 2026-10-01, 3d
    技术方案           :active, a2, after a1, 2d
    section 实施
    开发               :b1, after a2, 5d
    测试               :b2, after b1, 3d
    上线               :milestone, b3, after b2, 0d
```

### 1.2 中等：12 任务 / 2 个月

```mermaid
gantt
    title 季度迭代计划
    dateFormat YYYY-MM-DD
    section 需求
    需求收集         :done, r1, 2026-09-01, 7d
    需求评审         :done, r2, after r1, 3d
    section 设计
    概要设计         :done, d1, after r2, 5d
    详细设计         :active, d2, after d1, 7d
    section 开发
    前端开发         :dev1, after d2, 15d
    后端开发         :dev2, after d2, 18d
    联调             :dev3, after dev1, 5d
    section 测试
    功能测试         :t1, after dev3, 8d
    性能测试         :t2, after t1, 4d
    回归测试         :t3, after t2, 3d
    section 发布
    灰度发布         :g1, after t3, 3d
    全量发布         :milestone, g2, after g1, 0d
```

### 1.3 超复杂：20+ 任务 / 约 190 天 / 长任务名 / 多 section

```mermaid
gantt
    title 半年度产品发布计划（长周期复杂度压测）
    dateFormat YYYY-MM-DD
    axisFormat %y-%m-%d
    section 需求与调研
    市场调研与用户访谈收集整理分析                 :done, r01, 2026-01-05, 21d
    竞品对标分析与技术可行性预研评估               :done, r02, after r01, 14d
    产品需求文档撰写与多轮评审确认                 :done, r03, after r02, 10d
    交互原型与视觉设计交付                         :active, r04, after r03, 21d
    section 架构与设计
    基础架构搭建与开发环境建设                     :a01, 2026-02-16, 14d
    数据模型设计与数据库迁移方案                   :a02, after a01, 12d
    接口契约定义与Mock服务                         :a03, after a01, 10d
    section 核心开发
    核心功能模块开发                               :c01, after a02, 45d
    数据迁移与历史数据清洗改造                     :c02, after a02, 30d
    权限体系与安全加固改造                         :c03, after a03, 25d
    前端组件库升级与页面重构                       :c04, after a03, 40d
    性能优化与容量扩容专项                         :c05, after c01, 14d
    section 测试与质量
    单元测试与集成测试覆盖                         :q01, after c01, 21d
    系统测试与缺陷修复回归                         :q02, after q01, 18d
    安全渗透测试与整改                             :q03, after q02, 10d
    压力测试与容量验证                             :q04, after q03, 7d
    section 发布与运维
    灰度发布与放量观察                             :p01, after q04, 7d
    全量发布                                       :milestone, p02, after p01, 0d
    监控告警体系加固                               :m01, after p02, 30d
    稳定性巡检与故障演练                           :m02, after m01, 45d
```

## 2. 流程图

### 2.1 简单：3 节点

```mermaid
flowchart LR
    A[开始] --> B[处理] --> C[结束]
```

### 2.2 中等：12 节点 / 分支

```mermaid
flowchart TD
    A[用户请求] --> B{网关鉴权}
    B -->|通过| C[路由分发]
    B -->|拒绝| Z1[401 返回]
    C --> D[服务A]
    C --> E[服务B]
    D --> F[(缓存查询)]
    F -->|命中| G[返回缓存]
    F -->|未命中| H[数据库查询]
    H --> I[写回缓存]
    I --> G
    E --> J[消息队列]
    J --> K[异步任务处理]
    G --> Y[响应客户端]
    K --> Y
```

### 2.3 超复杂：25+ 节点 / 多分支 / 跨列

```mermaid
flowchart LR
    A[入口] --> B{分流}
    B -->|路径1| C1[采集] --> D1[清洗] --> E1[特征]
    B -->|路径2| C2[抓取] --> D2[解析] --> E2[索引]
    B -->|路径3| C3[订阅] --> D3[聚合] --> E3[存储]
    E1 --> F{模型判定}
    E2 --> F
    E3 --> G[归档]
    F -->|高置信| H1[自动发布]
    F -->|中置信| H2[人工复核] --> I[反馈回流]
    F -->|低置信| H3[丢弃]
    H1 --> J[质量评估]
    I --> J
    J -->|达标| K1[入库] --> L[报表]
    J -->|未达标| K2[重训] --> D1
    G --> L
    L --> M[告警监控] --> N{健康?}
    N -->|是| A
    N -->|否| O[降级恢复] --> A
    subgraph 支撑
        P[(元数据库)]
        Q[(时序库)]
        R[配置中心]
    end
    D1 -.-> P
    M -.-> Q
    C3 -.-> R
```

## 3. 时序图

### 3.1 简单：3 参与方

```mermaid
sequenceDiagram
    participant U as 用户
    participant S as 服务
    participant D as 数据库
    U->>S: 查询
    S->>D: SELECT
    D-->>S: 数据
    S-->>U: 结果
```

### 3.2 中等：6 参与方 / 循环

```mermaid
sequenceDiagram
    autonumber
    participant C as 客户端
    participant G as 网关
    participant A as 认证服务
    participant O as 订单服务
    participant P as 支付服务
    participant N as 通知服务
    C->>G: 下单请求
    G->>A: 鉴权
    A-->>G: 通过
    G->>O: 创建订单
    O->>P: 发起支付
    loop 支付重试
        P-->>O: 处理中
        O->>P: 轮询状态
    end
    P-->>O: 支付成功
    O->>N: 触发通知
    N-->>C: 推送消息
    O-->>C: 返回订单号
```

### 3.3 超复杂：10 参与方 / 嵌套

```mermaid
sequenceDiagram
    autonumber
    participant App as 移动端
    participant Web as Web端
    participant CDN as CDN
    participant GW as API网关
    participant Auth as 认证中心
    participant User as 用户服务
    participant Prod as 商品服务
    participant Inv as 库存服务
    participant Ord as 订单服务
    participant Pay as 支付中心
    App->>CDN: 静态资源
    Web->>CDN: 静态资源
    App->>GW: 登录
    Web->>GW: 登录
    GW->>Auth: 校验凭证
    Auth->>User: 拉取档案
    User-->>Auth: 档案
    Auth-->>GW: Token
    GW-->>App: Token
    GW-->>Web: Token
    App->>GW: 下单
    GW->>Ord: 创建订单
    Ord->>Prod: 校验商品
    Ord->>Inv: 锁定库存
    alt 有库存
        Inv-->>Ord: 锁定成功
        Ord->>Pay: 请求支付
        Pay-->>Ord: 支付回调
        Ord-->>GW: 下单成功
    else 无库存
        Inv-->>Ord: 库存不足
        Ord-->>GW: 下单失败
    end
    GW-->>App: 结果
```

## 4. 时间线

### 4.1 简单：5 事件

```mermaid
timeline
    title 项目里程碑
    2026 Q1 : 立项
    2026 Q2 : Alpha
    2026 Q3 : Beta
    2026 Q4 : GA
    2027 Q1 : V2
```

### 4.2 超复杂：18 事件 / 长文本

```mermaid
timeline
    title 团队年度演进大事记（长文本复杂度压测）
    2026年1月 : 团队组建完成首批五人到位 : 确立技术选型与仓库规范
    2026年2月 : 基础框架搭建完成 : CI/CD 流水线上线
    2026年3月 : 首个内部版本发布 : 完成首轮用户访谈
    2026年4月 : 数据层重构 : 引入读写分离
    2026年5月 : 压力测试通过 : 单机 QPS 破万
    2026年6月 : 灰度发布启动 : 监控告警体系就绪
    2026年7月 : 全量上线 : 首个付费客户签约
    2026年8月 : 多区域部署 : 平均延迟下降四成
    2026年9月 : 安全渗透整改完成 : 通过等保三级测评
    2026年10月 : 数据平台一期 : 自助报表上线
```

## 5. 类图

### 5.1 简单：3 类

```mermaid
classDiagram
    class Article {
        +String title
        +render()
    }
    class Tag
    Article "1" --> "*" Tag : 拥有
```

### 5.2 超复杂：12 类 / 多关系

```mermaid
classDiagram
    class User {
        +Long id
        +String name
        +String email
        +register()
        +login()
    }
    class Account {
        +Long id
        +BigDecimal balance
        +deposit(amount)
        +withdraw(amount)
    }
    class Order {
        +Long id
        +OrderStatus status
        +create()
        +cancel()
    }
    class OrderItem {
        +Long id
        +Integer quantity
        +BigDecimal price
    }
    class Product {
        +Long id
        +String sku
        +String name
    }
    class Inventory {
        +Long id
        +Integer available
        +lock(qty)
        +release(qty)
    }
    class Payment {
        +Long id
        +PayChannel channel
        +refund()
    }
    class Coupon {
        +String code
        +BigDecimal discount
        +verify()
    }
    class Logistics {
        +Long id
        +String trackingNo
        +ship()
    }
    class Review {
        +Long id
        +Integer stars
        +String comment
    }
    class Category {
        +Long id
        +String name
    }
    class Shopcart {
        +Long id
        +addItem(item)
    }
    User "1" --> "1" Account : 绑定
    User "1" --> "*" Order : 下单
    Order "1" --> "*" OrderItem : 包含
    OrderItem "*" --> "1" Product : 对应
    Product "*" --> "1" Category : 归类
    Product "1" --> "1" Inventory : 库存
    Order "1" --> "1" Payment : 支付
    Order "*" --> "*" Coupon : 使用
    Order "1" --> "0..1" Logistics : 履约
    Product "1" --> "*" Review : 评价
    User "1" --> "1" Shopcart : 持有
    Shopcart "*" --> "*" Product : 加购
```

## 6. ER 图

### 6.1 简单：4 实体

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    USER {
        string name
    }
```

### 6.2 超复杂：10 实体

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : includes
    PRODUCT ||--o{ ORDER_ITEM : covers
    CATEGORY ||--o{ PRODUCT : groups
    SUPPLIER ||--o{ PRODUCT : provides
    WAREHOUSE ||--o{ STOCK : stores
    PRODUCT ||--|| STOCK : has
    ORDER ||--o| INVOICE : billed
    INVOICE ||--o{ PAYMENT : settled
    SHIPMENT ||--|| ORDER : fulfills
    CUSTOMER ||--o{ ADDRESS : registers
    CUSTOMER {
        string id PK
        string name
        string email
    }
    ORDER {
        string id PK
        string customer_id FK
        datetime created
    }
    ORDER_ITEM {
        string order_id FK
        string product_id FK
        int qty
    }
    PRODUCT {
        string id PK
        string sku
        decimal price
    }
    STOCK {
        string product_id FK
        int available
    }
```

## 7. 用户旅程

### 7.1 简单：4 步

```mermaid
journey
    title 早晨
    section 日常
      起床: 5: 我
      洗漱: 3: 我
      通勤: 2: 我
      到岗: 4: 我
```

### 7.2 超复杂：12 步 / 多角色

```mermaid
journey
    title 内容创作全流程（多角色复杂度压测）
    section 选题
      选题会: 4: 作者, 编辑
      竞品调研: 3: 作者
      立项确认: 5: 编辑
    section 创作
      撰写初稿: 3: 作者
      补充数据: 4: 作者, 数据分析师
      配图设计: 4: 设计师
    section 审核
      编辑审稿: 3: 编辑
      事实核查: 5: 编辑, 专家
      法务过审: 2: 法务
    section 发布
      排版定稿: 4: 作者, 编辑
      定时发布: 5: 作者
      数据复盘: 4: 数据分析师, 编辑
```

## 8. 状态图

### 8.1 简单

```mermaid
stateDiagram-v2
    [*] --> 草稿
    草稿 --> 发布: 提交
    发布 --> [*]
```

### 8.2 超复杂：10+ 状态

```mermaid
stateDiagram-v2
    [*] --> 待支付
    待支付 --> 已支付: 支付成功
    待支付 --> 已取消: 超时
    已支付 --> 待发货
    待发货 --> 已发货: 出库
    已发货 --> 派送中: 揽收
    派送中 --> 已签收: 签收
    派送中 --> 异常: 滞留
    异常 --> 派送中: 恢复
    异常 --> 退回中: 无法投递
    已签收 --> 售后中: 申请售后
    售后中 --> 已退款
    售后中 --> 已换货
    退回中 --> 已退款
    已签收 --> 已完成: 确认
    已退款 --> [*]
    已完成 --> [*]
```

## 9. 饼图

### 9.1 简单：4 片

```mermaid
pie title 流量来源
    "搜索" : 45
    "直接" : 30
    "外链" : 15
    "其他" : 10
```

### 9.2 超复杂：10 片

```mermaid
pie title 内容类型分布（多切片复杂度压测）
    "技术长文" : 22
    "技术短篇" : 18
    "随笔杂谈" : 15
    "翻译转载" : 12
    "读书笔记" : 10
    "工具推荐" : 8
    "周报汇总" : 6
    "摄影相册" : 4
    "影评剧评" : 3
    "碎碎念" : 2
```

## 10. 思维导图

### 10.1 简单

```mermaid
mindmap
  root((博客))
    写作
    阅读
```

### 10.2 超复杂：多分支深叶

```mermaid
mindmap
  root((技术体系))
    前端
      框架
        React
        Vue
        Svelte
      工程化
        Vite
        Turbopack
      样式
        Tailwind
        CSS变量
    后端
      语言
        Node.js
        Go
        Rust
      存储
        MySQL
        PostgreSQL
        Redis
      消息
        Kafka
        RocketMQ
    基础设施
      容器
        Docker
        K8s
      观测
        日志
        指标
        追踪
    质量
      测试
        单元
        E2E
      安全
        审计
        扫描
```

## 11. Git 图

### 11.1 超复杂：多分支

```mermaid
gitGraph
    commit id: "init"
    branch develop
    commit
    commit
    branch feature/auth
    commit
    commit
    checkout main
    merge develop tag: "v0.9"
    checkout feature/auth
    commit
    checkout main
    merge feature/auth
    branch feature/pay
    commit
    commit
    commit
    checkout develop
    merge feature/pay
    checkout main
    merge develop tag: "v1.0"
    branch hotfix
    commit
    checkout main
    merge hotfix tag: "v1.0.1"
```

## 12. 象限图

### 12.1 超复杂：8 数据点 / 长标签

```mermaid
quadrantChart
    title 任务优先级矩阵（多点复杂度压测）
    x-axis 低投入 --> 高投入
    y-axis 低回报 --> 高回报
    quadrant-1 重点投入
    quadrant-2 快速回报
    quadrant-3 谨慎评估
    quadrant-4 逐步淘汰
    重构核心支付链路: [0.82, 0.88]
    优化首页首屏加载: [0.45, 0.85]
    新增暗色主题模式: [0.25, 0.62]
    建设自动化测试: [0.7, 0.75]
    迁移老旧PHP模块: [0.88, 0.4]
    社区内容运营: [0.35, 0.5]
    修复若干视觉细节: [0.18, 0.28]
    评估新数据库选型: [0.6, 0.55]
```
