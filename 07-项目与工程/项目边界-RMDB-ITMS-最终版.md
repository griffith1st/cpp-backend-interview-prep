# 两项目项目边界与面试提纲

更新时间：2026-09-13
适用岗位：C++ 后端、C++ 服务端、Java 后端、数据库/存储方向
依据：当前简历、RMDB 学习底稿、ITMS-BD 本地源码、Docker Compose 配置、Redis 实现与 JavaGuide 项目深挖方法。

## 0. 先给结论

当前主简历只讲两个项目：RMDB 数据库内核实现和 ITMS-BD 智能交通管理系统。族谱项目从主简历移除，历史三项目文档保留在仓库中，仅作为旧版本记录。

推荐项目顺序：

1. RMDB：C++ 系统/数据库底层主项目。
2. ITMS-BD：Java 后端、服务集成和 Redis 实践项目。

职责表达使用三种强度：

- **主责/已完成：**可以用“我实现、我负责、我调试”开头，并能定位到文件、函数、命令和结果。
- **参与/协作：**使用“我参与、我负责联调、我协助定位”，说明交付边界，不把同事代码改成个人成果。
- **理解/范围外：**可以解释调用关系和接口契约，但不使用“我实现”。

没有贡献记录时，最有利的做法是把能拿出源码、配置、测试或本次修改证据的纵向闭环划为主责，把只看到功能存在的模块划为参与或范围外。这样既有深度，又能承受追问。

## 1. JavaGuide 七个维度如何落实

| 维度 | RMDB | ITMS-BD |
| --- | --- | --- |
| 业务背景 | 数据库课程教学系统：理解页、记录、查询、索引、事务和恢复如何协作 | 智能交通演示后端：提供用户认证、交通查询、数据保存和前后端联调能力 |
| 个人职责 | 教师框架上的题目 1-11 学生实现；重点是存储、执行、索引、事务、锁、基础恢复 | Docker Compose 联调环境与本次 Redis 模块主责；PostgreSQL 模型、REST 契约、联调和排障为参与范围 |
| 请求链路 | SQL -> Parser -> Analyze -> Planner -> Executor -> Record/Index -> BufferPool -> Disk | HTTP -> Security Filter -> Controller -> Service -> Redis/Repository -> PostgreSQL -> JSON 响应 |
| 技术选型 | 定长记录、LRU、拉取式执行器、功能型索引、no-wait、基础 WAL | StringRedisTemplate、JSON String、Cache-Aside、TTL、Token 摘要 Key、Docker Compose |
| 难点/故障 | pin/dirty 与淘汰、索引和记录一致性、冲突回滚、REDO/UNDO 边界 | JWT 撤销状态、INCR/EXPIRE 窗口、缓存失效与并发旧值回填、容器地址和 Profile |
| 项目指标 | 课程题目 1-11、支持的数据类型/执行器/机制是功能范围，不包装成生产性能 | Redis 7、AOF、TTL 5 秒、JWT 24 小时、失败计数 10 分钟窗口/5 次提示阈值；没有生产 QPS |
| 职责范围 | 框架骨架、生成解析文件、第三方库、后续维护单独列出 | 前端、Kafka 内部实现、预测/信号算法、整体产品架构和生产指标单独列出 |

## 2. RMDB 项目边界

### 2.1 业务背景

RMDB 是数据库课程项目，不是生产数据库。用户通过客户端提交 SQL，系统完成解析、语义检查、计划生成、执行、记录访问和结果输出。项目的价值在于把存储和数据库执行机制串成可运行链路。

### 2.2 可以直接认领的主责

根据本人对课程任务的确认，题目 1-11 的学生实现可以作为主责主讲。主责按功能层拆成以下七块：

1. **磁盘与缓冲池：**页读写、页身份、page table、frame、pin、dirty、LRU victim、flush 和删除页的状态变化。
2. **定长记录：**页头、bitmap、slot、RID、空闲页链表、记录插入/删除/更新和扫描跳洞。
3. **查询执行：**语义分析、计划组装、SeqScan、Projection、Insert、Update、Delete 和 BNLJ 的执行链。
4. **类型扩展：**BIGINT 的 8 字节存储、范围检查、比较、输出和索引键；DATETIME 的格式校验、可排序编码和输出。
5. **功能型索引：**单列/复合唯一性、等值/范围访问、最左前缀选择、DML 后索引同步。
6. **事务与锁：**提交、回滚、写集、锁兼容、表/记录锁接口和 no-wait 冲突中止。
7. **基础日志恢复：**日志生成、启动分析、已提交事务 REDO、活跃事务逆序 UNDO 和恢复脚本验证路径。

### 2.3 RMDB 不应认领的内容

- 教师提供的类声明、基础目录、初始框架、测试骨架和第三方依赖。
- `lex.yy.*`、`yacc.tab.*` 等 Flex/Bison 生成文件；应讲 `lex.l`、`yacc.y` 的修改。
- 完整代价优化器。`Planner::logical_optimization()` 为空，当前只有基础计划组装和索引选择。
- 完整磁盘 B+ 树。当前主要索引行为是进程内有序条目模型，打开数据库时从基表重建；分裂、合并、根调整等路径是空或简化实现。
- 完整 ARIES。当前恢复是基础物理日志、提交 REDO、活跃 UNDO；没有完整 checkpoint、CLR、脏页表和 `prev_lsn` 链。
- 没有证据的生产吞吐量、并发倍数、延迟和课程隐藏测试成绩。
- 后续 AI 修复或其他提交中的维护工作。读过修复可以说“阅读并验证过”，不能回写为最初主责。

### 2.4 RMDB 核心调用链

```text
客户端 SQL
  -> 服务端协议入口
  -> Parser：词法/语法树
  -> Analyze：表、列、类型、值和语义检查
  -> Planner：Scan/IndexScan/Join/Projection/DML 计划
  -> Portal：计划转换为执行器树
  -> Executor：迭代获取 RID 和记录
  -> Record/Index：定长记录、唯一约束、范围访问
  -> BufferPool：page table、pin、dirty、LRU
  -> DiskManager：页文件读写
  -> 结果格式化并返回客户端
```

UPDATE/DELETE 的回答顺序：定位目标记录，检查约束，保存旧值，维护记录和索引，写入事务写集和日志；COMMIT 结束事务，ABORT 逆序恢复记录、索引和锁。

### 2.5 RMDB 技术取舍

| 选择 | 当时/当前的合理解释 | 代价 |
| --- | --- | --- |
| 定长记录 + bitmap | slot 偏移直接、空槽易复用、教学不变量清晰 | 变长字段和跨页记录需要重新设计 |
| LRU + pin | 用近期访问近似工作集；pin 页面不进入可淘汰集合 | 扫描会污染缓存；全 pin 时请求失败 |
| BNLJ | 只需已有迭代器和块缓冲，不引入额外哈希结构 | 右表仍会多次扫描，块大小影响成本 |
| 简化有序索引 | 先贯通唯一约束、范围访问和 DML 同步 | 内存占用和插入移动成本高，不是页式树 |
| no-wait | 冲突立即中止，不需等待图和死锁检测 | 热点场景回滚重试多，公平性需另测 |
| 基础 REDO/UNDO | 先建立日志、启动恢复和事务回退闭环 | 崩溃交错、checkpoint、CLR 等能力缺失 |

### 2.6 RMDB 30 秒版本

> RMDB 是我的数据库课程项目。我在教师框架上独立完成题目 1-11，重点实现了页和缓冲池、定长记录、查询执行、功能型索引，以及事务锁和基础 WAL 恢复。面试中我可以展开一次 UPDATE 如何同时维护记录、索引、写集和回滚。项目定位是教学数据库，索引和恢复都采用了简化实现。

### 2.7 RMDB 3 分钟版本顺序

1. **0:00-0:25 背景与边界：**课程教学系统、教师框架、本人完成题目 1-11。
2. **0:25-1:00 查询链路：**Parser、Analyze、Planner、Executor 到记录/页。
3. **1:00-1:40 存储重点：**page table、frame、pin、dirty、LRU 和定长 slot。
4. **1:40-2:20 一次 UPDATE/ABORT：**旧值、唯一索引、写集、日志、锁、逆序回滚。
5. **2:20-2:45 技术取舍：**BNLJ、简化有序索引、no-wait、基础 REDO/UNDO。
6. **2:45-3:00 证据与限制：**给出实际命令/日志；没有新数据时不报性能数字，并主动说明不等于完整 B+ 树/ARIES。

### 2.8 RMDB 必问清单

- page 和 frame 有什么区别？page table 如何维护？
- 为什么 pin 页面不能被 LRU 淘汰？脏页何时写回？
- 记录删除后 bitmap 和空闲页链表如何变化？
- Parser、Analyze、Planner、Executor 各自保存什么？
- UPDATE 为什么要先收集 RID？失败时记录和索引怎样回滚？
- 复合唯一索引如何拼接 key？最左前缀如何选择？
- BNLJ 为什么需要左侧分块？复杂度受哪些参数影响？
- no-wait 如何避免等待环？代价是什么？
- REDO 为什么按日志顺序，UNDO 为什么逆序？
- 当前实现与完整 B+ 树、ARIES 的差别是什么？

## 3. ITMS-BD 项目边界

### 3.1 业务背景

ITMS-BD 是智能交通管理演示系统。后端提供用户认证、交通数据查询和保存等接口，前端通过 REST API 获取数据，PostgreSQL 保存业务数据，Redis 为认证撤销状态、短期计数和高频查询提供共享状态或缓存，Docker Compose 组织联调服务。

### 3.2 ITMS 主责：可直接使用“我负责”的范围

以下内容有当前工作区源码、配置和本次实现文件作为证据，面试时可以认领，但要说明是本次落地的模块：

1. **Redis 连接配置：**在 `application.yml` 增加 `spring.data.redis.host/port` 与 2 秒连接/命令超时；Compose 后端通过 `SPRING_DATA_REDIS_HOST=redis` 连接同网络服务。
2. **JWT 登出撤销：**新增 `RedisAuthService` 和实现类；对 Token 做 SHA-256，写入 `itms:auth:revoked:{hash}`，TTL 使用 JWT 剩余有效期；Security 过滤器在验签/过期检查后查询撤销 Key。
3. **登录失败计数：**密码错误路径对 `itms:auth:login-failed:{sha256(username)}` 执行 `INCR`；首次计数单独设置 10 分钟 TTL；成功登录清理计数。
4. **实时交通缓存：**`TrafficDataServiceImpl` 使用 `StringRedisTemplate` 和 `ObjectMapper` 缓存 `itms:traffic:realtime`、`itms:traffic:intersection-summary`，TTL 为 5 秒；缓存 miss 回源 PostgreSQL，保存交通数据后删除缓存。
5. **缓存异常处理：**交通缓存读/写/删失败时回退数据库或依赖短 TTL 收敛；认证黑名单查询没有同样的故障降级，需要在面试中主动说明。
6. **环境与排障：**维护 Docker Compose 联调环境，使用 Swagger、服务日志、SQL 和容器状态定位初始化、Profile、连接和接口问题。

### 3.3 ITMS 参与/协作范围

这些内容可以用“参与、协作、对齐”表达：

- PostgreSQL 数据模型、服务边界和 REST API 的梳理。
- 用户认证既有流程的阅读、Redis 撤销能力接入和接口联调。
- 交通数据查询、保存、Kafka 消费和模拟器写入链路的联调。
- 前端请求参数、响应字段、错误提示和 Swagger 契约对齐。
- Compose 中 PostgreSQL、Redis、ZooKeeper、Kafka、backend、frontend 六个服务的启动顺序和连接问题排查。

### 3.4 ITMS 范围外：不要主动认领

- React 页面、图表、地图交互和前端状态管理。
- Kafka broker 内部机制、完整生产者/消费者实现和消息可靠性指标。
- LSTM/DQN/A* 等 AI 或预测算法的训练、生产效果和线上部署。
- 真实城市路网、信号灯设备控制和生产级交通数据规模。
- Redis Stream、Redisson 分布式锁、Lua 多维限流。这些是 InterviewGuide 项目的代码能力或本教程的独立练习，当前 ITMS 不含对应业务调用。
- 生产 QPS、命中率、故障恢复时间和性能提升百分比。当前只有配置值和静态代码证据。

### 3.5 ITMS 请求链路

#### JWT 认证请求

```text
Authorization: Bearer <token>
  -> SecurityConfig.jwtAuthenticationFilter
  -> JwtUtil.validateToken：验签、检查过期
  -> RedisAuthService.isTokenRevoked：EXISTS 摘要 Key
  -> 未撤销才写入 SecurityContext
  -> Controller -> Service -> Repository -> PostgreSQL
```

#### 登出请求

```text
POST /api/auth/logout
  -> AuthController 读取 Authorization
  -> AuthService.logout
  -> JwtUtil.parseToken 计算剩余有效期
  -> Redis SET itms:auth:revoked:{sha256(token)} 1 PX remaining
```

#### 实时交通查询

```text
GET /api/traffic/realtime
  -> TrafficDataServiceImpl.getRealTimeData
  -> Redis GET itms:traffic:realtime
       ├─ 命中：JSON 反序列化并返回
       └─ miss：Repository 查询 PostgreSQL -> Map -> JSON SET EX 5 -> 返回
```

#### 交通数据写入

```text
HTTP /save、/batch-save、Kafka 消费、模拟器
  -> TrafficDataServiceImpl.saveTrafficData
  -> normalize -> Repository.save -> 告警 upsert
  -> DEL realtime + intersection-summary
```

### 3.6 ITMS Key 设计表

| Key | Value | TTL | 写入 | 删除/读取 |
| --- | --- | --- | --- | --- |
| `itms:auth:revoked:{sha256(token)}` | `1` | JWT 剩余有效期 | 登出 | Security 过滤器 EXISTS |
| `itms:auth:login-failed:{sha256(username)}` | 十进制计数 | 首次失败 600 秒 | 错误密码 | 成功登录 DEL |
| `itms:traffic:realtime` | 实时 Map 列表 JSON | 5 秒 | 查询 miss | 交通保存后 DEL |
| `itms:traffic:intersection-summary` | 路口聚合列表 JSON | 5 秒 | 汇总查询 miss | 交通保存后 DEL |

### 3.7 ITMS 技术选型与代价

| 选择 | 面试解释 | 代价/边界 |
| --- | --- | --- |
| StringRedisTemplate | String Key/Value 直观，摘要、数字和 JSON 易用 CLI 观察 | JSON 需要序列化；Map 的内部 Java 类型不保证完整保持 |
| Token SHA-256 Key | 不把凭证原文写进 Redis，Key 长度固定 | 摘要仍代表凭证状态，Redis 访问控制和日志脱敏仍要做好 |
| TTL=JWT 剩余期 | JWT 过期后撤销记录失去意义，自动回收 | maxmemory 淘汰可能早于 TTL，安全策略要单独评估 |
| Cache-Aside | PostgreSQL 是事实来源，缓存 miss 回源，写后删缓存 | 并发旧值可能回填；删除异常、两层缓存时间点和批次事务需处理 |
| 5 秒短 TTL | 适合演示面板的实时性要求，限制陈旧窗口 | 不是性能实测，也不保证任意链路最多陈旧五秒 |
| Compose 服务发现 | 容器内使用服务名 `redis`，宿主机使用 `localhost` | Profile、端口映射和健康状态不一致会导致启动失败 |

### 3.8 ITMS 当前缺口：必须主动说清

1. **失败次数还没有真正封禁：**达到 5 次只改变提示，正确密码仍可登录；完整封禁需要在登录前读取计数并在阈值处拒绝。
2. **INCR 与 EXPIRE 不是一个原子组合：**首次 INCR 成功后进程中断，Key 可能没有 TTL；可用 Lua 合并。
3. **黑名单写入异常被吞：**`revokeToken` 的 RuntimeException 捕获范围包含 Redis SET；过滤器的 EXISTS 路径又没有统一降级。
4. **缓存并发竞态：**读旧值、并发更新删除、旧读回填可能让旧 JSON 再次出现；可加版本号、互斥回源或提交后失效。
5. **缓存与写库没有整体事务：**告警写入抛错可能影响后续删除；批量保存逐条处理。
6. **Compose 实际有六个服务：**PostgreSQL、Redis、ZooKeeper、Kafka、backend、frontend。简历中的“五服务”应改为“六服务”，或写“多服务联调环境”。
7. **Redis 运行时检查待补：**当前 `mvn clean test` 只有 `No tests to run`；Docker 引擎未启动，Redis 40 项脚本没有产生运行结果。

### 3.9 ITMS 30 秒版本

> ITMS-BD 是我的 Java 后端与服务集成项目。我参与 PostgreSQL 数据模型、REST 契约和前后端联调，负责 Docker Compose 多服务环境排障，并补充了 Redis 认证与缓存模块：用 Token 摘要和剩余 TTL 实现 JWT 登出撤销，用 INCR 记录登录失败次数，用 5 秒 Cache-Aside 缓存实时交通查询。这里我可以继续展开缓存失效竞态和 Redis 故障边界。

### 3.10 ITMS 3 分钟版本顺序

1. **0:00-0:30 业务：**交通查询、认证、数据保存和演示联调。
2. **0:30-1:00 个人职责：**Redis 模块和 Compose 排障主责；模型、契约和联调参与；前端、Kafka/预测模块范围外。
3. **1:00-1:40 认证链路：**验签/过期 -> SHA-256 Key -> Redis EXISTS -> SecurityContext；登出按剩余 TTL 写撤销 Key。
4. **1:40-2:15 缓存链路：**实时/汇总两个 Key，JSON String，miss 回 PostgreSQL，保存后删除，TTL 5 秒。
5. **2:15-2:40 选型与代价：**StringRedisTemplate、Cache-Aside、TTL；并发旧值回填、删除异常和故障策略。
6. **2:40-3:00 证据与缺口：**列出文件和配置；承认失败计数只记录未封禁，测试环境尚未跑 Redis 运行脚本。

### 3.11 ITMS 必问清单

- Redis 在 ITMS 里保存的四类 Key 分别是什么？哪些是缓存，哪些是安全状态？
- 为什么黑名单使用 Token 摘要，TTL 为什么取 JWT 剩余时间？
- 登出后过滤器如何阻断原 Token？公开的 `/api/auth/**` 是否仍可访问？
- `INCR` 与 `EXPIRE` 分两条命令有什么窗口？怎样用 Lua 修复？
- 你说“失败五次限制”，正确密码在第五次后能否登录？当前代码的真实答案是什么？
- 实时缓存 miss、命中、Redis 读异常、JSON 反序列化异常分别走哪条路径？
- 交通保存后为什么删除两个 Key？Kafka、模拟器和批量保存是否都能走到失效？
- 为什么五秒 TTL 不等于系统最多陈旧五秒？两层缓存有什么不同时间点？
- Docker 容器内为什么使用 `redis`，宿主机为什么使用 `localhost`？
- ITMS 中是否使用了 Redis Stream、Redisson 锁或 Lua 多维限流？

## 4. 两个项目的统一证据卡

### 4.1 面试前准备四类证据

每个主责模块准备一条：

1. **代码证据：**文件、类、函数、关键分支。
2. **运行证据：**命令、输入、输出、环境、日期。
3. **边界证据：**空值、并发、异常、回滚、过期、重启。
4. **取舍证据：**为什么用当前方案，代价是什么，下一步怎样改。

数字写法固定为：

```text
数字 + 来源 + 环境 + 数据量/并发模型 + 测试时长 + 限制
```

没有来源就写配置值、静态规模或“待测”，不要写生产指标。Redis 的 5 秒、600 秒、24 小时和 Redis 7 是配置/代码事实，不是性能指标。

### 4.2 面试边界三句话

- “这部分是我主责，我可以定位到文件、函数和验证命令。”
- “这部分是合作模块，我参与接口对齐和联调，代码归属不把整个模块算作个人实现。”
- “这个能力在 InterviewGuide 或独立实验中存在，当前 ITMS 没有对应业务调用。”

### 4.3 最容易被追穿的表述

| 容易被追穿 | 改成 |
| --- | --- |
| 我实现了整个 ITMS | 我负责 Redis 模块和 Compose 联调，参与数据模型与接口梳理 |
| Redis 做了登录限流 | 当前实现记录密码失败次数并改变提示，完整封禁尚待补齐 |
| Redis 缓存保证五秒一致 | 交通查询使用五秒 TTL，写入后删除；并发旧值回填和删除失败仍需治理 |
| 使用 Redis Stream 异步处理交通数据 | ITMS 当前没有 Stream 业务调用；Stream 是 InterviewGuide 项目能力 |
| Docker Compose 五服务 | Compose 文件实际包含 PostgreSQL、Redis、ZooKeeper、Kafka、backend、frontend 六个服务 |
| RMDB 实现了完整 B+ 树和 ARIES | RMDB 当前是功能型简化索引和基础 REDO/UNDO 恢复 |
| 项目 QPS 提升了很多 | 给出可复现实验；没有测试记录就不报提升数字 |

## 5. 复习与模拟面试顺序

### 第 1 次：RMDB 存储

闭卷画 page/frame/page table/LRU/pin/dirty；再解释一个脏页淘汰和记录删除。

### 第 2 次：RMDB 查询与事务

从 SELECT 和 UPDATE 追到 Executor；再追问唯一索引冲突、写集、no-wait 和 WAL。

### 第 3 次：ITMS Redis 认证

手推登录、登出、过滤器；用 Redis CLI 查看摘要 Key 和 PTTL；解释失败计数的真实缺口。

### 第 4 次：ITMS Redis 缓存

手推 cache hit/miss、PostgreSQL 回源、JSON 反序列化、写后删除和并发旧值回填。

### 第 5 次：混合压力面试

面试官从简历中的 Java、Redis、PostgreSQL、Docker Compose、C++、WAL 任意一个词切换追问；每次回答必须先说当前实现，再说限制和改进。

## 6. 最终简历项目建议稿

### RMDB 数据库内核实现 | C++ 查询执行与存储系统

技术栈：C++17、CMake、GoogleTest、Linux。

- 基于 RMDB 教学框架独立完成题目 1-11，打通磁盘页、缓冲池、定长记录、SQL 解析、语义分析、计划生成与执行器链路。
- 实现 BIGINT/DATETIME、唯一单列/多列索引、聚合、排序、LIMIT 与 BNLJ；支持 IndexScanExecutor，并维护插入、更新、删除后的索引一致性。
- 实现事务提交/回滚、表级锁与 no-wait 并发控制、WAL 物理日志 REDO/UNDO；通过单测、并发脚本和恢复脚本验证关键路径。

### ITMS-BD 智能交通管理系统 | Java 后端与系统集成实践

技术栈：Java 17、Spring Boot 3.2、PostgreSQL、Redis、Kafka、Docker Compose。

- 参与 PostgreSQL 数据模型、服务边界与 REST API 梳理，完成用户认证、日志异常处理和前后端联调范围整理。
- 负责 Docker Compose 多服务联调环境搭建与排障，接入 PostgreSQL、Redis、ZooKeeper、Kafka、backend 和 frontend，定位初始化、Profile 与中间件连接问题。
- 负责 Redis 模块落地：实现 JWT 登出黑名单、登录失败计数和实时交通查询 5 秒缓存；采用 Token 摘要、剩余 TTL、Cache-Aside 和写库后失效控制状态生命周期与缓存陈旧度。

最后一条是本次 Redis 模块的建议表述；如果面试官追问，必须主动说明失败计数当前是记录和提示，不是完整封禁，且 Redis 运行时集成测试仍需补齐。

## 7. OneNote 使用方法

复制本文件同目录的 `OneNote-项目边界与面试提纲.txt`，每天只填“代码证据、运行证据、边界证据、取舍证据”四栏。先录 30 秒版本，再录 3 分钟版本；录音中出现“整个系统、全部负责、性能提升、保证一致性”等词时，回到本页检查是否有对应证据。

## 8. 来源和版本记录

- ITMS-BD 本地工作区：`E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd`。
- ITMS Compose：`docker-compose.yml`，Redis 7 Alpine、AOF、redis_data 卷；实际 Compose 服务共六个。
- ITMS Redis 代码：`backend/src/main/java/com/itms/service/RedisAuthService.java`、`RedisAuthServiceImpl.java`、`AuthServiceImpl.java`、`SecurityConfig.java`、`TrafficDataServiceImpl.java`。
- ITMS Redis 教程：本地项目中的 `Redis实现与面试教学.md`；本仓库提供可独立运行的 [Redis 7 教学实验](../docs/redis-lab/README.md)。
- RMDB 项目底稿：本仓库 `07-项目与工程/项目底稿/RMDB-独立课程实现.md`。
- JavaGuide 方法：项目背景、个人职责、请求链路、技术选型、难点故障、项目指标、职责范围；每个项目准备 30 秒和 3 分钟版本。
- 本文与 OneNote 文本属于面试准备材料；不替代原始贡献记录，也不把文档中的练习结果当作项目运行结果。
