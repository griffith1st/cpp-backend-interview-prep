# ITMS 当前工作区核查

核查日期：2026-09-15。仅静态阅读简历职责相关调用链；未启动服务、未执行接口或 Redis 实验，以下不构成运行通过或个人贡献证明。

- 源码根目录：`E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd`。
- Git HEAD：`261f40db73d6bcf0a6206abcd4903143d2c0aed3`。
- 远程：[Gitee 项目](https://gitee.com/oxw123/big-data-based-intelligent-traffic-management-system.git)。
- 工作区为 dirty：已修改 SecurityConfig、AuthController、AuthService、AuthServiceImpl、TrafficDataServiceImpl、application.yml、frontend/Dockerfile；RedisAuthService 接口/实现、Redis 教学文档及 docs 为未跟踪内容。故 HEAD 不能单独复现当前 Redis 功能。
- 未读取、复制任何凭证值到学习文档；配置只引用非敏感键及行号。

## 证据层级与模板

“简历自述”用于确定题目与个人职责表达；“当前静态代码”用于确定现有行为；“通用原理”解释实现条件与风险；“改进设想”必须明说尚未实现。旧资料中的测试结论不自动继承为本次结果。

- 简历原文：同目录上级 `简历项目原文.txt`。
- 问题结构：[interview-question-resume-system.st](/E:/BaiduNetdiskDownload/Anything/interview-guide/app/src/main/resources/prompts/interview-question-resume-system.st:1)，采用简历锚定及“使用经验 → 原理 → 边界/优化”递进。
- 答题结构：[复盘与答题模板.md](/E:/BaiduNetdiskDownload/Anything/cpp-backend-interview-prep/00-学习路线/复盘与答题模板.md:1)，采用定义、机制、取舍、例子、验证。
- 历史边界：[项目边界-RMDB-ITMS-最终版.md](/E:/BaiduNetdiskDownload/Anything/cpp-backend-interview-prep/07-项目与工程/项目边界-RMDB-ITMS-最终版.md:1)，仅用来定位线索，事实重新阅读当前代码。

## 已确认的高风险口述边界

| 主题 | 当前证据 | 面试必须保留的限制 |
| --- | --- | --- |
| 黑名单 | RedisAuthServiceImpl.java:35、40、70：EXISTS；SHA-256 Token Key；SET 带剩余毫秒 TTL | 不是 JWT 内容被删除；黑名单丢失可能恢复尚未到期 Token 的可用性 |
| 验证顺序 | SecurityConfig.java:82：validateToken 短路后查黑名单 | 放行列表不等于跳过过滤器；权限集合是空列表，不能说已实现角色授权 |
| 登出异常 | RedisAuthServiceImpl.java:44、50：解析和 Redis SET 在同一 RuntimeException catch 中 | Redis SET 错误可能被吞；过滤器查询 Redis 的异常没有相同 catch，不能保证所有请求都返回“登出成功” |
| 失败计数 | AuthServiceImpl.java:31、40、42、48：仅已存在且启用账户的密码错误路径计数 | ≥5 只换提示，没有登录前阈值拒绝；正确密码仍可继续 |
| 计数 TTL | RedisAuthServiceImpl.java:58、60：INCR 后仅 count=1 调用 EXPIRE | 两条命令非原子；后续失败不刷新 TTL；成功登录清除 |
| 缓存 | TrafficDataServiceImpl.java:30、35、113、236：两个 JSON String Key；5 秒；Cache-Aside | 空列表可命中；读/反序列化失败回源；未实现互斥回源 |
| 失效 | TrafficDataServiceImpl.java:173、182、254：保存、告警、删除两个 Key；批量逐条 | 告警异常可能阻断删除；缓存操作与数据库不是同一原子事务 |
| 事务 | TrafficDataServiceImpl.java:21、173、182 无类/方法 @Transactional；相关消费、模拟器调用点也未见外层事务 | Repository 的 save 有 Spring Data JPA 默认事务语义；不能把任意 save 返回等同于任意外层事务已提交；加事务后要考虑提交后失效 |
| 两层缓存 | TrafficDataServiceImpl.java:113、119、168：汇总可从实时缓存构建，再单独设置 TTL | 5 秒是单 Key 设置后的寿命，不是端到端最大陈旧时间 |
| 并发旧值回填 | TrafficDataServiceImpl.java:35、42、65 与 173、177 的读写序列 | 静态可构造竞态，未声称已运行复现 |
| Redis 故障 | TrafficDataServiceImpl.java:236、246、254 均 catch；RedisAuthServiceImpl.java:35、56、66 未 catch | 业务缓存可回库，不代表入口 JWT 过滤器在 Redis 宕机时可通过 |
| Compose | docker-compose.yml:10、39、51、61、79、111 | 五个主要组件另加 ZooKeeper，共六个启用服务；注释 AI 服务不计入 |
| Profile 与网络 | docker-compose.yml:94、95、98、99；application.yml:11、34、49 | 容器 localhost 指自己；prod 是激活名，不代表一定存在 application-prod.yml |
| 异常联调 | GlobalExceptionHandler.java:16、30；frontend/src/services/api.ts:36 | HTTP 状态与 Result.code 不等价；ControllerAdvice 不天然覆盖认证过滤器异常 |

## 持久化与结构校验

本文件随 T01–T24 分批落盘，项目源码保持只读。生成跨越午夜：初次核查为 2026-09-15，最终材料校验日期为 2026-09-16。

- 第一批 T01–T08 已持久化：职责、调用链、模型、REST、登录、验证顺序、黑名单、登出异常。
- 第二批 T09–T16 已持久化：真实失败计数、非原子 TTL、四类 Key、Cache-Aside、双层五秒缓存、失效入口、事务时机、旧值回填。
- 中间结构校验：16 个卡片、16 个主问题、16 个 60 秒答案；校验仅针对材料结构。
- 补充检查：当前 resources 只有 application.yml 与 application-dev.yml，没有 application-prod.yml；Compose 仍可通过环境变量激活 prod 并覆盖基础配置，不应编造 prod 文件。
- 补充检查：当前未找到 backend/src/test 目录。本次未调用 Maven，不能引用旧资料的 No tests to run 为本次测试结果。
- 前端请求边界：frontend/src/services/api.ts:8 读取构建环境变量作为 API baseURL；frontend/Dockerfile:20 构建静态文件，:41 配置 Nginx 到 backend:8080 的 /api 代理。容器运行期 environment 是否改变已构建 JS，需要检查实际构建产物，不能凭 Compose 行值保证生效。
- 第三批 T17–T24 已持久化：认证与缓存降级差异、JSON 类型、查询语义与索引、异常日志、六服务、Profile/地址、初始化就绪、联调闭环。
- 使用 [verification-before-completion 技能](/C:/Users/32259/.codex/skills/verification-before-completion/SKILL.md:1) 完成材料验证：数量、字段、引用存在性与行号边界；不将材料校验称为项目测试通过。

## 简历覆盖矩阵

| 简历内容 | 对应卡片 | 核查范围 |
| --- | --- | --- |
| 参与数据模型、服务边界 | T01、T02、T03、T15、T19 | 用户与交通数据模型、调用分层、实际查询、相关事务边界 |
| REST 与前后端联调 | T04、T18、T20、T24 | 请求头、参数默认值/优先级、响应解包、JSON 类型、错误状态 |
| 用户认证与异常处理 | T05、T06、T08、T20 | 登录顺序、JWT 生成、过滤器、登出异常、MVC Advice |
| JWT 登出黑名单、Token 摘要、剩余 TTL | T06、T07、T08、T11、T17 | 已实现算法与异常边界；不认领完整授权系统 |
| 登录失败计数 | T09、T10、T11 | 计数路径、阈值仅提示、首次 TTL 非原子、成功清除 |
| 实时交通 5 秒缓存 | T12、T13、T18 | 两个 JSON Key、命中/miss/空列表/坏 JSON、双层陈旧 |
| Cache-Aside、写库后失效 | T12、T14、T15、T16 | 写入入口、告警异常、提交时机、并发旧值回填 |
| 缓存异常回库 | T17、T24 | Service 层可回库与认证入口依赖 Redis 的差异 |
| Compose 五组件环境 | T21 | 主要五组件另含 ZooKeeper，实际六个启用服务 |
| 初始化、Profile、中间件连接 | T22、T23、T24 | 本机/容器地址、Kafka 广播地址、静态前端构建、数据卷与就绪 |
| Swagger、日志、数据库排障 | T04、T19、T20、T24 | 只提供可复现检查步骤，未编造实际运行结果 |

## 最终自检口径

- 24 张卡按 T01–T24 连续编号，P0=14、P1=10，每卡一个主问、三层带答案追问。
- 每卡 12 个字段：简历锚点、学习目标、必要概念、主问题、60秒参考答案、原理追问、边界追问、故障验证追问、小例子、常见误答、口述验收、源码依据。
- 材料本地源码/记录引用共 70 个；校验文件均存在、引用行号未越界。此校验确认可定位，不替代正文技术判断；关键调用顺序已人工对照源码。
- 当前 Service 接口、实现、HTTP Controller、Kafka 消费者、模拟器和告警 Service 的相关源文件中检索 `@Transactional` 无命中；Repository 自带事务行为在正文按 Spring Data JPA 通用原理说明。
- Git HEAD 与 dirty 文件列表在结束时再次核对，未因本任务变动。未启动 Docker、Redis、PostgreSQL，未执行 Maven 或端到端测试。
- 未提出简历范围外的交通预测训练、Kafka 内核、完整微服务架构题；Lua、锁、提交后回调均明确为改进设想。
