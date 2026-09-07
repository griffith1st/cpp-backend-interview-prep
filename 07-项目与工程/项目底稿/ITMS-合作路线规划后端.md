# ITMS-BD：合作路线规划后端底稿

更新：2026-09-07。建议主责：**交通感知路线规划后端，包括演示路网、三策略路径计算、拥堵快照读取、路线持久化和接口联调。**

这是本次选定的合作分工建议，待本人核对参与深度后用于简历。现有简历只明确写了部署、联调与测试运维参与；阅读到路线实现不自动构成个人编写经历。保留原范围的表述见[总划分](../JavaGuide第一阶段-三项目职责划分.md#与现有简历的衔接)。

## 目录

- [业务与模块边界](#业务与模块边界)
- [职责与代码矩阵](#职责与代码矩阵)
- [真实请求链路](#真实请求链路)
- [算法与数据口径](#算法与数据口径)
- [技术选型](#技术选型)
- [三条深挖线](#三条深挖线)
- [30 秒介绍](#30-秒介绍)
- [3 分钟展开](#3-分钟展开)
- [高频追问](#高频追问)
- [验证与数字口径](#验证与数字口径)
- [源码与来源](#源码与来源)

## 业务与模块边界

系统面向交通管理演示：展示路口状态、提供路线方案、查看预测与信号方案。核心路线场景是选择起终点与策略，根据当前拥堵数据计算路径并保留历史。它不是已接入城市全部路网和真实信号设备的生产平台。

选择该模块的理由：它形成“接口 → 数据查询 → 算法 → 持久化 → 前端展示”的闭环，既能讲 Java 后端工程，也能讲图算法和数据一致性，不必同时认领整套平台。

| 归属层次 | 建议范围 | 交付与边界 |
| --- | --- | --- |
| 本人主责 | 路口/路网查询，规划请求与策略，拥堵读取适配，路径和历史结果 | 路线相关 Controller、Service、Entity、Repository；逐项确认主要编写还是共同完成 |
| 本人共同参与 | REST 契约、交通数据口径、Docker Compose 环境、日志排错 | 保留已有简历的部署联调经历；不改成独自负责部署架构 |
| 其他协作者建议主责 | React/ECharts 页面、账号认证、模拟采集/Kafka、预测与信号、整体部署 | 本人理解输入输出，解释与路线模块的衔接 |
| 主责之外 | 训练生产 LSTM/DQN、真实交通设备控制、分布式高并发优化 | 当前代码证据不支持这些成果表述 |

技术栈分两层：本人路线链路以 Java 17、Spring Boot 3.2、Spring Data JPA、PostgreSQL 为主；React、Kafka、Redis、Compose 可出现在系统环境说明，但分别解释是否真经过当前请求。

## 职责与代码矩阵

Java 路径前缀：`backend/src/main/java/com/itms/`。建议分工按职责划定，同一文件可包含合作代码。

| 建议本人职责 | 文件/入口 | 应能解释 |
| --- | --- | --- |
| 路网契约 | `common/TrafficNetwork.java` | 14 个路口、29 条边；邻接查找把边按双向使用 |
| 路线 API | `controller/RoutePlanController.java` | `/api/routes/intersections`、`/network`、`POST /plan`、`/history` |
| 路径计算 | `service/impl/RoutePlanServiceImpl.java` | `planRouteByIntersection`、`normalizeStrategy`、`dijkstra`、`weight` |
| 交通数据适配 | 同上 `currentCongestionByIntersection`；`repository/TrafficDataRepository.java` | 当前快照、备用查询、时段模拟回退；主责只到读取适配 |
| 保存与历史 | `entity/RoutePlan.java`、`repository/RoutePlanRepository.java` | `route_plans`，路线点/边的 JSON 文本、用户维度历史 |
| 接口联调 | `frontend/src/services/api.ts`、`frontend/src/pages/RoutePlanning.tsx` | 前端调用入口、刷新历史、地图颜色口径；前端实现为协作范围 |
| 故障定位 | 路线保存、`SystemLogService`、服务配置 | 先保存再记录日志的失败窗口，数据库连接和错误返回 |

源码 API 以 `/api/routes/plan` 为准，旧 README 的 `/api/route/planByIntersection` 已与实现不一致。`RoutePlan` 注释提到 A*，实际主方法是 Dijkstra。

## 真实请求链路

```text
RoutePlanning.tsx: 用户选起终点和策略
  -> api.ts: routeApi.planByIntersection
  -> POST /api/routes/plan
  -> RoutePlanController.planRouteByIntersection
  -> RoutePlanServiceImpl.planRouteByIntersection
       1. 校验演示路网节点，归一化策略
       2. currentCongestionByIntersection 取得 Map
          -> TrafficDataRepository 查询 PostgreSQL
          -> 备用查询或时段模拟回退
       3. 固定本次 Map，Dijkstra 计算路径
       4. 汇总距离、预计耗时和碳排估计
       5. RoutePlanRepository.save 保存路线
       6. SystemLogService.log 记录操作
  -> 返回结果 -> 页面展示并刷新历史
```

这条同步请求不因为系统有 Redis/Kafka 依赖就自动经过缓存和消息队列。路线计算也不依赖已训练 LSTM 的输出。

**异常链路：**原生查询为空时尝试备用查询，两次都无数据才生成时段估计；部分路口缺失但查询非空时直接使用结果，缺路口默认拥堵 0。Repository 异常会向上抛出，未包含数据库故障降级。保存成功后日志失败，可能产生“请求失败但路线已保存”。当前缺少统一事务和资源身份边界等保障，详见下文，不把改进方案画成已实现链路。

## 算法与数据口径

设边的距离为 `d`、基础分钟数为 `t`、红绿灯数为 `s`、碳因子为 `f`、基础拥堵系数为 `b`，两端路口平均拥堵值最大者为 `L`：

```text
C = b * (1 + 0.4 * L)
SHORTEST   权重 = d * (1 + 0.2 * L)
FASTEST    权重 = t * C + s * 0.5
LOW_CARBON 权重 = d * f * C + s * 0.2
```

`GREENEST` 归一化为 `LOW_CARBON`。以上是演示权重，不是经过交通模型校准的真实物理指标。

三个容易失分的细节：

1. `SHORTEST` 含拥堵惩罚，实际优化的是加权距离，不严格等于最少公里数。
2. 显示碳排量按 `d * 120 * f * C + s * 8` 累加，与低碳搜索权重不是同一目标的等比例变换。因此当前“低碳策略”不保证最小化最终显示的碳排数值。
3. Dijkstra 要求边权非负且搜索中保持既定权重。当前一次计算先构造 Map 再搜索，稳定的是这一次输入，并不证明所有路口来自同一完整采集批次。

单位也要核对：实际汇总距离为 km、碳排为 g，Entity 部分注释仍写米/kg。应以计算和接口契约为准，后续统一 DTO 与注释。

## 技术选型

| 当前方案 | 为什么适合演示范围 | 代价与比较 |
| --- | --- | --- |
| Spring Boot 单体分层 | 路线请求的校验、计算和持久化易追踪，部署链路有限 | 不等于微服务；拆分会增加网络失败与事务协调 |
| JPA Repository | CRUD 和历史读取简洁，复杂快照可用原生 SQL | 自动映射不替代 SQL 计划、事务边界和查询口径分析 |
| Dijkstra | 14 节点演示图，无需训练，非负边权下有清晰基线 | A* 需要适配各策略的可采纳启发式；当前仍要先验证实现正确性 |
| 固定一次快照 | 避免搜索中权重随数据库更新变化 | 快照可能不完整或陈旧，需要时间与来源标识 |
| JSON 文本保存路径 | 演示规模下容易回显完整方案 | 路段统计、索引和 schema 演进较难；可再评估 JSONB/明细表 |
| 查询无数据时回退 | 空数据的演示环境也能给出估计结果 | 不包含数据库故障降级；模拟来源应显式标记，避免当作实时结果 |

以上是复盘理由，未留档的方案比较不要写成当时已做过的性能实验。

## 三条深挖线

### 路网搜索的正确性

现实现使用 `PriorityQueue<String>`，比较器读取可变 `distances`，并配合重复入队和 `visited`。节点距离改变不会自动修复堆内旧元素顺序，存在堆序正确性风险。加上 `adjacent()` 逐点扫描全部边，也不宜直接宣称当前代码达到标准邻接表版本的 `O((V+E) log V)`。

建议改进：不可变 `(distance, node)` 堆项、过期条目跳过、预建邻接表。当前状态为待实施，未计入个人已完成成果。

验证方法：冻结拥堵 Map，以朴素 Dijkstra 或 Floyd-Warshall 作对照，测试 `14 × 14 × 3 = 588` 个起终点/策略组合，比较代价和路径合法性，不要求等价最优路径的节点顺序完全相同。另测未知节点、同节点、非法策略及缺失拥堵数据。

### “实时拥堵”的数据库口径

`findCurrentCongestionNative` 取**全表最大时间戳**的数据后按路口 AVG；备用 JPQL 按**路口 + 方向各自最新**取记录。两种“最新”不是同一口径。

若新批次只写入一个路口，第一种查询仍非空，其他路口可能被遗漏；读取缺路口时默认拥堵 0，等价于把“未知”当作“不拥堵”。前端每 5 秒拉取状态，地图按方向 MAX 着色，而规划使用 AVG；刷新地图不自动重新规划。

验证方法：两路口在旧时刻都有数据，新时刻只写入一路口，对比两种查询结果和规划权重。设计上可选择完整批次 ID，或逐路口最新加过期阈值；选择取决于采集节奏，不是直接把 MAX 换成 AVG 就解决。

### 身份、保存与日志的失败窗口

客户端提交 `userId`；历史接口未传 userId 时可返回全部路线，安全配置主要要求已登录。这不等于“登录者仅访问自己的路线”。

路线保存与日志按顺序执行，Service 没有统一声明事务；日志失败时保存可能已提交。重复提交还可能增加重复历史。改进应先明确日志是强制审计还是可失败记录，再决定事务、异常处理和幂等策略。

验证方法：两个测试用户互查历史、伪造 userId、日志依赖失败、重复请求。若改动身份绑定，应从认证上下文派生用户身份，并补资源级校验；这部分与身份模块协作，而非宣称现版本已经完善。

## 30 秒介绍

**建议分工确认后使用：**

> ITMS 是合作完成的交通管理演示系统，我负责的重点是路线规划后端。从起终点和策略进入接口，读取拥堵快照，在演示路网上计算路径，再保存方案并返回前端。我主要准备讲三种权重的取舍，以及交通数据不完整时路线结果怎样受影响。页面、采集、预测和信号模块是协作边界。

## 3 分钟展开

| 时间 | 讲述内容 | 具体落点 |
| --- | --- | --- |
| 0:00–0:25 | 演示用途和个人/协作范围 | 路线后端；其他协作者负责外围模块 |
| 0:25–1:05 | 一次请求从前端到保存 | `/api/routes/plan` → Service → Repository → 路网 → save |
| 1:05–1:40 | 三种策略为什么不同 | 加权距离、时间、低碳代价；单位和非负条件 |
| 1:40–2:15 | 一个数据难点 | 最新批次缺路口；固定 Map 不代表完整快照 |
| 2:15–2:45 | 一项工程验证 | 实际联调日志优先；算法和身份问题当前列为待测 |
| 2:45–3:00 | 限制和改进顺序 | 先算法正确性/数据契约，再性能和扩展 |

需要保留原部署角色时，将“我负责计算实现”换成实际的“我参与路线链路联调”，明确算法属于阅读分析内容，其他链路说明仍可用于追问。

## 高频追问

| 问题 | 应答关键词 |
| --- | --- |
| 路线是 A* 还是 Dijkstra？ | 主代码是 Dijkstra，旧 Entity 注释陈旧 |
| 最短策略真是最短距离吗？ | 含拥堵惩罚，是加权距离目标 |
| 为什么不用负权？ | Dijkstra 的定型前提，非负边权与数据校验 |
| 复杂度是多少？ | 区分教科书算法与当前扫描全边/可变比较器实现 |
| 权重变化后当前搜索是否重算？ | 每次请求固定 Map，地图轮询不自动重算路线 |
| Redis 缓存了什么？ | 核对真实调用，本次未见路线业务 Redis 调用 |
| Kafka 在本次请求哪一步？ | 属外围数据链路，不在规划同步请求里 |
| JPA 与 MyBatis-Plus 都用了？ | 依赖存在与活跃持久化路径分开，此模块是 JPA |
| 如何避免查看他人路线？ | 从认证上下文绑定身份，校验资源范围；现实现尚有缺口 |
| 日志失败了请求怎么办？ | 先明确业务与日志提交语义，再定事务与错误处理 |
| 你训练了 LSTM/DQN 吗？ | 当前预测为趋势/随机扰动演示，信号以规则为主，非本人训练成果 |
| 项目指标呢？ | 14 节点/29 边为静态规模，性能与精度数据另测 |

## 验证与数字口径

当前确认：14 个演示路口、29 条路网边、3 类策略；上述来自源码，不是生产负载。预测服务的 confidence 包含随机生成，亦非模型评估准确率。

本次只读核对源码和前端调用，未启动后端或中间件；`backend/src` 未发现测试目录。以下待执行：

- [ ] 算法 oracle 对照、路径合法性及不可达情况。
- [ ] 不完整批次、过期数据、模拟回退的 API 标识。
- [ ] MockMvc 参数校验、用户身份、历史访问范围。
- [ ] 保存成功/日志失败及重复提交的状态核对。
- [ ] 在固定 JDK、数据库规模、并发与时长下记录 P50/P95、错误率和数据库耗时。

没有这些结果时，简历写功能范围和联调工作即可，不填并发提升、碳排下降或生产 QPS。

## 源码与来源

核对版本：`ac39f2c7fcadb302ca1bb5670b396d6466f8e6d4`。

- [路网定义](https://github.com/griffith1st/big-data-based-intelligent-traffic-management-system/blob/ac39f2c7fcadb302ca1bb5670b396d6466f8e6d4/backend/src/main/java/com/itms/common/TrafficNetwork.java)。
- [路线 Controller](https://github.com/griffith1st/big-data-based-intelligent-traffic-management-system/blob/ac39f2c7fcadb302ca1bb5670b396d6466f8e6d4/backend/src/main/java/com/itms/controller/RoutePlanController.java)。
- [路线 Service](https://github.com/griffith1st/big-data-based-intelligent-traffic-management-system/blob/ac39f2c7fcadb302ca1bb5670b396d6466f8e6d4/backend/src/main/java/com/itms/service/impl/RoutePlanServiceImpl.java)。
- [交通数据 Repository](https://github.com/griffith1st/big-data-based-intelligent-traffic-management-system/blob/ac39f2c7fcadb302ca1bb5670b396d6466f8e6d4/backend/src/main/java/com/itms/repository/TrafficDataRepository.java)。
- [前端规划页面](https://github.com/griffith1st/big-data-based-intelligent-traffic-management-system/blob/ac39f2c7fcadb302ca1bb5670b396d6466f8e6d4/frontend/src/pages/RoutePlanning.tsx)。

返回：[三项目职责划分](../JavaGuide第一阶段-三项目职责划分.md) · [项目模块](../README.md)。
