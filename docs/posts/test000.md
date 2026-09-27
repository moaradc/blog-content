---
title: 测试
date: 2026-09-27 18:17
last_modified: 2026-09-27 18:17
category:
  - Demo
author: moara
pinned: true
locked: false
draft: false
---
# 国内主流云平台对象存储空间与价格调研报告

**阿里云、腾讯云、华为云、百度智能云、七牛云、火山引擎、金山云、天翼云、UCloud、京东云、移动云十一家平台标准存储容量规格与计费单价横向对比**

**报告日期：2026年9月27日**

## 摘要

国内十一家云平台（阿里云、腾讯云、华为云、百度智能云、七牛云、火山引擎、金山云、天翼云、UCloud、京东云、移动云）的中国大陆地域标准存储按量单价，在统一折算为元/GB/月后落在 0.09 至 0.128 元的窄区间内，最高与最低仅相差 42.2%，按量价格战已趋于饱和。真正的成本分水岭出现在两处：一是预付费资源包，折算单价从腾讯云活动页 0.0189 元/GB/月到华为云 Flexus 100TB 的 0.0528 元/GB/月不等，相对自家按量价让利 7.5% 至 84%；二是冗余等级，多 AZ 与同城冗余相对单 AZ 溢价 25% 至 51.5%。容量档位公示最完整的是百度智能云（100GB 至 10PB 共 14 档）与移动云（50GB 至 2000TB 共 12 档），阿里云公开档位至 300TB、400TB 以上转入人工报价；火山引擎与 UCloud 的资源包逐档价格未在公开页面公示，需登录控制台或调用接口查询。定价路线分化为"以周期换价格"（百度、七牛容量阶梯不给折扣）与"规模与周期双轨"（阿里、华为）两类。综合来看，10GB 以内首选七牛免费额度或阿里 40GB 年付 9 元体验包，1TB 至 10TB 区间华为 Flexus 与阿里年付包单位成本最低，百 TB 级以上应以公开价为谈判基准转入人工议价，并将请求与出网流量纳入总成本复算。

## 1. 调研范围、统计口径与数据来源

### 1.1 对象存储的计费模式与容量口径界定

本次调研覆盖国内十一家提供对象存储服务的云平台，包括阿里云 OSS、腾讯云 COS、华为云 OBS、百度智能云 BOS、七牛云 Kodo、火山引擎 TOS、金山云 KS3、天翼云 ZOS 与 OOS、UCloud US3、京东云 OSS 以及移动云 EOS，研究对象统一限定为中国大陆地域的标准存储类型。所有平台的报价体系均由两条平行轨道构成：一是按量付费（后付费），按实际占用容量与时长计费；二是预付费资源包（包年包月），以固定容量档位换取更低的折算单价。以阿里云为例，其标准存储本地冗余按量目录价为 0.12 元/GB/月，官网折扣价为 0.09 元/GB/月，且折扣价属于长期稳定有效价格而非限时活动<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>；同一存储类型在资源包轨道下的](https://help.aliyun.com/zh/oss/traffic-fees)</sup>；同一存储类型在资源包轨道下的) 1TB 包月价为 111 元、年价为 999 元<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。两条轨道同时存在，意味着任何单维度的比价都无法反映真实成本结构。](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。两条轨道同时存在，意味着任何单维度的比价都无法反映真实成本结构。)

容量与结算口径的不一致是横向比价最容易出错的地方。第一类差异来自容量单位：火山引擎 TOS 的公示单价为 0.099 元/GiB/月<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>，而绝大多数厂商采用元/GB/月，1GiB](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>，而绝大多数厂商采用元/GB/月，1GiB) 等于 1024MiB，两者在字面相同的情况下实际单价相差约 7%。第二类差异来自结算周期：腾讯云按日结算，日单价等于月单价除以 30；UCloud US3 与京东云 OSS 直接以日单价公示，分别为 0.004 元/GB/天与 0.00427 元/GB/天<sup>[[ucloud.cn](http://ucloud.cn)]([https://www.ucloud.cn/site/product/ufile.html?ytag=%E5%9F%9F%E5%90%8D_%E7%8C%AB%E5%92%AA%E6%9C%80%E6%96%B0%E7%A0%B4%E5%9F%9F%E5%90%8D_tag_seo),[jdcloud.com](https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service)</sup>；华为云](https://www.ucloud.cn/site/product/ufile.html?ytag=%E5%9F%9F%E5%90%8D_%E7%8C%AB%E5%92%AA%E6%9C%80%E6%96%B0%E7%A0%B4%E5%9F%9F%E5%90%8D_tag_seo),[jdcloud.com](https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service)</sup>；华为云) OBS 则以小时为单位整点结算；百度智能云特别说明其标价中的"月"指 30 天参考价，实际按自然月天数计算<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>。本报告在横向对比表中统一折算为元/GB/月口径，并在涉及原始标价处保留原单位，避免因换算造成精度损失。](https://cloud.baidu.com/product-price/bos.html)</sup>。本报告在横向对比表中统一折算为元/GB/月口径，并在涉及原始标价处保留原单位，避免因换算造成精度损失。)

### 1.2 数据来源分级与价格时效

本次调研按可得性将数据分为三级。第一级为厂商官网定价页与官方帮助文档的一手公示价，包括阿里云定价详情页与《购买 OSS 资源包》帮助文档、腾讯云定价中心与产品页、华为云 OBS 产品页与定价页、百度智能云计费页、七牛云计费详情页、火山引擎产品页与文档中心、金山云 KS3 产品页、UCloud 产品页与资源包文档、京东云产品页与资源包概述页、移动云帮助中心"按量计费价格"与"资源包价格"文档<sup>[阿里云]([https://help.aliyun.com/zh/oss/purchase-resource-plans),[tencent.com](https://buy.cloud.tencent.com/price/cos),[volcengine.com](https://www.volcengine.com/docs/6349/78455),[volcengine.com](https://www.volcengine.com/product/tos)</sup>。第二级为特定区域或特定活动的促销价，典型如华为云乌兰察布政务专区公告中的"标准存储单](https://help.aliyun.com/zh/oss/purchase-resource-plans),[tencent.com](https://buy.cloud.tencent.com/price/cos),[volcengine.com](https://www.volcengine.com/docs/6349/78455),[volcengine.com](https://www.volcengine.com/product/tos)</sup>。第二级为特定区域或特定活动的促销价，典型如华为云乌兰察布政务专区公告中的"标准存储单) AZ 存储资源包 40GB 包年 4 年 57.6 元、5 年 72 元"<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/notice/2024/20241211100920826.html)</sup>，此类价格不具备通用性，仅作参照。第三级为第三方整理与搜索摘要数据，包括标注为"参考京东云活动历史报价"的小规格资源包价格<sup>[GitHub](https://github.com/oadbn08/jdcloud-oss-pricing)</sup>，以及京东云标准存储约合](https://www.huaweicloud.com/notice/2024/20241211100920826.html)</sup>，此类价格不具备通用性，仅作参照。第三级为第三方整理与搜索摘要数据，包括标注为"参考京东云活动历史报价"的小规格资源包价格<sup>[GitHub](https://github.com/oadbn08/jdcloud-oss-pricing)</sup>，以及京东云标准存储约合) 0.128 元/GB/月的二手汇总值<sup>[GitHub]([https://github.com/jig1560/jdcloud-oss-pricing)</sup>，此类数据在报告中一律降级为定性参考，不作为厂商当前标准定价引用。](https://github.com/jig1560/jdcloud-oss-pricing)</sup>，此类数据在报告中一律降级为定性参考，不作为厂商当前标准定价引用。)

价格时效方面，各厂商文档的更新时间差异较大，构成本报告口径边界。阿里云《购买 OSS 资源包》帮助文档更新于 2026 年 9 月 20 日，《计费项概述》更新于 2026 年 8 月 12 日<sup>[阿里云]([https://help.aliyun.com/zh/oss/purchase-resource-plans),[阿里云](https://help.aliyun.com/zh/oss/billable-item-overview)</sup>；腾讯云《计费概述》更新于](https://help.aliyun.com/zh/oss/purchase-resource-plans),[阿里云](https://help.aliyun.com/zh/oss/billable-item-overview)</sup>；腾讯云《计费概述》更新于) 2026 年 7 月 30 日，《流量费用》更新于 2026 年 8 月 26 日<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/16871),[tencent.com](https://cloud.tencent.com/document/product/436/53863)</sup>；华为云存储费用说明页更新于](https://cloud.tencent.com/document/product/436/16871),[tencent.com](https://cloud.tencent.com/document/product/436/53863)</sup>；华为云存储费用说明页更新于) 2026 年 6 月 15 日<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://support.huaweicloud.com/price-obs/obs_42_0003.html)</sup>；百度智能云存储价格文档更新于](https://support.huaweicloud.com/price-obs/obs_42_0003.html)</sup>；百度智能云存储价格文档更新于) 2026 年 8 月 20 日<sup>[百度]([https://cloud.baidu.com/product/bos.html)</sup>；移动云"按量计费价格"页更新于](https://cloud.baidu.com/product/bos.html)</sup>；移动云"按量计费价格"页更新于) 2025 年 11 月 14 日，"资源包价格"页更新于 2024 年 10 月 29 日，是本次调研中时效最弱的两份一手文件<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/product/cos),[tencentcloud.com](https://www.tencentcloud.com/pricing/cos)</sup>。另有一类特殊情况需要交代：天翼云](https://cloud.tencent.com/product/cos),[tencentcloud.com](https://www.tencentcloud.com/pricing/cos)</sup>。另有一类特殊情况需要交代：天翼云) [ctyun.cn](http://ctyun.cn) 域名与京东云 [docs.jdcloud.com](http://docs.jdcloud.com) 域名下的部分页面在检索系统中被标记为不可信源，但其域名本身属于厂商官方站点，本报告按官方一手来源处理，并在涉及处保留该标记分歧的说明<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026735/10240507),[jdcloud.com](https://docs.jdcloud.com/cn/object-storage-service/price-overview)</sup>。](https://www.ctyun.cn/document/10026735/10240507),[jdcloud.com](https://docs.jdcloud.com/cn/object-storage-service/price-overview)</sup>。)

## 2. 头部云厂商标准存储价格格局

### 2.1 阿里云 OSS：目录价与官网折扣价双轨

阿里云 OSS 的价格结构呈现出清晰的"目录价—折扣价"双轨特征。中国大陆地域标准存储本地冗余（LRS）的目录价为 0.12 元/GB/月，官网折扣价为 0.09 元/GB/月；标准存储同城冗余（ZRS）目录价 0.15 元/GB/月，折扣价 0.12 元/GB/月<sup>[阿里云]([https://www.aliyun.com/price/detail/oss),[阿里云](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。折扣价即相当于在目录价基础上直接让渡](https://www.aliyun.com/price/detail/oss),[阿里云](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。折扣价即相当于在目录价基础上直接让渡) 25%，且这一折扣为长期有效而非限时活动，意味着阿里云在头部厂商中已把名义高价与实质成交价分离，目录价更多承担价格锚点作用。

资源包轨道上，阿里云的档位覆盖从 40GB 延伸至 300TB 以上，400TB 及以上需联系 95187 转 1 人工报价<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。标准本地冗余存储包的包月价随容量线性放大，100GB](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。标准本地冗余存储包的包月价随容量线性放大，100GB) 为 18 元、1TB 为 111 元、10TB 为 1110 元，而 50TB 档位跳升至 8960 元、100TB 为 17408 元、200TB 为 34816 元、300TB 为 49152 元<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。年价采用"买](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。年价采用"买) 9 送 3"规则，100GB 年价 162 元、1TB 年价 999 元、10TB 年价 9990 元，40GB 档位另有 9 元体验价<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。)

**表1：阿里云 OSS 标准存储按量付费单价（中国大陆地域，元/GB/月）**

| 存储冗余类型 | 目录价 | 官网折扣价 |

|---|---|---|

| 标准存储（本地冗余 LRS） | 0.12<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 0.09<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 标准存储（同城冗余 ZRS） | 0.15<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 0.12<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

**表2：阿里云 OSS 标准-本地冗余存储包规格与价格（元）**

| 容量规格 | 包月价 | 年价（买 9 送 3） |

|---|---|---|

| 40GB | — | 9（体验价）<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 100GB | 18<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 162<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 500GB | 54<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 486<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 1TB | 111<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 999<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 2TB | 222<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 1998<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 5TB | 555<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 4995<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 10TB | 1110<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 9990<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 50TB | 8960<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 80640<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 100TB | 17408<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 156672<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 200TB | 34816<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 313344<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 300TB | 49152<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 442368<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

同一份价格表内部隐藏着非线性折扣。1TB 包月 111 元折合约 0.108 元/GB/月，已低于按量目录价但高于按量折扣价；而 50TB 包月 8960 元折合约 0.175 元/GB/月，100TB 折合约 0.170 元/GB/月，看似反而更贵，实为大容量档按月报价与"买 9 送 3"年付优惠组合的结果——50TB 年价 80640 元折合约 0.134 元/GB/月，300TB 年价 442368 元折合约 0.123 元/GB/月<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。同城冗余存储包的定价另成体系，100GB](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。同城冗余存储包的定价另成体系，100GB) 包月 14 元、500GB 包月 68 元、1TB 包月 138 元、100TB 包月 13824 元，年价同样按买 9 送 3 折算<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。这种档位间折算单价的波动说明，阿里云资源包的真实优惠集中在中小容量档与年付周期上，大容量采购则更依赖人工议价通道。](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。这种档位间折算单价的波动说明，阿里云资源包的真实优惠集中在中小容量档与年付周期上，大容量采购则更依赖人工议价通道。)

### 2.2 腾讯云 COS：地域差价与低折活动包

腾讯云 COS 是中国大陆地域中以地域差价形成低价格带的典型样本。其标准存储按量计费单价按地域分两档执行：成都、重庆地域为 0.099 元/GB/月，北京、上海、广州、南京地域为 0.118 元/GB/月<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/53482),[tencent.com](https://cloud.tencent.com/product/cos?from=20064&from_column=20064)</sup>。0.099](https://cloud.tencent.com/document/product/436/53482),[tencent.com](https://cloud.tencent.com/product/cos?from=20064&from_column=20064)</sup>。0.099) 元这一档位与华为云 OBS、火山引擎 TOS 处于同一水平线，明显低于阿里云 0.12 元的目录价，也低于阿里云 0.15 元的同城冗余目录价。腾讯云产品页以"0.099 元起"作为对外标价，说明低价地域承担的是引流与比价对标功能<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/product/cos?from=20064&from_column=20064)</sup>。](https://cloud.tencent.com/product/cos?from=20064&from_column=20064)</sup>。)

预付费侧，腾讯云标准存储容量包的可选规格是国内最广的一批：10GB、20GB、50GB、100GB、200GB、500GB、1TB、2TB、5TB、10TB、20TB、50TB、100TB、200TB、500TB、1PB<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/36523)</sup>。已确认的具体标价包括](https://cloud.tencent.com/document/product/436/36523)</sup>。已确认的具体标价包括) 10GB 一个月的案例刊例价 0.85 元<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/53482)</sup>，以及活动特惠页公示的](https://cloud.tencent.com/document/product/436/53482)</sup>，以及活动特惠页公示的) 100GB 一年 22.66 元、日常价 141.6 元、500GB 与 1TB 与 5TB 一年均为 113.28 元，折扣力度标注为 1.6 折<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>。](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>。)

**表3：腾讯云 COS 中国大陆通用地域标准存储容量包价格（元）**

| 容量规格 | 有效时长 | 价格 | 折扣说明 |

|---|---|---|---|

| 10GB | 1 个月 | 0.85<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/53482)</sup>](https://cloud.tencent.com/document/product/436/53482)</sup>) | 文档案例刊例价 |

| 100GB | 1 年 | 22.66<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>) | 1.6 折，日常价 141.6 元 |

| 500GB | 1 年 | 113.28<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>) | 1.6 折 |

| 1TB | 1 年 | 113.28<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>) | 1.6 折 |

| 5TB | 1 年 | 113.28<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>) | 1.6 折 |

腾讯云价格体系最值得注意的地方在于折扣的极端性与口径的不一致。100GB 一年 22.66 元折合约 0.019 元/GB/月，与 0.118 元的按量价相差六倍以上，这类价格只能在活动页特定入口获取<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>。而](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>。而) 500GB、1TB、5TB 三档年价同为 113.28 元，说明该活动价并非按容量线性折算，而是同一优惠额度覆盖多档容量，实际生效范围需以购买页抵扣规则为准。腾讯云官方定价中心为动态渲染页面，20GB、50GB、200GB、2TB 等档位在公开页面中未能取到确切单价<sup>[[tencent.com](http://tencent.com)]([https://buy.cloud.tencent.com/price/cos)</sup>，这也意味着第三方汇总的腾讯云逐档价格普遍缺乏一手依据。](https://buy.cloud.tencent.com/price/cos)</sup>，这也意味着第三方汇总的腾讯云逐档价格普遍缺乏一手依据。)

### 2.3 华为云 OBS：按需单价长期稳定与 Flexus 资源包

华为云 OBS 标准存储（单 AZ）按需计费单价为 0.0990 元/GB/月，这一价格自 2018 年 11 月起执行，此前单价为 0.12 元/GB/月，降价 17.5% 后维持长期不变<sup>[凤凰网]([https://biz.ifeng.com/c/7hVSjmwtRhm)</sup>。华为云按需计费不按容量分档，统一单价以小时为单位整点结算，官网未公开按需模式下的阶梯容量单价表<sup>[huaweicloud.com](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>。第三方转载常写作"标准存储约](https://biz.ifeng.com/c/7hVSjmwtRhm)</sup>。华为云按需计费不按容量分档，统一单价以小时为单位整点结算，官网未公开按需模式下的阶梯容量单价表<sup>[huaweicloud.com](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>。第三方转载常写作"标准存储约) 0.10 元/GB/月"，属于近似表述，应以官网 0.0990 元/GB/月为准<sup>[腾讯网]([https://mp.weixin.qq.com/s?__biz=MzYzMzUzNDU4Mw==&idx=1&mid=2247485004&sn=fa3cfdda2f546fca33cb682fea82b320)</sup>。](https://mp.weixin.qq.com/s?__biz=MzYzMzUzNDU4Mw==&idx=1&mid=2247485004&sn=fa3cfdda2f546fca33cb682fea82b320)</sup>。)

公开报价主要体现在 Flexus OBS 标准单 AZ 存储包上。该产品提供 1TB、5TB、20TB、100TB 四档包年规格，价格分别为 706 元、3406 元、13382 元、64475 元，折算单价依次约为 0.0574、0.0554、0.0548、0.0528 元/GB/月，官方称综合降本约 20%<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>。](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>。)

**表4：华为云 Flexus OBS 标准存储单 AZ 资源包（包年）**

| 容量规格 | 包年价格 | 折算单价（元/GB/月） |

|---|---|---|

| 1TB | 706.00<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) | 约 0.0574<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) |

| 5TB | 3406.00<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) | 约 0.0554<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) |

| 20TB | 13382.00<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) | 约 0.0548<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) |

| 100TB | 64475.00<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) | 约 0.0528<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) |

Flexus OBS 资源包的约束条件同样明确：最低购买时长为 1 年，每位用户在所选区域内每种规格限购 1 个，可抵扣标准存储单 AZ 容量费用<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>。限购规则决定了它是拉新与小额长期锁定工具，无法作为企业级大容量的常规采购通道。至于普通的标准存储单](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>。限购规则决定了它是拉新与小额长期锁定工具，无法作为企业级大容量的常规采购通道。至于普通的标准存储单) AZ 资源包，官网资源包说明页指出各规格价格需参见"产品价格详情"，未在页面中直接列出阶梯单价表<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://support.huaweicloud.com/price-obs/obs_42_0003.html)</sup>。检索中唯一可取的普通包价格是乌兰察布政务专区公告中的"标准存储单](https://support.huaweicloud.com/price-obs/obs_42_0003.html)</sup>。检索中唯一可取的普通包价格是乌兰察布政务专区公告中的"标准存储单) AZ 存储资源包 40GB 包年 4 年 57.6 元、5 年 72 元"<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/notice/2024/20241211100920826.html)</sup>，该价格为特定专区促销价，不具备通用参考意义。标准存储多](https://www.huaweicloud.com/notice/2024/20241211100920826.html)</sup>，该价格为特定专区促销价，不具备通用参考意义。标准存储多) AZ 的按需单价高于单 AZ，但官网未在公开页面明确展示具体数值，需通过价格计算器获取。

## 3. 第二梯队与运营商云的价格分布

### 3.1 百度智能云 BOS 与七牛云 Kodo

百度智能云 BOS 是本轮调研中资源包价格公示最完整的厂商。其标准存储按量单价为 0.119 元/GB/月，标准存储多 AZ 为 0.15 元/GB/月<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>。标准存储容量包在中国大陆地域以](https://cloud.baidu.com/product-price/bos.html)</sup>。标准存储容量包在中国大陆地域以) 1 个月有效期为基准，公示 14 档规格，从 100GB 一直到 10PB，折算单价稳定落在 0.1074 至 0.1076 元/GB/月区间<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>。](https://cloud.baidu.com/product-price/bos.html)</sup>。)

**表5：百度智能云 BOS 标准存储容量包（1 个月期，中国大陆地域）**

| 容量规格 | 1 个月总价 | 折算单价（元/GB/月） |

|---|---|---|

| 100GB | 10.8<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1076<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 500GB | 54<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1076<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 1TB | 110<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 2TB | 220<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 10TB | 1100<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 30TB | 3300<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 50TB | 5500<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 100TB | 11000<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 200TB | 22000<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 500TB | 55000<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 1PB | 113246<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 3PB | 339739<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 5PB | 566231<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 10PB | 1132462<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.1074<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

百度 BOS 的价格策略因此显得相当直白：1 个月资源包相对按量价仅让利约 9.7%，真正的优惠藏在长周期里——6 个月包 8.3 折，折算约 0.0895 元/GB/月；1 年、2 年、3 年包统一 7.5 折，折算约 0.0807 元/GB/月<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>。以](https://cloud.baidu.com/product-price/bos.html)</sup>。以) 1TB 为例，按月包与三年期包的单位成本差距约 25%，这意味着百度的定价模型鼓励的是承诺周期而非采购规模，容量阶梯几乎不产生折扣。其存储价格文档更新于 2026 年 8 月 20 日，价格页为一手官网公示<sup>[百度]([https://cloud.baidu.com/product/bos.html)</sup>。](https://cloud.baidu.com/product/bos.html)</sup>。)

七牛云 Kodo 的问题恰恰相反，不在于档位缺失而在于标价版本并存。官网产品页显示 0.098 元/GB/月，旧版价格详情页显示 0 至 10GB 免费、10GB 以上 0.099 元/GB/月<sup>[[qiniu.com](http://qiniu.com)]([https://www.qiniu.com/products/kodo),[qiniu.com](https://www.qiniu.com/en/prices)</sup>；当前官方计费详情页对华东浙江、华南广东、华北河北等中国大陆区域统一标注](https://www.qiniu.com/products/kodo),[qiniu.com](https://www.qiniu.com/en/prices)</sup>；当前官方计费详情页对华东浙江、华南广东、华北河北等中国大陆区域统一标注) 0.115 元/GB/月，实名认证用户每月享有 10GB 标准存储免费空间，开发者文档中的计费案例仍沿用 0.099 元旧单价。四个版本同时存在，实际结算应以计费详情页的 0.115 元/GB/月为准，其余为历史遗留标价。资源包侧，中国大陆通用标准存储资源包按抵扣系数 1:1:1:1 适用上述四个区域，单价随时长递减：1 个月 0.115 元/GB、3 个月 0.1093 元/GB、6 个月 0.1035 元/GB、12 个月及以上 0.0886 元/GB。从 1 个月到 12 个月，单位成本下降约 23%，与百度 7.5 折长周期包的让利幅度接近，说明中立云与头部云在"以周期换价格"这一条上已形成共识。

### 3.2 火山引擎 TOS、金山云 KS3 与天翼云

火山引擎 TOS 把价格带下沿压到了与腾讯云低价地域同一水平：中国大陆地域标准存储单 AZ 按量付费 0.099 元/GiB/月，多 AZ 为 0.15 元/GiB/月<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>。计费概述页与产品页均确认这一按量单价，资源包概述页则明确注明"不同地域、不同规格的资源包价格不同，请以资源包购买页为准"<sup>[volcengine.com](https://www.volcengine.com/product/TOS),[volcengine.com](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>。产品页对外标注标准存储资源包参考价](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>。计费概述页与产品页均确认这一按量单价，资源包概述页则明确注明"不同地域、不同规格的资源包价格不同，请以资源包购买页为准"<sup>[volcengine.com](https://www.volcengine.com/product/TOS),[volcengine.com](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>。产品页对外标注标准存储资源包参考价) 0.08 元/GiB/月起<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/6349/153060)</sup>。资源包规格档位可从抖音开放平台文档中识别出](https://www.volcengine.com/docs/6349/153060)</sup>。资源包规格档位可从抖音开放平台文档中识别出) 16 档：10GiB、20GiB、50GiB、100GiB、200GiB、500GiB、1TiB、2TiB、5TiB、10TiB、20TiB、50TiB、100TiB、200TiB、500TiB、1PiB，有效期可选 1 个月、3 个月、6 个月、1 年、2 年、3 年、4 年、5 年<sup>[[open-douyin.com](http://open-douyin.com)]([https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/guide/component/tos/tos)</sup>。需要强调该来源并非火山引擎官网一手文件，且各规格对应的具体金额在官网公开文档与产品页中均未公示，资源包购买页需登录控制台才能查看<sup>[volcengine.com](https://docs.volcengine.com/docs/6349/178341?lang=zh)</sup>。](https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/guide/component/tos/tos)</sup>。需要强调该来源并非火山引擎官网一手文件，且各规格对应的具体金额在官网公开文档与产品页中均未公示，资源包购买页需登录控制台才能查看<sup>[volcengine.com](https://docs.volcengine.com/docs/6349/178341?lang=zh)</sup>。)

金山云 KS3 的标准存储按量单价为 0.108 元/GB/月，产品页直接以"每月/每 G 单价 0.108 元"标注<sup>[[ksyun.com](http://ksyun.com)]([https://www.ksyun.com/nv/product/KS3.html)</sup>。其资源包是中小厂商中少见的逐档明码公示样本：500GB](https://www.ksyun.com/nv/product/KS3.html)</sup>。其资源包是中小厂商中少见的逐档明码公示样本：500GB) 一个月 54 元、2TB 六个月 1105 元、10TB 一年 9954 元<sup>[[ksyun.com](http://ksyun.com)]([https://www.ksyun.com/nv/product/KS3.html)</sup>。三档折算单价分别约为](https://www.ksyun.com/nv/product/KS3.html)</sup>。三档折算单价分别约为) 0.108、0.0726、0.0813 元/GB/月，六个月期的 2TB 档让利幅度最大，相对按量价下降约 33%。

天翼云的情况需要区分两条产品线：ZOS 为新版对象存储，OOS（经典版）为旧版。ZOS 标准存储按量单价为单 AZ 0.09 元/GB/月、多 AZ 0.12 元/GB/月<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/qzdh/143444_15)</sup>，0.09](https://www.ctyun.cn/qzdh/143444_15)</sup>，0.09) 元是本次调研十一家厂商中最低的单 AZ 标准存储按量价。OOS 经典版 I 型在中国大陆通用地域提供 14 档按月资源包，从 40GiB 到 2PiB 逐档定价<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>。](https://www.ctyun.cn/document/10026693/10026740)</sup>。)

**表6：天翼云对象存储（经典版 I 型 OOS）标准存储资源包（中国大陆通用）**

| 容量规格 | 包月价格 |

|---|---|

| 40GiB | 4 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 100GiB | 10 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 500GiB | 50 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 1TiB | 102 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 2TiB | 204 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 5TiB | 510 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 10TiB | 1020 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 20TiB | 2040 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 50TiB | 5100 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 100TiB | 10200 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 200TiB | 20400 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 500TiB | 51000 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 1PiB | 104448 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 2PiB | 208896 元<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

天翼云 OOS 资源包的折算单价呈现明显的两段式：40GiB 档 0.10 元/GiB/月，100GiB 至 500TiB 各档稳定在 0.10 至 0.102 元/GiB/月，1PiB 与 2PiB 折合 0.102 元/GiB/月<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>。换言之，其包月价几乎没有容量折扣，本质是"预付费等于按量价"的锁定方案，价值在于预算确定性与抵扣便利，而非降本。ZOS](https://www.ctyun.cn/document/10026693/10026740)</sup>。换言之，其包月价几乎没有容量折扣，本质是"预付费等于按量价"的锁定方案，价值在于预算确定性与抵扣便利，而非降本。ZOS) 的资源包逐档规格价格在已抓取的按需计费页面中未列出，这使天翼云 0.09 元的低价按量价与其包月定价体系之间存在明显的口径断层<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026735/10240507)</sup>。](https://www.ctyun.cn/document/10026735/10240507)</sup>。)

### 3.3 UCloud US3、京东云 OSS 与移动云 EOS

UCloud US3（原名 UFile）中国大陆地域标准存储按量后付费单价为 0.004 元/GB/天，折合约 0.12 元/GB/月<sup>[[ucloud.cn](http://ucloud.cn)]([https://www.ucloud.cn/site/product/ufile.html?ytag=%E5%9F%9F%E5%90%8D_%E7%8C%AB%E5%92%AA%E6%9C%80%E6%96%B0%E7%A0%B4%E5%9F%9F%E5%90%8D_tag_seo)</sup>。标准存储包共](https://www.ucloud.cn/site/product/ufile.html?ytag=%E5%9F%9F%E5%90%8D_%E7%8C%AB%E5%92%AA%E6%9C%80%E6%96%B0%E7%A0%B4%E5%9F%9F%E5%90%8D_tag_seo)</sup>。标准存储包共) 8 档规格：100GB、300GB、500GB、1TB、10TB、50TB、300TB、500TB<sup>[[ucloud.cn](http://ucloud.cn)]([https://docs.ucloud.cn/ufile/bill/resource_plan?id=%E4%BD%BF%E7%94%A8%E6%98%8E%E7%BB%86)</sup>。各档预付费价格在官网静态文档与产品页中均未公示，文档仅说明"购买折扣视当前活动折扣为准"，资源包价格需登录控制台购买页或调用](https://docs.ucloud.cn/ufile/bill/resource_plan?id=%E4%BD%BF%E7%94%A8%E6%98%8E%E7%BB%86)</sup>。各档预付费价格在官网静态文档与产品页中均未公示，文档仅说明"购买折扣视当前活动折扣为准"，资源包价格需登录控制台购买页或调用) GetUFilePkgPrice 接口动态获取<sup>[[ucloud.cn](http://ucloud.cn)]([https://docs.ucloud.cn/ufile/bill/resource_plan),[ucloud.cn](https://docs.ucloud.cn/api/ufile-api/renew_ufile_pkg)</sup>。此外其外网流出流量包规格包括](https://docs.ucloud.cn/ufile/bill/resource_plan),[ucloud.cn](https://docs.ucloud.cn/api/ufile-api/renew_ufile_pkg)</sup>。此外其外网流出流量包规格包括) 100GB、300GB、500GB、10TB、50TB、300TB、500TB 等档位，与存储包分列<sup>[[ucloud.cn](http://ucloud.cn)]([https://docs.ucloud.cn/ufile/bill/resource_plan)</sup>。](https://docs.ucloud.cn/ufile/bill/resource_plan)</sup>。)

京东云 OSS 标准存储按量单价为 0.00427 元/GB/天，折合约 0.128 元/GB/月，该数值同时见于官网产品页与英文价格总览页<sup>[[jdcloud.com](http://jdcloud.com)]([https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=ReadMore&utm_medium=bottom&utm_source=PMM_itpub&utm_term=NA),[jdcloud.com](https://docs.jdcloud.com/en/object-storage-service/price-overview)</sup>；其多](https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=ReadMore&utm_medium=bottom&utm_source=PMM_itpub&utm_term=NA),[jdcloud.com](https://docs.jdcloud.com/en/object-storage-service/price-overview)</sup>；其多) AZ 单价为 0.003945206 元/GB/天，折合月价低于单 AZ，属于本报告中的口径异常项，后文第 5 章单独讨论。资源包方面，官网"资源包概述"页公示了大规格档位定价。

**表7：京东云 OSS 标准存储容量包（官网公示价，元）**

| 容量规格 | 1 个月 | 6 个月 |

|---|---|---|

| 2TB | 226.23<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) | 678.61<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) |

| 5TB | 563.22<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) | 1689.45<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) |

| 10TB | 1110.44<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) | 3330.93<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) |

| 20TB | 2200.70<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) | 6601.31<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) |

| 50TB | 5427.04<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) | — |

| 100TB | 10589.31<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) | — |

京东云官网表格中 50TB 与 100TB 两档在检索摘要中仅显示单列金额，未明确对应购买时长<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>；1TB](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>；1TB) 档位在公开来源中缺失。小规格侧仅有第三方整理参考京东云活动历史报价的数据，20GB 一个月约 0.6 元、50GB 六个月约 8.1 元、100GB 六个月约 15.9 元、100GB 一年约 29.4 元、500GB 一年约 99 元，该组数据明确标注非官网直接公示价<sup>[GitHub]([https://github.com/oadbn08/jdcloud-oss-pricing)</sup>。官网资源包概述页与价格总览页的动态表格经多次抓取未获完整内容，购买入口为动态渲染页面<sup>[jdcloud.com](https://m-console-buy.jdcloud.com/init?product=Oss)</sup>，因此本表的大规格价格与第三方小规格价格不可直接拼合为同一条价格曲线。](https://github.com/oadbn08/jdcloud-oss-pricing)</sup>。官网资源包概述页与价格总览页的动态表格经多次抓取未获完整内容，购买入口为动态渲染页面<sup>[jdcloud.com](https://m-console-buy.jdcloud.com/init?product=Oss)</sup>，因此本表的大规格价格与第三方小规格价格不可直接拼合为同一条价格曲线。)

移动云 EOS 是运营商云中公示最完整的一家。官网产品页标注标准存储单价 0.12 元/GB/月<sup>[[10086.cn](http://10086.cn)]([https://ecloud.10086.cn/portal/product/eos)</sup>，帮助中心"按量计费价格"文档确认中国大陆地域标准存储单](https://ecloud.10086.cn/portal/product/eos)</sup>，帮助中心"按量计费价格"文档确认中国大陆地域标准存储单) AZ 为 0.12 元/GB/月、标准存储同城冗余为 0.15 元/GB/月，该文档更新于 2025 年 11 月 14 日<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/product/cos)</sup>。"资源包价格"文档给出](https://cloud.tencent.com/product/cos)</sup>。"资源包价格"文档给出) 12 档标准存储容量包，最小 50GB、最大 2000TB，并规定包年价格等于包月价格乘以 12<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>。](https://www.tencentcloud.com/pricing/cos)</sup>。)

**表8：移动云 EOS 标准存储容量包资源包规格与价格**

| 容量规格 | 包月价格 |

|---|---|

| 50GB | 5 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 100GB | 11 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 500GB | 54 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 1TB | 111 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 5TB | 553 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 10TB | 1106 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 50TB | 5530 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 100TB | 11059 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 500TB | 55296 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 1000TB | 110590 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 1500TB | 165885 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

| 2000TB | 221180 元<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

移动云的定价结构与天翼云 OOS 类似，折算单价长期锁定在 0.108 至 0.111 元/GB/月，容量折扣极小，50TB 以上档位折合 0.108 至 0.110 元/GB/月，与 0.12 元的按量价相比让利不足 10%，而包年规则并未提供任何跨年折扣<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>。检索过程中曾出现](https://www.tencentcloud.com/pricing/cos)</sup>。检索过程中曾出现) 40GB 一个月 1.5 元、100GB 一个月 11.4 元、1TB 一个月 116.8 元的一组数据，与官网一手页面的 100GB 11 元、1TB 111 元不一致，按官网一手来源为准<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>。其他规格官网指引通过价格计算器查询。](https://www.tencentcloud.com/pricing/cos)</sup>。其他规格官网指引通过价格计算器查询。)

## 4. 存储空间规格档位与价格横向对比

### 4.1 全厂商标准存储按量单价对比

把十一家平台的标准存储按量单价统一折算为元/GB/月后，价格离散区间落在 0.09 至 0.128 元之间，最高价与最低价相差 42.2%（0.128÷0.09）。这一价差远小于外界对云存储"价格战激烈"的直觉预期，说明按量单价在 2018 年华为云从 0.12 元下调至 0.0990 元之后<sup>[凤凰网]([https://biz.ifeng.com/c/7hVSjmwtRhm)</sup>，国内标准存储的按量报价已进入相对固化的窄幅区间。](https://biz.ifeng.com/c/7hVSjmwtRhm)</sup>，国内标准存储的按量报价已进入相对固化的窄幅区间。)

**表9：国内十一家平台对象存储标准存储按量单价（中国大陆地域，折算元/GB/月）**

| 平台 | 单 AZ/本地冗余 | 多 AZ/同城冗余 | 原始标价口径 |

|---|---|---|---|

| 天翼云 ZOS | 0.09<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/qzdh/143444_15)</sup>](https://www.ctyun.cn/qzdh/143444_15)</sup>) | 0.12<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/qzdh/143444_15)</sup>](https://www.ctyun.cn/qzdh/143444_15)</sup>) | 元/GB/月 |

| 腾讯云 COS（成都、重庆） | 0.099<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/product/cos?from=20064&from_column=20064)</sup>](https://cloud.tencent.com/product/cos?from=20064&from_column=20064)</sup>) | — | 元/GB/月，按日结算 |

| 华为云 OBS | 0.0990<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) | — | 元/GB/月，按小时结算 |

| 火山引擎 TOS | 0.099<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>) | 0.15<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>) | 元/GiB/月 |

| 七牛云 Kodo | 0.115 | — | 元/GB/月，10GB 内免费 |

| 腾讯云 COS（北京、上海、广州、南京） | 0.118<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/53482)</sup>](https://cloud.tencent.com/document/product/436/53482)</sup>) | — | 元/GB/月，按日结算 |

| 百度智能云 BOS | 0.119<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.15<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 元/GB/月，月按 30 天参考 |

| UCloud US3 | 0.12（由 0.004 元/GB/天折算）<sup>[[ucloud.cn](http://ucloud.cn)]([https://www.ucloud.cn/site/product/ufile.html?ytag=%E5%9F%9F%E5%90%8D_%E7%8C%AB%E5%92%AA%E6%9C%80%E6%96%B0%E7%A0%B4%E5%9F%9F%E5%90%8D_tag_seo)</sup>](https://www.ucloud.cn/site/product/ufile.html?ytag=%E5%9F%9F%E5%90%8D_%E7%8C%AB%E5%92%AA%E6%9C%80%E6%96%B0%E7%A0%B4%E5%9F%9F%E5%90%8D_tag_seo)</sup>) | — | 元/GB/天 |

| 移动云 EOS | 0.12<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/product/cos)</sup>](https://cloud.tencent.com/product/cos)</sup>) | 0.15<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/product/cos)</sup>](https://cloud.tencent.com/product/cos)</sup>) | 元/GB/月 |

| 阿里云 OSS | 0.12 目录价、0.09 折扣价<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 0.15 目录价、0.12 折扣价<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 元/GB/月 |

| 金山云 KS3 | 0.108<sup>[[ksyun.com](http://ksyun.com)]([https://www.ksyun.com/nv/product/KS3.html)</sup>](https://www.ksyun.com/nv/product/KS3.html)</sup>) | — | 元/GB/月 |

| 京东云 OSS | 0.128（由 0.00427 元/GB/天折算）<sup>[[jdcloud.com](http://jdcloud.com)]([https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service)</sup>](https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service)</sup>) | 0.118（由 0.003945206 元/GB/天折算） | 元/GB/天 |

价格带的分布结构本身具有信息量。最低的一批集中在 0.09 至 0.099 元，由天翼云 ZOS、腾讯云低价地域、华为云 OBS 与火山引擎 TOS 占据，前三者分别代表运营商云、头部综合云的区域让利策略与新势力云的对标定价，四家共同把单 AZ 标准存储的心理价位锚定在 0.1 元以内。中间 0.108 至 0.12 元一档由金山云、UCloud、移动云、阿里云目录价与腾讯云主力地域构成，其中阿里云 0.12 元目录价同时存在 0.09 元长期折扣价，实际成交水平已回落到价格带下沿<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。最高一档是京东云与百度智能云，京东云](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。最高一档是京东云与百度智能云，京东云) 0.128 元的折算价来自其 0.00427 元/GB/天的日单价<sup>[[jdcloud.com](http://jdcloud.com)]([https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service)</sup>，百度](https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service)</sup>，百度) 0.119 元则接近头部云目录价水平<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>。UCloud](https://cloud.baidu.com/product-price/bos.html)</sup>。UCloud) 与京东云都采用日单价公示，这类标价在字面上容易被误读为低价，但按 30 天折算后反而位于价格带上沿，是本次对比中最需要口径换算的两例。

### 4.2 资源包容量档位覆盖与折算单价对比

资源包维度的差异比按量单价大得多，差异首先体现在档位覆盖范围与公示方式上。

**表10：各平台标准存储资源包档位覆盖与公示形态**

| 平台 | 公示档位范围 | 公示形态 |

|---|---|---|

| 阿里云 OSS | 40GB 至 300TB，400TB 以上需人工报价<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 逐档包月价与年价完整公示<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 腾讯云 COS | 10GB 至 1PB，共 16 档<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/36523)</sup>](https://cloud.tencent.com/document/product/436/36523)</sup>) | 档位清单公示，逐档价格在动态页未完整呈现<sup>[[tencent.com](http://tencent.com)]([https://buy.cloud.tencent.com/price/cos)</sup>](https://buy.cloud.tencent.com/price/cos)</sup>) |

| 华为云 OBS | Flexus 1TB 至 100TB 四档<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>) | 普通标准包价格需参见产品价格详情<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://support.huaweicloud.com/price-obs/obs_42_0003.html)</sup>](https://support.huaweicloud.com/price-obs/obs_42_0003.html)</sup>) |

| 百度智能云 BOS | 100GB 至 10PB，共 14 档<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 逐档总价与折算单价公示<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) |

| 七牛云 Kodo | 未按容量分档，按时长统一定价 | 1 至 12 个月及以上单价递减 |

| 火山引擎 TOS | 10GiB 至 1PiB，共 16 档<sup>[[open-douyin.com](http://open-douyin.com)]([https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/guide/component/tos/tos)</sup>](https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/guide/component/tos/tos)</sup>) | 档位可见，逐档价格以购买页为准<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>) |

| 金山云 KS3 | 500GB、2TB、10TB 三档样本<sup>[[ksyun.com](http://ksyun.com)]([https://www.ksyun.com/nv/product/KS3.html)</sup>](https://www.ksyun.com/nv/product/KS3.html)</sup>) | 逐档价格公示<sup>[[ksyun.com](http://ksyun.com)]([https://www.ksyun.com/nv/product/KS3.html)</sup>](https://www.ksyun.com/nv/product/KS3.html)</sup>) |

| 天翼云 OOS 经典版 | 40GiB 至 2PiB，共 14 档<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) | 逐档包月价公示<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| UCloud US3 | 100GB 至 500TB，共 8 档<sup>[[ucloud.cn](http://ucloud.cn)]([https://docs.ucloud.cn/ufile/bill/resource_plan?id=%E4%BD%BF%E7%94%A8%E6%98%8E%E7%BB%86)</sup>](https://docs.ucloud.cn/ufile/bill/resource_plan?id=%E4%BD%BF%E7%94%A8%E6%98%8E%E7%BB%86)</sup>) | 折扣视活动而定，需接口或控制台查询<sup>[[ucloud.cn](http://ucloud.cn)]([https://docs.ucloud.cn/api/ufile-api/renew_ufile_pkg)</sup>](https://docs.ucloud.cn/api/ufile-api/renew_ufile_pkg)</sup>) |

| 京东云 OSS | 2TB 至 100TB 官网片段<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>) | 中间档位缺失，小规格仅有第三方价<sup>[GitHub]([https://github.com/oadbn08/jdcloud-oss-pricing)</sup>](https://github.com/oadbn08/jdcloud-oss-pricing)</sup>) |

| 移动云 EOS | 50GB 至 2000TB，共 12 档<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) | 逐档包月价公示，包年等于包月乘 12<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

折算单价层面，各平台资源包相对自家按量价的让利幅度差异极大。华为云 Flexus 100TB 包年 64475 元折合 0.0528 元/GB/月，相对其 0.0990 元的按量价下降 46.7%<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>；金山云](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>；金山云) 2TB 六个月 1105 元折合 0.0726 元/GB/月，相对 0.108 元下降 32.8%<sup>[[ksyun.com](http://ksyun.com)]([https://www.ksyun.com/nv/product/KS3.html)</sup>；百度智能云三年期包](https://www.ksyun.com/nv/product/KS3.html)</sup>；百度智能云三年期包) 7.5 折后约 0.0807 元/GB/月<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>；阿里云](https://cloud.baidu.com/product-price/bos.html)</sup>；阿里云) 1TB 年价 999 元折合 0.0832 元/GB/月，相对按量折扣价 0.09 元再降约 7.5%<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>；腾讯云活动页](https://help.aliyun.com/zh/oss/traffic-fees)</sup>；腾讯云活动页) 100GB 一年 22.66 元折合 0.0189 元/GB/月，相对 0.118 元的按量价下降 84%，是全部样本中让利幅度最大的一例<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>。与之形成对照的是天翼云与移动云：OOS](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>。与之形成对照的是天翼云与移动云：OOS) 经典版 1TiB 包月 102 元折合 0.0996 元/GiB/月<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>，移动云](https://www.ctyun.cn/document/10026693/10026740)</sup>，移动云) 1TB 包月 111 元折合 0.108 元/GB/月<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>，两者相对自家按量价几乎没有下降，预付费的价值在于预算锁定而非成本削减。](https://www.tencentcloud.com/pricing/cos)</sup>，两者相对自家按量价几乎没有下降，预付费的价值在于预算锁定而非成本削减。)

由此可以识别出两条完全不同的资源包定价路线。一条是"周期换价格"，以百度智能云与七牛云为代表，容量阶梯几乎不给折扣，100GB 与 10PB 的折算单价同为 0.1074 元/GB/月<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>，让利全部交给时长；另一条是"规模与周期双轨"，以阿里云与华为云](https://cloud.baidu.com/product-price/bos.html)</sup>，让利全部交给时长；另一条是"规模与周期双轨"，以阿里云与华为云) Flexus 为代表，阿里云 300TB 年价折合 0.123 元/GB/月反而高于 1TB 年价的 0.0832 元/GB/月<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>，说明大容量档的真实价格已脱离公开列表、转入人工议价，而华为云](https://help.aliyun.com/zh/oss/traffic-fees)</sup>，说明大容量档的真实价格已脱离公开列表、转入人工议价，而华为云) 1TB 与 100TB 的折算单价仅相差 8%<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>，属于规模效应微弱的类型。对企业采购而言，公开价格表的约束力正在随容量上升而下降，这一点在头部云上表现得尤为明显。](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>，属于规模效应微弱的类型。对企业采购而言，公开价格表的约束力正在随容量上升而下降，这一点在头部云上表现得尤为明显。)

## 5. 冗余方式与计价口径造成的价格分层

### 5.1 本地冗余与同城/多可用区冗余价差

在标准存储之下，冗余方式构成第二定价维度。已公示双档价格的五家平台中，多 AZ 或同城冗余相对单 AZ 的溢价区间为 25% 至 51.5%。

**表11：单 AZ 与多 AZ/同城冗余溢价幅度（按量目录价口径）**

| 平台 | 单 AZ/本地冗余 | 多 AZ/同城冗余 | 溢价幅度 |

|---|---|---|---|

| 阿里云 OSS（目录价） | 0.12<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 0.15<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 25% |

| 移动云 EOS | 0.12<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/product/cos)</sup>](https://cloud.tencent.com/product/cos)</sup>) | 0.15<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/product/cos)</sup>](https://cloud.tencent.com/product/cos)</sup>) | 25% |

| 天翼云 ZOS | 0.09<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/qzdh/143444_15)</sup>](https://www.ctyun.cn/qzdh/143444_15)</sup>) | 0.12<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/qzdh/143444_15)</sup>](https://www.ctyun.cn/qzdh/143444_15)</sup>) | 33.3% |

| 阿里云 OSS（折扣价） | 0.09<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 0.12<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 33.3% |

| 百度智能云 BOS | 0.119<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 0.15<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>](https://cloud.baidu.com/product-price/bos.html)</sup>) | 26.1% |

| 火山引擎 TOS | 0.099<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>) | 0.15<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>) | 51.5% |

阿里云同城冗余存储包的独立定价进一步印证了这一分层：其标准同城冗余包 100GB 包月 14 元、500GB 包月 68 元、1TB 包月 138 元、100TB 包月 13824 元<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。以](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。以) 1TB 计，同城冗余包月折合 0.135 元/GB/月，本地冗余包月 111 元折合 0.108 元/GB/月，两者相差约 25%，与按量目录价的冗余溢价完全一致，说明阿里云把冗余价差贯穿了按量与资源包两套体系。

华为云与腾讯云的多 AZ 具体单价未在官网公开页面展示，前者需通过价格计算器获取，后者在检索中出现的 0.136 元/GB/月经核实为中国香港等地域价格而非多 AZ 溢价<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/53863)</sup>，属于典型的口径混淆风险点。京东云则出现了本次调研中唯一的反向价差：其标准存储多](https://cloud.tencent.com/document/product/436/53863)</sup>，属于典型的口径混淆风险点。京东云则出现了本次调研中唯一的反向价差：其标准存储多) AZ 单价为 0.003945206 元/GB/天，按 30 天折算约 0.118 元/GB/月，反而低于单 AZ 的 0.00427 元/GB/天折合 0.128 元/GB/月<sup>[[jdcloud.com](http://jdcloud.com)]([https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service)</sup>。多](https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service)</sup>。多) AZ 可用性更高而标价更低，在成本逻辑上不成立，最可能的解释是两项日单价处于不同时点或不同促销口径下，采购前必须以价格总览页同一时点的标价复核<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/en/object-storage-service/price-overview)</sup>。这一异常也提醒：跨冗余等级比价的前提是同源同时点，否则会出现"买更贵的服务反而更划算"的错误结论。](https://docs.jdcloud.com/en/object-storage-service/price-overview)</sup>。这一异常也提醒：跨冗余等级比价的前提是同源同时点，否则会出现"买更贵的服务反而更划算"的错误结论。)

### 5.2 免费额度、体验价与起步门槛

小额容量的入口价格与标准档位之间存在显著跳升，这部分构成了个人开发者与小团队的实际决策依据。

**表12：已公示的免费额度与体验价入口**

| 平台与规格 | 标价 | 折合元/GB/月 |

|---|---|---|

| 七牛云 Kodo 实名认证用户标准存储 | 每月 10GB 免费 | 0 |

| 阿里云 OSS 标准本地冗余包 40GB（体验价） | 9 元/年<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) | 约 0.0188<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>](https://help.aliyun.com/zh/oss/traffic-fees)</sup>) |

| 华为云政务专区 标准单 AZ 包 40GB | 57.6 元/4 年<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/notice/2024/20241211100920826.html)</sup>](https://www.huaweicloud.com/notice/2024/20241211100920826.html)</sup>) | 约 0.030<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/notice/2024/20241211100920826.html)</sup>](https://www.huaweicloud.com/notice/2024/20241211100920826.html)</sup>) |

| 腾讯云 COS 标准容量包 10GB | 0.85 元/月<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/53482)</sup>](https://cloud.tencent.com/document/product/436/53482)</sup>) | 0.085<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/53482)</sup>](https://cloud.tencent.com/document/product/436/53482)</sup>) |

| 京东云 OSS 20GB（第三方整理活动历史报价） | 约 0.6 元/月<sup>[GitHub]([https://github.com/oadbn08/jdcloud-oss-pricing)</sup>](https://github.com/oadbn08/jdcloud-oss-pricing)</sup>) | 约 0.030<sup>[GitHub]([https://github.com/oadbn08/jdcloud-oss-pricing)</sup>](https://github.com/oadbn08/jdcloud-oss-pricing)</sup>) |

| 天翼云 OOS 经典版 40GiB | 4 元/月<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) | 约 0.1<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>](https://www.ctyun.cn/document/10026693/10026740)</sup>) |

| 移动云 EOS 50GB | 5 元/月<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) | 0.1<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>](https://www.tencentcloud.com/pricing/cos)</sup>) |

入口价与标准档之间的落差相当剧烈。阿里云 40GB 体验价年付 9 元折合 0.0188 元/GB/月，而 100GB 档年价 162 元折合 0.135 元/GB/月，单位成本在跨越体验档后上升约 6.2 倍（0.135÷0.021）<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>。七牛云的免费额度则是全行业最彻底的前置让利，10GB](https://help.aliyun.com/zh/oss/traffic-fees)</sup>。七牛云的免费额度则是全行业最彻底的前置让利，10GB) 以内不产生存储费用，超出部分按当前 0.115 元/GB/月结算，这一门槛设计直接指向个人开发者与小规模静态资源场景。天翼云与移动云的小档位折合单价均为 0.1 元附近<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740),[tencentcloud.com](https://www.tencentcloud.com/pricing/cos)</sup>，几乎不提供入口让利，反映出运营商云的定价面向预算申报与合规采购，而非个人用户的低价获客。京东云](https://www.ctyun.cn/document/10026693/10026740),[tencentcloud.com](https://www.tencentcloud.com/pricing/cos)</sup>，几乎不提供入口让利，反映出运营商云的定价面向预算申报与合规采购，而非个人用户的低价获客。京东云) 20GB 一个月约 0.6 元的超低门槛出自第三方整理的活动历史报价，官网并未公示该档位现价<sup>[GitHub]([https://github.com/oadbn08/jdcloud-oss-pricing)</sup>，其可持续性存在明显不确定性。](https://github.com/oadbn08/jdcloud-oss-pricing)</sup>，其可持续性存在明显不确定性。)

## 6. 定价透明度评估与选型结论

### 6.1 价格公示完整度与人工询价依赖

以"能否仅凭公开页面完成逐档比价"为标准，十一家平台的公示完整度分为三档。第一档是价格表完整可查，包括阿里云、百度智能云、天翼云 OOS 经典版、金山云与移动云：阿里云 40GB 至 300TB 的包月与年价全部列出<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>，百度](https://help.aliyun.com/zh/oss/traffic-fees)</sup>，百度) 14 档总价与折算单价全部列出<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>，天翼云](https://cloud.baidu.com/product-price/bos.html)</sup>，天翼云) OOS 14 档包月价全部列出<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>，移动云](https://www.ctyun.cn/document/10026693/10026740)</sup>，移动云) 12 档包月价与包年规则全部列出<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>，金山云产品页直接标注](https://www.tencentcloud.com/pricing/cos)</sup>，金山云产品页直接标注) 0.108 元/GB/月与三档包价<sup>[[ksyun.com](http://ksyun.com)]([https://www.ksyun.com/nv/product/KS3.html)</sup>。第二档是档位可查但价格缺失，包括火山引擎与](https://www.ksyun.com/nv/product/KS3.html)</sup>。第二档是档位可查但价格缺失，包括火山引擎与) UCloud：火山资源包概述页明确"请以资源包购买页为准"<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>，UCloud](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>，UCloud) 文档写明"购买折扣视当前活动折扣为准"，实际价格需登录控制台或调用 GetUFilePkgPrice 接口<sup>[[ucloud.cn](http://ucloud.cn)]([https://docs.ucloud.cn/api/ufile-api/renew_ufile_pkg)</sup>。第三档介于两者之间，腾讯云定价中心与京东云资源包概述页均为动态渲染，公开抓取仅能获得部分档位<sup>[tencent.com](https://buy.cloud.tencent.com/price/cos),[jdcloud.com](https://m-console-buy.jdcloud.com/init?product=Oss)</sup>，华为云普通标准包则把逐档价格指向"产品价格详情"而未直接展示在说明页<sup>[huaweicloud.com](https://support.huaweicloud.com/price-obs/obs_42_0003.html)</sup>。](https://docs.ucloud.cn/api/ufile-api/renew_ufile_pkg)</sup>。第三档介于两者之间，腾讯云定价中心与京东云资源包概述页均为动态渲染，公开抓取仅能获得部分档位<sup>[tencent.com](https://buy.cloud.tencent.com/price/cos),[jdcloud.com](https://m-console-buy.jdcloud.com/init?product=Oss)</sup>，华为云普通标准包则把逐档价格指向"产品价格详情"而未直接展示在说明页<sup>[huaweicloud.com](https://support.huaweicloud.com/price-obs/obs_42_0003.html)</sup>。)

透明度差异还会体现在文档时效上。阿里云《购买 OSS 资源包》文档更新于 2026 年 9 月 20 日<sup>[阿里云]([https://help.aliyun.com/zh/oss/purchase-resource-plans)</sup>，腾讯云《计费概述》与《流量费用》分别更新于](https://help.aliyun.com/zh/oss/purchase-resource-plans)</sup>，腾讯云《计费概述》与《流量费用》分别更新于) 2026 年 7 月 30 日与 8 月 26 日<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/document/product/436/16871),[tencent.com](https://cloud.tencent.com/document/product/436/53863)</sup>，百度存储价格文档更新于](https://cloud.tencent.com/document/product/436/16871),[tencent.com](https://cloud.tencent.com/document/product/436/53863)</sup>，百度存储价格文档更新于) 2026 年 8 月 20 日<sup>[百度]([https://cloud.baidu.com/product/bos.html)</sup>，属于近三个月内维护；移动云"资源包价格"文档停留在](https://cloud.baidu.com/product/bos.html)</sup>，属于近三个月内维护；移动云"资源包价格"文档停留在) 2024 年 10 月 29 日<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>，虽然其内容为一手公示，但两年未更新意味着实际成交价可能与列表存在偏差。检索过程中还发现二手汇总与官网一手数据不一致的情况：移动云曾出现](https://www.tencentcloud.com/pricing/cos)</sup>，虽然其内容为一手公示，但两年未更新意味着实际成交价可能与列表存在偏差。检索过程中还发现二手汇总与官网一手数据不一致的情况：移动云曾出现) 100GB 11.4 元/月、1TB 116.8 元/月的流传数据，与官网一手页面的 11 元、111 元不符<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>。这类偏差的成因通常是过期活动价被反复转载，采购决策前应当以官网计费文档为唯一准绳。](https://www.tencentcloud.com/pricing/cos)</sup>。这类偏差的成因通常是过期活动价被反复转载，采购决策前应当以官网计费文档为唯一准绳。)

### 6.2 分场景选型结论与成本优化路径

把容量、访问频次、可用性等级三个变量代入本轮价格数据，可以给出三类场景的选型判断。个人开发者与 10GB 以内的轻量场景，成本最优解是七牛云每月 10GB 免费标准存储，其次是阿里云 40GB 年付 9 元的体验包<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>；该场景的关键不是单价而是入口门槛，超出](https://help.aliyun.com/zh/oss/traffic-fees)</sup>；该场景的关键不是单价而是入口门槛，超出) 40GB 后单位成本会跳升至 0.135 元/GB/月量级，需要提前估算增长。成长型业务在 1TB 至 10TB 区间，可选路径最多：阿里云 1TB 年价 999 元折合 0.0832 元/GB/月<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>、华为云](https://help.aliyun.com/zh/oss/traffic-fees)</sup>、华为云) Flexus 1TB 年价 706 元折合 0.0574 元/GB/月<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>、金山云](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>、金山云) 2TB 六个月 1105 元折合 0.0726 元/GB/月<sup>[[ksyun.com](http://ksyun.com)]([https://www.ksyun.com/nv/product/KS3.html)</sup>、百度三年期包约](https://www.ksyun.com/nv/product/KS3.html)</sup>、百度三年期包约) 0.0807 元/GB/月<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>，其中华为](https://cloud.baidu.com/product-price/bos.html)</sup>，其中华为) Flexus 的折算单价最低但受"每种规格限购 1 个"约束<sup>[[huaweicloud.com](http://huaweicloud.com)]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>，适合作为单一业务线的长期锁定；腾讯云](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn)</sup>，适合作为单一业务线的长期锁定；腾讯云) 100GB 一年 22.66 元的活动价属于限时入口，不宜作为三年期预算基础<sup>[[tencent.com](http://tencent.com)]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>。大型企业与](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826)</sup>。大型企业与) PB 级场景，可承载上限从高到低依次为京东云 1PB、天翼云 OOS 2PiB<sup>[[ctyun.cn](http://ctyun.cn)]([https://www.ctyun.cn/document/10026693/10026740)</sup>、百度](https://www.ctyun.cn/document/10026693/10026740)</sup>、百度) 10PB<sup>[百度]([https://cloud.baidu.com/product-price/bos.html)</sup>、移动云](https://cloud.baidu.com/product-price/bos.html)</sup>、移动云) 2000TB<sup>[[tencentcloud.com](http://tencentcloud.com)]([https://www.tencentcloud.com/pricing/cos)</sup>、阿里云与腾讯云的公开档位需在数百](https://www.tencentcloud.com/pricing/cos)</sup>、阿里云与腾讯云的公开档位需在数百) TB 以上转入人工报价<sup>[阿里云]([https://help.aliyun.com/zh/oss/traffic-fees)</sup>，实际议价空间集中在这一区间，公开价只能作为谈判基准而非成交价。](https://help.aliyun.com/zh/oss/traffic-fees)</sup>，实际议价空间集中在这一区间，公开价只能作为谈判基准而非成交价。)

成本优化路径有三条。第一是冗余等级分层：多 AZ 与同城冗余的溢价在 25% 至 51.5% 之间，把非核心数据放在单 AZ 或本地冗余、仅对核心桶启用同城冗余，比全量升级冗余的总成本更低；火山引擎 51.5% 的冗余溢价<sup>[[volcengine.com](http://volcengine.com)]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>尤其需要按数据重要性区分。第二是周期与容量匹配：百度与七牛均不提供容量折扣而只提供时长折扣<sup>[百度](https://cloud.baidu.com/product-price/bos.html)</sup>，对容量稳定、可预测三年用量的业务应直接选择](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2)</sup>尤其需要按数据重要性区分。第二是周期与容量匹配：百度与七牛均不提供容量折扣而只提供时长折扣<sup>[百度](https://cloud.baidu.com/product-price/bos.html)</sup>，对容量稳定、可预测三年用量的业务应直接选择) 7.5 折的三年包；阿里云与华为云的大容量公开折算单价并不优于中小容量，容量进入百 TB 级后应从官网价格表转向人工报价通道。第三是必须把请求与流量纳入总成本：阿里云与京东云的计费体系均将存储包与请求包、流量包分列<sup>[[jdcloud.com](http://jdcloud.com)]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>，UCloud](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview)</sup>，UCloud) 的外网流出流量包单列 100GB 至 500TB 规格<sup>[[ucloud.cn](http://ucloud.cn)]([https://docs.ucloud.cn/ufile/bill/resource_plan)</sup>，本次调研聚焦存储容量与存储单价，流量与请求两项在同一总容量假设下往往决定实际账单量级，选型时应当以价格计算器按真实读写与出网量复算，不能仅以每](https://docs.ucloud.cn/ufile/bill/resource_plan)</sup>，本次调研聚焦存储容量与存储单价，流量与请求两项在同一总容量假设下往往决定实际账单量级，选型时应当以价格计算器按真实读写与出网量复算，不能仅以每) GB 存储单价定论。

## 核心参考文献

[oadbn08/jdcloud-oss-pricing: 京东云对象存储资源包优惠 ...]([https://github.com/oadbn08/jdcloud-oss-pricing](https://github.com/oadbn08/jdcloud-oss-pricing))

[京东云对象存储OSS价格详解：标准/低频/归档三大类型怎么 ...]([https://github.com/ctpnjvmn/jdcloud-oss-pricing](https://github.com/ctpnjvmn/jdcloud-oss-pricing))

[京东云对象存储OSS价格全解析：按量计费怎么算？资源包 ...]([https://github.com/jig1560/jdcloud-oss-pricing](https://github.com/jig1560/jdcloud-oss-pricing))

[对象存储KS3_购买价格_功能优势_场景案例-金山云]([https://www.ksyun.com/nv/product/KS3.html](https://www.ksyun.com/nv/product/KS3.html))

[计费概述--对象存储]([https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2](https://www.volcengine.com/docs/TorchObjectStorage/Billingoverview-2))

[资源包概述--对象存储-帮助文档]([https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview](https://docs.jdcloud.com/cn/object-storage-service/resourcepkg-overview))

[对象存储US3 - UCloud中立云计算服务商]([https://www.ucloud.cn/site/product/ufile.html?ytag=%E5%9F%9F%E5%90%8D_%E7%8C%AB%E5%92%AA%E6%9C%80%E6%96%B0%E7%A0%B4%E5%9F%9F%E5%90%8D_tag_seo](https://www.ucloud.cn/site/product/ufile.html?ytag=%E5%9F%9F%E5%90%8D_%E7%8C%AB%E5%92%AA%E6%9C%80%E6%96%B0%E7%A0%B4%E5%9F%9F%E5%90%8D_tag_seo))

[对象存储BOS]([https://cloud.baidu.com/product-price/bos.html](https://cloud.baidu.com/product-price/bos.html))

[资源包 对象存储 US3_文档中心_UCloud中立云计算服务商]([https://docs.ucloud.cn/ufile/bill/resource_plan](https://docs.ucloud.cn/ufile/bill/resource_plan))

[智能分层概述--对象存储]([https://www.volcengine.com/docs/6349/153060](https://www.volcengine.com/docs/6349/153060))

[对象存储服务OBS_官网_云存储服务_数据云存储解决方案-华为云]([https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn](https://www.huaweicloud.com/product/obs.html?utm_source=yuntushuocsdn))

[资源包计费-对象存储（经典版）I型]([https://www.ctyun.cn/document/10026693/10026740](https://www.ctyun.cn/document/10026693/10026740))

[对象存储]([https://www.volcengine.com/product/TOS](https://www.volcengine.com/product/TOS))

[对象存储_开发者平台_抖音开放平台]([https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/guide/component/tos/tos](https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/guide/component/tos/tos))

[对象存储-火山引擎]([https://www.volcengine.com/product/TOS?utm_campaign=zxj_cf3_duanlian4&utm_content=duixiangcunchu&utm_medium=sem_bing&utm_source=5&utm_term=sem_bing_pinzhuan_zxj_cf3_dl4](https://www.volcengine.com/product/TOS?utm_campaign=zxj_cf3_duanlian4&utm_content=duixiangcunchu&utm_medium=sem_bing&utm_source=5&utm_term=sem_bing_pinzhuan_zxj_cf3_dl4))

[资源包 对象存储 US3_文档中心_UCloud中立云计算服务商]([https://docs.ucloud.cn/ufile/bill/resource_plan?id=%E4%BD%BF%E7%94%A8%E6%98%8E%E7%BB%86](https://docs.ucloud.cn/ufile/bill/resource_plan?id=%E4%BD%BF%E7%94%A8%E6%98%8E%E7%BB%86))

[Price Overview---Documentation-JD Cloud]([https://docs.jdcloud.com/en/object-storage-service/price-overview](https://docs.jdcloud.com/en/object-storage-service/price-overview))

[对象存储 存储容量费用_腾讯云]([https://cloud.tencent.com/document/product/436/53482](https://cloud.tencent.com/document/product/436/53482))

[对象存储（经典版）I型]([https://www.ctyun.cn/qzdh/143444_15](https://www.ctyun.cn/qzdh/143444_15))

[对象存储US3 - UCloud中立云计算服务商]([https://www.ucloud.cn/site/product/ufile.html?ytag=%E4%BA%91%E5%AD%98%E5%82%A8_mac%E7%A7%BB%E5%8A%A8%E7%A1%AC%E7%9B%98_tag_seo](https://www.ucloud.cn/site/product/ufile.html?ytag=%E4%BA%91%E5%AD%98%E5%82%A8_mac%E7%A7%BB%E5%8A%A8%E7%A1%AC%E7%9B%98_tag_seo))

[移动云官网-智能新空间]([https://ecloud.10086.cn/portal/product/eos](https://ecloud.10086.cn/portal/product/eos))

[流量费用-对象存储(OSS) - 阿里云文档]([https://help.aliyun.com/zh/oss/traffic-fees](https://help.aliyun.com/zh/oss/traffic-fees))

[对象存储 COS 成本优化解决方案_腾讯云]([https://cloud.tencent.com.cn/document/practice/436/50201](https://cloud.tencent.com.cn/document/practice/436/50201))

[对象存储特惠活动_对象存储购买_对象存储选购- 腾讯云]([https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826](https://cloud.tencent.com/act/pro/cos?ad_trace=0116e678de5142e788dfaebfef128f98&from=24826&from_column=24826))

[对象存储OSS-文件存储-云对象存储服务-京东云]([https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service](https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=cnblogs_online_Developer_Community&utm_medium=Footer&utm_source=PMM_cnblogs&utm_term=object-storage-service))

[对象存储OSS-文件存储-云对象存储服务-京东云]([https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=ReadMore&utm_medium=bottom&utm_source=PMM_itpub&utm_term=NA](https://www.jdcloud.com/cn/products/object-storage-service?utm_campaign=ReadMore&utm_medium=bottom&utm_source=PMM_itpub&utm_term=NA))

[对象存储COS]([https://cloud.tencent.com/product/cos](https://cloud.tencent.com/product/cos))

[定价对象存储]([https://www.tencentcloud.com/pricing/cos](https://www.tencentcloud.com/pricing/cos))

[购买OSS资源包 - 阿里云文档]([https://help.aliyun.com/zh/oss/purchase-resource-plans](https://help.aliyun.com/zh/oss/purchase-resource-plans))

[对象存储定价  *对象存储价格*  对象存储计费模式 - 腾讯云]([https://buy.cloud.tencent.com/price/cos](https://buy.cloud.tencent.com/price/cos))

[对象存储特惠活动_对象存储购买_对象存储选购- 腾讯云]([https://cloud.tencent.com.cn/act/pro/cos?ad_trace=3013b66363074182a0af4643c3b3fe3f&from=24826&from_column=24826](https://cloud.tencent.com.cn/act/pro/cos?ad_trace=3013b66363074182a0af4643c3b3fe3f&from=24826&from_column=24826))

[对象存储 Kodo_云存储_海量安全高可靠云存储_oss - 七牛云]([https://www.qiniu.com/products/kodo](https://www.qiniu.com/products/kodo))

[对象存储 Kodo_云存储_海量安全高可靠云存储_oss - 七牛云]([https://www.qiniu.com/products/kodo?code=1h471on554ymq](https://www.qiniu.com/products/kodo?code=1h471on554ymq))

[价格详情 - 七牛云]([https://www.qiniu.com/en/prices](https://www.qiniu.com/en/prices))

[对象存储- 资源包概述]([https://docs.volcengine.com/docs/6349/178341?lang=zh](https://docs.volcengine.com/docs/6349/178341?lang=zh))

[按需计费-对象存储ZOS-计费说明]([https://www.ctyun.cn/document/10026735/10240507](https://www.ctyun.cn/document/10026735/10240507))

[阿里云定价_oss价格详情_对象存储]([https://www.aliyun.com/price/detail/oss](https://www.aliyun.com/price/detail/oss))

[计费项概述 - 阿里云文档]([https://help.aliyun.com/zh/oss/billable-item-overview](https://help.aliyun.com/zh/oss/billable-item-overview))

[对象存储 按量计费（后付费）_腾讯云]([https://cloud.tencent.com/document/product/436/36522](https://cloud.tencent.com/document/product/436/36522))

[资源包介绍- 对象存储 - 腾讯云]([https://cloud.tencent.com/document/product/436/36523](https://cloud.tencent.com/document/product/436/36523))

[对象存储数据处理_COS数据处理_数据处理方案-腾讯云]([https://cloud.tencent.com/product/cos?from=20064&from_column=20064](https://cloud.tencent.com/product/cos?from=20064&from_column=20064))

[对象存储 计费概述_腾讯云]([https://cloud.tencent.com/document/product/436/16871](https://cloud.tencent.com/document/product/436/16871))

[流量费用- 对象存储 - 腾讯云]([https://cloud.tencent.com/document/product/436/53863](https://cloud.tencent.com/document/product/436/53863))

[对象存储服务OBS_官网_云存储服务_数据云存储解决方案-华为云]([https://www.huaweicloud.com/product/obs.html?utm_adplace=AdPlace097752&utm_source=huawei&utm_term=](https://www.huaweicloud.com/product/obs.html?utm_adplace=AdPlace097752&utm_source=huawei&utm_term=))

[存储费用_计费项_计费说明_对象存储服务 OBS-华为云]([https://support.huaweicloud.com/price-obs/obs_42_0003.html](https://support.huaweicloud.com/price-obs/obs_42_0003.html))

[华为云Flexus OBS：中小企业数据上云的“更优解”_凤凰网]([https://i.ifeng.com/c/8qJKHNAGaMn](https://i.ifeng.com/c/8qJKHNAGaMn))

[华为云【对象存储服务】中国站乌兰察布政务专区按需套餐包于 ...]([https://www.huaweicloud.com/notice/2024/20241211100920826.html](https://www.huaweicloud.com/notice/2024/20241211100920826.html))

[华为云对象存储服务新一轮降价，Multi-AZ正式商用上线 - 商业]([https://biz.ifeng.com/c/7hVSjmwtRhm](https://biz.ifeng.com/c/7hVSjmwtRhm))

[对象云存储：从入门到通透，一次性把所有概念、参数、原理和场景给你讲明白。]([https://mp.weixin.qq.com/s?__biz=MzYzMzUzNDU4Mw==&idx=1&mid=2247485004&sn=fa3cfdda2f546fca33cb682fea82b320](https://mp.weixin.qq.com/s?__biz=MzYzMzUzNDU4Mw==&idx=1&mid=2247485004&sn=fa3cfdda2f546fca33cb682fea82b320))

[对象存储BOS_云存储_分布式存储_数据湖存储]([https://cloud.baidu.com/product/bos.html](https://cloud.baidu.com/product/bos.html))

[计费概述--对象存储]([https://www.volcengine.com/docs/6349/78455](https://www.volcengine.com/docs/6349/78455))

[对象存储（TOS）]([https://www.volcengine.com/product/tos](https://www.volcengine.com/product/tos))

[资源包购买--对象存储-帮助文档]([https://docs.jdcloud.com/cn/object-storage-service/buy-resourcepkg](https://docs.jdcloud.com/cn/object-storage-service/buy-resourcepkg))

[价格总览--对象存储-帮助文档]([https://docs.jdcloud.com/cn/object-storage-service/price-overview](https://docs.jdcloud.com/cn/object-storage-service/price-overview))

[资源包 对象存储 US3_文档中心_UCloud中立云计算服务商]([https://docs.ucloud.cn/ufile/bill/resource_plan?id=%E5%8D%87%E7%BA%A7](https://docs.ucloud.cn/ufile/bill/resource_plan?id=%E5%8D%87%E7%BA%A7))

[资源包续费- RenewUFilePkg 对象存储US3_文档中心]([https://docs.ucloud.cn/api/ufile-api/renew_ufile_pkg](https://docs.ucloud.cn/api/ufile-api/renew_ufile_pkg))

[价格计算器- 对象存储]([https://m-console-buy.jdcloud.com/init?product=Oss](https://m-console-buy.jdcloud.com/init?product=Oss))

[对象存储免费额度 - 腾讯云]([https://cloud.tencent.com/document/product/436/6240](https://cloud.tencent.com/document/product/436/6240))

