# ITMS-BD：按知识点学习的面试问答

适用当前简历的 Java 后端与系统集成职责。共 24 张卡：14 张 P0 为当天必须脱稿回答，10 张 P1 用于追问与排障。按 T01→T24 学习；每卡先读概念，再遮住答案作答，最后做手推。每张卡都可以沿“当前实现 → 原理 → 限制 → 验证”继续追问。

**事实标记：** 【简历自述】决定职责口径；【当前静态代码】说明本地工作区行为；【通用原理】用于解释；【改进设想】尚未实现。源码存在不证明个人贡献，本材料没有运行服务或性能测试。全部依据见 [ITMS 核查记录](/E:/BaiduNetdiskDownload/Anything/output/双项目一天面试学习/evidence/itms核查.md:1)。代码版本为 HEAD `261f40db73d6bcf0a6206abcd4903143d2c0aed3` 加当前未提交修改。

## T01 P0 项目边界与一分钟介绍

**简历锚点：** “Java 后端与系统集成实践”“参与模型、服务边界与 REST API 梳理”。

**学习目标：** 能讲清问题、个人范围和一个可展开的技术闭环。

**必要概念：** 业务边界是系统解决什么问题；职责边界是本人交付什么。了解某模块接口，不代表实现其算法。这里的“服务”可以是 Java 业务层对象，也可以是 Compose 进程，不能直接推导为微服务架构。

**主问题：** 请介绍智能交通项目，你具体负责什么？

**60秒参考答案：** 【简历自述】ITMS-BD 是交通管理演示系统，我参与 PostgreSQL 模型、REST 契约和联调范围整理，负责本地 Compose 环境与 Redis 认证、缓存能力。【当前静态代码】能展开三条链路：JWT 登出后写摘要黑名单；密码错误记录短期次数；实时交通查询走 5 秒 Cache-Aside。最值得讨论的是安全状态与普通缓存的故障策略不同，以及写后删除仍存在旧值回填窗口。我不把前端页面、交通预测算法或 Kafka 内核认领为个人实现，也没有生产吞吐指标。

**追问1·原理：** 为什么同时用 PostgreSQL 和 Redis？** 答：** 前者保存业务事实，后者保存可重建的查询结果及短期认证状态；两种 Redis 数据的丢失后果不同。

**追问2·边界：** 你能讲整个交通预测算法吗？** 答：** 我的简历职责是接口、集成和 Redis 调用链；能说明如何接入和排障，不能把未负责的训练或算法效果说成成果。

**追问3·故障验证：** 如何证明你确实理解项目？** 答：** 选一次带 Token 的实时查询，定位过滤器、Controller、缓存、Repository，再给出一个失败分支；代码依据与实际运行记录分别出示。

**小例子或手推：** 用三个动词复述：“认证校验 → 查询缓存 → miss 回库”。任选一环停住，解释输入、输出和异常。

**常见误答：** “我独立做了整个智慧交通平台”；“配置 5 秒所以延迟降低 80%”。

**口述验收：** 60 秒内说明两项主责、一项参与、一项范围外，且给出一个真实限制。

**源码依据：** [请求入口](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/controller/TrafficDataController.java:28)、[认证状态](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:25)。

## T02 P0 一次 HTTP 请求与分层职责

**简历锚点：** “服务边界与 REST API 梳理”“用户认证与前后端联调”。

**学习目标：** 能从浏览器追到数据库，判断问题属于哪一层。

**必要概念：** 过滤器先于 MVC Controller；Controller 负责 HTTP 参数与响应；Service 编排业务与缓存；Repository 访问持久化数据；DTO 是接口数据对象，Entity 是数据库映射。依赖注入把这些对象连接起来，不等于每层各有独立进程。定位错误时先确认请求是否真正到达目标层，再分析该层代码。

**主问题：** GET `/api/traffic/realtime` 在后端怎样流转？

**60秒参考答案：** 【当前静态代码】前端请求拦截器从本地存储读取 Token，添加 Bearer 头。Security 过滤器验证 JWT，再检查 Redis 撤销 Key，成功才写认证上下文。Controller 调 Service，Service 先读实时缓存；命中返回，未命中调用 Repository 获取每个路口方向的最新数据，组装 Map、写 JSON 缓存，最后由 Result 包装响应。这个链路让我能把网络、认证、业务、缓存和数据库错误分开定位，而不只看页面“请求失败”。

**追问1·原理：** 为什么缓存放 Service？** 答：** 缓存与查询、写后失效属于业务访问策略；HTTP 和 Kafka 等入口可复用 Service，避免每个入口各写一套失效逻辑。

**追问2·边界：** Controller 没执行就失败，能否先查 SQL？** 答：** 应先查网络及过滤器；只有证据显示到达 Repository，SQL 才是当前优先排查点。

**追问3·故障验证：** 怎样判断 miss 是否回库？** 答：** 在独立测试环境记录同一请求的入口、缓存分支和 SQL 调用次数；重复请求比较分支，不用仅凭响应更快推断命中。

**小例子或手推：** 无 Token → 受保护接口不能建立认证；有效 Token 且 cache hit → Controller/Service 仍执行，但该实时查询不走 Repository。

**常见误答：** “JWT 在 Controller 里校验”；“有 Redis 就不用数据库”；“Service 类就是微服务”。

**口述验收：** 闭卷画出六个节点，并在图上标出认证拒绝与缓存 miss 两个分叉。

**源码依据：** [Security 过滤器](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/config/SecurityConfig.java:71)、[实时 Service](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:35)。

## T03 P0 PostgreSQL 数据模型与约束

**简历锚点：** “参与 PostgreSQL 数据模型梳理”。

**学习目标：** 能解释自己接触的数据实体、约束和查询需求，不泛讲全库。

**必要概念：** 主键唯一标识一行；业务标识用于业务定位；NOT NULL 防止缺少必需值；唯一约束由数据库处理并发冲突；索引加速部分访问路径且增加写入成本。JPA 注解与初始化 SQL 都是模型线索，最终运行库结构仍需实查。

**主问题：** 你参与的数据模型有哪些关键点？

**60秒参考答案：** 【当前静态代码】我重点解释用户与交通记录。用户以自增 id 为主键，username 非空且唯一，enabled 表示启用状态。交通数据以 id 标识记录，含路口、方向、记录时间、车流、速度、经纬度等；实时查询按路口和方向找最新时间，历史查询按路口和时间筛选。实体声明了路口与时间联合索引及时间索引。【简历自述】我的范围是梳理字段、约束和接口所需数据，不把所有表设计认领为个人工作。

**追问1·原理：** 为什么不能只用路口 id 作主键？** 答：** 同一路口有多个方向和多个时间点，路口 id 会重复；记录 id 与业务查询维度要分开。

**追问2·边界：** 路口、方向、时间一定唯一吗？** 答：** 当前可见实体和初始化 SQL 没有这个组合唯一约束，不能据“最新一条”业务期待宣称数据库保证唯一。

**追问3·故障验证：** 保存报空值约束错误怎么查？** 答：** 对照请求 JSON、normalize 默认补充、Entity 的 nullable 和实际表定义；定位缺失字段后再看是否应由入口校验或业务补全。

**小例子或手推：** 路口 A 北向在 10:00、10:05 各有记录，A 南向也有 10:05 记录：三行有三个主键，实时视图应覆盖北向最新与南向最新。

**常见误答：** “有 JPA 就不用关注 SQL 约束”；“索引自动保证所有业务字段唯一”；“我设计了全部交通算法表”。

**口述验收：** 说出主键与查询维度的差别、两个非空字段、一项目前不存在的唯一保证。

**源码依据：** [TrafficData 映射与索引](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/entity/TrafficData.java:19)、[用户约束](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/entity/User.java:22)、[初始化表](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/database/init.sql:17)。

## T04 P0 REST 契约与前后端联调

**简历锚点：** “REST API 梳理”“结合 Swagger 定位集成问题”。

**学习目标：** 把接口契约说到可复现输入和可判定输出。

**必要概念：** 契约包括路径、方法、请求头、参数位置、字段类型、默认值、响应结构、错误状态。HTTP 状态码和 JSON 的业务 code 是不同层；Swagger 描述接口不能代替运行验证。GET 通常表达读取意图，但必须检查当前实现是否有额外副作用。

**主问题：** 你怎样对齐一个交通查询接口？

**60秒参考答案：** 【当前静态代码】以 `/api/traffic/history` 为例，必须给 intersectionId，minutes 和 limit 可选；只要 limit 不为空就优先走条数分支，否则 minutes 默认 60。返回统一的 code、message、data。前端 Axios 响应拦截器已取出 response.data，因此调用方拿到的是这层业务包装。联调时我先用 Swagger 或独立请求固定输入，再对比浏览器的 URL、Bearer 头与 JSON，最后对照 Service 和 SQL 判断差异。

**追问1·原理：** 为什么要明确参数优先级？** 答：** 前端可能同时传 minutes 和 limit；服务端若没有统一解释，会出现“查一小时”实际按近两天取条数的误解。

**追问2·边界：** HTTP 200 就代表业务成功吗？** 答：** 不能一概而论；要看业务 code。反过来 Result.error 本身也不会自动设置 HTTP 状态，当前异常处理器另用 ResponseStatus 设置。

**追问3·故障验证：** Swagger 成功、浏览器失败怎么查？** 答：** 对比实际请求地址、跨域预检、请求头、序列化字段及 HTTP 状态；先复制相同请求建立基线，再检查前端如何解包响应。

**小例子或手推：** 请求 `intersectionId=A&minutes=60&limit=10`：进入 limit 分支，Service 查询近两天，再排序取最多十条；不是先过滤一小时。

**常见误答：** “REST 就是用 GET/POST”；“前端 data 为空一定是 SQL 没数据”；“GET 实现绝不写库”，忽略演示种子初始化。

**口述验收：** 能复述一条接口的六项契约，并指出一个当前默认值或分支优先级。

**源码依据：** [history 参数分支](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/controller/TrafficDataController.java:38)、[前端解包](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/frontend/src/services/api.ts:36)、[limit 实现](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:97)。

## T05 P0 登录流程与 JWT 基础

**简历锚点：** “完成用户认证范围整理”“JWT 登出黑名单”。

**学习目标：** 先理解凭证如何签发，再学习为什么需要撤销状态。

**必要概念：** JWT 由头部、载荷、签名组成，常见编码不等于加密；签名证明内容未被篡改，过期时间限制有效期。无状态认证指不依赖服务器会话逐个保存登录态；增加黑名单后仍会查询共享撤销状态。

**主问题：** 登录如何生成 JWT，客户端拿到它意味着什么？

**60秒参考答案：** 【当前静态代码】登录先按用户名查用户，检查 enabled，再比对密码；成功后清理失败计数，保存最近登录时间、写登录日志，最后签发 JWT。载荷包含 userId、username、role，subject 为用户名，并记录签发和过期时间，使用密钥签名。客户端之后用 Bearer 头提交凭证。当前密码比对是字符串 equals，不能说已经使用 BCrypt；JWT 的角色字段也不自动等于服务端已做角色授权。

**追问1·原理：** 修改载荷里的 role 能变管理员吗？** 答：** 没有签名密钥就不能为被修改的载荷生成有效签名，验签应失败；此外当前过滤器未映射角色权限，授权是另一环。

**追问2·边界：** 账户被禁用后旧 JWT 立即失效吗？** 答：** 登录时会检查 enabled，但当前每次请求的过滤器没有重新查用户状态；不能据此承诺禁用立即撤销既有 Token。

**追问3·故障验证：** 用户名密码正确却登录失败怎么查？** 答：** 沿清除 Redis 计数、更新用户、写日志、签发 Token 的顺序定位异常；正确密码只是流程中一项条件。

**小例子或手推：** 先签发到 12:00 过期的 Token，11:00 修改账户 enabled=false。仅登录检查 enabled 不能保证 11:01 的旧 Token 请求被拦截。

**常见误答：** “JWT 被加密所以客户端看不到用户信息”；“无状态意味着绝不访问 Redis”；“项目已经采用 BCrypt”。

**口述验收：** 按顺序说出登录六步，区分签名、密码哈希、认证与授权。

**源码依据：** [登录流程](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/AuthServiceImpl.java:29)、[Token 生成](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/util/JwtUtil.java:34)。

## T06 P0 认证验证顺序与权限边界

**简历锚点：** “Redis 认证能力落地”“JWT 登出黑名单”。

**学习目标：** 能准确手推有效、无效、撤销和公开接口的过滤行为。

**必要概念：** 认证证明“是谁”，授权决定“能做什么”。Java `&&` 短路意味着左边失败就不执行右边；SecurityContext 是当前请求的认证上下文。permitAll 放宽授权要求，不表示自定义过滤器不运行。

**主问题：** 为什么要先验签和检查过期，再查 Redis 黑名单？

**60秒参考答案：** 【当前静态代码】过滤器先要求 Authorization 以 Bearer 开头，再调用 validateToken；只有 JWT 解析验签成功且未过期，才查询摘要 Key 是否撤销。无效 Token 不需要访问 Redis，也不能先信任其中的用户名。未撤销时把 username 放进 SecurityContext，然后继续过滤链。当前 `/api/auth/** ` 等路径 permitAll，其余要求 authenticated；认证对象的 authorities 是空列表，所以不能把存在 role claim 说成完成了角色权限控制。

**追问1·原理：** 为什么先查黑名单再验签不好？** 答：** 无效输入也会触发远程查询、增加依赖和资源消耗；且不能把“黑名单不存在”当作凭证有效性的证明。

**追问2·边界：** 撤销 Token 访问 logout 一定被认证拒绝吗？** 答：** 该路径是公开授权路径，不建立认证不等于禁止请求；但过滤器仍执行，Redis 查询异常仍可能提前中断。

**追问3·故障验证：** 验证顺序怎样测？** 答：** 分别发送坏签名、已过期、有效未撤销、有效已撤销四类 Token，并记录 Redis 查询次数及受保护接口结果；前两类应短路不查撤销 Key。

**小例子或手推：** `validate=false && ...` → 右侧调用零次；`validate=true、revoked=true` → 不写认证上下文，再由路径授权策略决定结果。

**常见误答：** “未在黑名单就是合法 Token”；“所有接口都必须登录”；“JWT 的 role 自动赋予 Spring Security 权限”。

**口述验收：** 不用代码说清四类 Token 的分支，且不臆定未实测的 401/403 返回细节。

**源码依据：** [验证短路与上下文](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/config/SecurityConfig.java:78)、[路径授权](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/config/SecurityConfig.java:45)、[验签解析](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/util/JwtUtil.java:55)。

## T07 P0 JWT 黑名单的摘要 Key 与剩余 TTL

**简历锚点：** “使用 Token 摘要和剩余 TTL 控制黑名单生命周期”。

**学习目标：** 能写出 Key、Value、TTL，并解释每个选择。

**必要概念：** 摘要是把输入映射成固定长度值的单向计算，不是可解密密文。黑名单保存“此凭证已撤销”的服务端状态；TTL 是这个状态的寿命。SET 携带过期参数可在同一 Redis 命令里写入值与过期时间。验签证明凭证完整，查询黑名单则补充它是否已被主动撤销。

**主问题：** 为什么不把完整 JWT 存 Redis，为什么 TTL 不固定一天？

**60秒参考答案：** 【当前静态代码】登出时解析 JWT，计算 exp 减当前时间，剩余毫秒数大于零才写 `itms:auth:revoked:{SHA-256(token)}`，值为字符串 1，SET 同时带该 TTL。摘要避免凭证原文作为 Key 留在 Redis，且 SHA-256 十六进制摘要长度固定为 64 字符。Token 自身过期后已无法认证，撤销记录再保存没有意义，因此使用剩余期。它撤销的是这枚 Token，不会自动撤销同一用户其他设备上的不同 Token。

**追问1·原理：** 摘要如何支持查询？** 答：** 每次请求对同一 Token 算同一摘要，再用 EXISTS 查同一 Key，不需要还原 Token。

**追问2·边界：** TTL 到期前 Key 被淘汰会怎样？** 答：** 尚有效 JWT 可能再次通过黑名单检查，所以撤销状态不能完全按可丢弃缓存看待；内存策略与可靠性需单独评估。

**追问3·故障验证：** 怎样确认生命周期正确？** 答：** 在隔离环境用测试 Token 登出，检查摘要 Key 的 PTTL 接近 exp-now 且递减，再验证旧 Token 访问受保护接口；不在日志打印原始 Token。

**小例子或手推：** Token 在 12:00 到期、11:58 登出，TTL 约 120000ms；若 12:01 才登出，已过期，无需新增有效撤销记录。

**常见误答：** “SHA-256 加密 JWT”；“登出删除了客户端所有 Token”；“黑名单固定保存 24 小时”。

**口述验收：** 准确说出 Key、Value、毫秒计算、到期清理及多设备边界。

**源码依据：** [剩余 TTL](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:40)、[摘要生成](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:70)。

## T08 P0 登出成功提示与异常边界

**简历锚点：** “实现 JWT 登出黑名单”“日志异常处理”。

**学习目标：** 区分接口成功响应、Redis 写成功、旧凭证确实不可用。

**必要概念：** 幂等操作重复执行应保持相同业务状态；重复撤销同一 Token 通常仍是撤销。异常捕获范围决定哪些故障被当成可忽略情况；吞异常会让上层失去失败证据。过滤器和 Controller 是不同执行阶段。

**主问题：** 登出返回成功，是否一定已经撤销 Token？

**60秒参考答案：** 【当前静态代码】不能保证。AuthController 调 logout 后固定构造成功响应；Service 解析 Bearer，RedisAuthService 解析 JWT 并写黑名单。但是 catch RuntimeException 包住了 JWT 解析和 Redis SET，原本用于忽略无效或过期 Token，也可能吞掉 Redis 写失败。因此成功提示不等于撤销已持久化。还要区分入口过滤器：有效 Token 先查 Redis，若这个查询已经失败，请求可能根本到不了 Controller，不能说 Redis 宕机时所有登出都返回成功。

**追问1·原理：** 为什么忽略过期 Token 有一定合理性？** 答：** 它已失去认证价值，无需新增撤销记录；但这个理由不能用于忽略有效 Token 的存储失败。

**追问2·边界：** 怎样改才准确？** 答：** 【改进设想】收窄 JWT 异常捕获，Redis 故障单独上报并返回明确失败或可重试状态；定义重复登出的幂等语义。

**追问3·故障验证：** 如何隔离 SET 失败分支？** 答：** 测试中让撤销查询正常而 SET 抛错，观察接口与旧 Token 再访问结果；全停 Redis 会先触发过滤器失败，无法单独证明 SET 被吞。

**小例子或手推：** EXISTS 正常→Controller→SET 失败被 catch→返回成功→旧 Token 仍可能有效，这是条件化故障推演，非已发生事故。

**常见误答：** “登出成功就绝对失效”；“所有异常都统一交给 ControllerAdvice”；“直接 catch Exception 提高可靠性”。

**口述验收：** 说清两个 Redis 调用阶段，以及如何只注入目标阶段故障。

**源码依据：** [登出响应](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/controller/AuthController.java:31)、[异常范围](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:44)、[入口查询](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/config/SecurityConfig.java:82)。

## T09 P0 登录失败计数与“五次”真实行为

**简历锚点：** “实现登录失败计数”。

**学习目标：** 精确区分计数、提示、限流和账户锁定。

**必要概念：** 计数记录发生次数；限流在某窗口拒绝超量请求；锁定在某条件成立后禁止继续认证。提示文字不能替代拒绝逻辑。固定窗口从第一次事件计时，滑动窗口或每次刷新 TTL 的语义不同。

**主问题：** 连续输错五次后，正确密码还能登录吗？

**60秒参考答案：** 【当前静态代码】能继续走成功分支，因为没有在密码校验前读失败次数并拒绝。当前只在已找到且启用的用户密码错误时 INCR；次数达到五只换成“10 分钟后重试”的提示。第一次失败给 Key 设置 10 分钟 TTL，之后不刷新；成功登录删除该用户失败计数。因此简历中“失败计数”准确，“实现五次封禁”不准确。不存在的用户在查库阶段就抛异常，也不会进入当前 Redis 计数路径。

**追问1·原理：** 为什么并发计数用 INCR？** 答：** 单条 Redis INCR 是原子的，避免客户端 GET 后加一再 SET 产生丢失更新；但不代表它与 EXPIRE 的组合原子。

**追问2·边界：** 第五次发生在第一失败的第九分钟，要再等十分钟吗？** 答：** 当前 TTL 不刷新，理论上只剩约一分钟；提示中的固定“十分钟”不能代表实际剩余等待时间。

**追问3·故障验证：** 怎样证明没有强制锁定？** 答：** 用独立测试账户连续错五次，再立即提交正确密码；检查错误提示、计数 Key、成功响应和 Key 删除。这里给出验证步骤，未宣称执行结果。

**小例子或手推：** t=0 首错，TTL=600；t=300 第五错，TTL≈300；t=301 正确密码，进入 clearLoginFailures 后续成功流程。

**常见误答：** “五次后硬锁十分钟”；“所有登录失败都会计数”；“每次失败都延长十分钟”。

**口述验收：** 回答正确密码能否继续、哪些失败被计数、TTL 起点、成功后动作四点。

**源码依据：** [密码错误与阈值提示](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/AuthServiceImpl.java:31)、[计数生命周期](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:56)。

## T10 P1 INCR 与 EXPIRE 的非原子窗口

**简历锚点：** “登录失败计数”，从现有两条 Redis 命令直接延伸。

**学习目标：** 能解释单命令原子与多步骤原子的区别，并手推失败窗口。

**必要概念：** 原子性要求一组相关状态变化不可被中途状态破坏。INCR 自身不会丢并发增量，但客户端在下一条 EXPIRE 前可能断开或崩溃。管道主要减少网络往返，不会自动把业务步骤变成原子事务。命令成功与整个业务动作完成应分别判断。

**主问题：** 代码说所有 Key 都有 TTL，实际能保证吗？

**60秒参考答案：** 【当前静态代码】失败计数不能严格保证。第一次 INCR 创建 Key 并返回 1，再调用 EXPIRE 设置 600 秒；如果中间中断，Key 可能没有 TTL。后续 INCR 得到 2、3，不满足 count==1，就不会再设置 TTL。注释的意图与故障边界要分开。【改进设想】可用 Lua 在 Redis 端执行“加一、首次设置 TTL”，减少客户端中断窗口；脚本需要先校验参数，不能把 Lua 理解成任意异常都会回滚已执行命令。

**追问1·原理：** 为什么 GET→加一→SET 不行？** 答：** 两个客户端都读到 3，各写 4，实际两次失败只增加一次；INCR 解决这类丢增量问题。

**追问2·边界：** 只用 pipeline 就解决了吗？** 答：** 没有，pipeline 减少等待，不保证组合隔离；且 EXPIRE 依赖 INCR 返回是否为 1，适合在服务器端表达条件。

**追问3·故障验证：** 怎样观察残留 Key？** 答：** 在隔离 Key 上只执行第一次 INCR，故意跳过 EXPIRE；TTL 返回 -1 表示无过期，再增加一次验证当前逻辑不会补设 TTL。-2 表示 Key 不存在。

**小例子或手推：** 改进伪代码：`n=INCR(key); if n==1 then EXPIRE(key,600); return n`。它是待实现的 Lua 逻辑，当前 Java 仍分两次调用。

**常见误答：** “Redis 单线程，所以任何两条命令原子”；“加 pipeline 等于事务”；“项目已经使用 Lua”。

**口述验收：** 用“INCR 成功→进程中断→无 TTL→下次 count=2”完整复述漏洞。

**源码依据：** [两次独立调用](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:58)、[首次才设 TTL](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:59)。

## T11 P1 Redis 四类 Key 与状态生命周期

**简历锚点：** “Redis 认证能力”“实时交通查询 5 秒缓存”。

**学习目标：** 能按用途解释 Redis 数据结构选择及数据丢失后果。

**必要概念：** Redis String 可以存数字文本、标记或 JSON，不一定只存普通字符串句子。TTL 控制自然过期，持久化用于重启后恢复；内存淘汰是另一机制，可能早于 TTL 删除 Key。它们不能相互替代。

**主问题：** 项目里 Redis 到底保存什么？

**60秒参考答案：** 【当前静态代码】有四类 Key：撤销 Token 的摘要 Key，值 1，TTL 为 Token 剩余期；用户名摘要对应的失败计数，首次设 600 秒；实时交通 JSON；路口汇总 JSON，后两者都是 5 秒。选择 StringRedisTemplate 是因为标记、数字和 JSON 都便于直接观察。Compose 使用 Redis 7、启用 AOF 并挂载数据卷；这只是持久化配置，不能据此宣称安全状态永不丢失或做过重启恢复验证。

**追问1·原理：** 为什么黑名单和交通缓存要分开理解？** 答：** 交通缓存丢失可回库重建；黑名单丢失可能让仍有效的旧 JWT 重新可用，失败计数丢失会重置记录。

**追问2·边界：** 用户名摘要是否代表登录查询也忽略大小写？** 答：** 失败 Key 先 trim、转小写，但登录查库直接用请求用户名；两处归一化语义未必一致，不能假定整个账户系统大小写不敏感。

**追问3·故障验证：** 重启后如何验证？** 答：** 分别预置四类测试 Key，记录 TTL，按测试环境正常重启 Redis 再检查存在性和剩余 TTL；必须报告实际持久化配置和操作过程。

**小例子或手推：** 同一用户名的 `Alice` 与 ` alice ` 会计算同一失败 Key；但能否查到同一数据库用户，要看查库条件和数据库比较行为。

**常见误答：** “四类都只是缓存，清空无影响”；“AOF 保证任何故障零丢失”；“TTL 等于数据持久化”。

**口述验收：** 不看资料列全四类 Key、值、TTL、删除条件及数据丢失影响。

**源码依据：** [认证 Key 与归一化](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:27)、[缓存 Key](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:30)、[Redis 持久化配置](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:39)。

## T12 P0 Cache-Aside 的命中、回源与回填

**简历锚点：** “实时交通查询 5 秒缓存”“Cache-Aside”。

**学习目标：** 能逐分支手推缓存访问，而不是只背模式名称。

**必要概念：** Cache-Aside 由应用显式读写缓存：先查缓存，miss 查事实数据库，再回填缓存。缓存命中不等于数据最新；缓存穿透是频繁请求不存在数据，缓存击穿是热点 Key 失效时并发回源，两者含义不同。

**主问题：** 实时交通查询的缓存如何实现？

**60秒参考答案：** 【当前静态代码】getRealTimeData 先 GET 实时 Key 并反序列化；只要结果不是 null 就返回，包括空列表。miss 或缓存读取异常返回 null 后，先检查演示种子数据，再调用 Repository 查询，组装结果 Map，JSON 序列化后 SET 带 5 秒 TTL，最后返回数据库结果。读缓存异常走回源，写缓存异常被忽略，所以缓存保存失败不会直接丢掉已得到的业务结果。这里没有实现分布式锁或互斥回源。

**追问1·原理：** 为什么以 null 区分 miss？** 答：** 空列表也可能是一次有效查询结果，应允许短期缓存；如果把空列表当 miss，会重复回源。

**追问2·边界：** 同一热点 Key 刚过期，一百个请求怎样？** 答：** 当前多个请求可能同时 miss 并查询 PostgreSQL；5 秒 TTL 不会自动防止瞬时回源压力，互斥合并请求属于改进。

**追问3·故障验证：** 怎么分别验证 hit、miss、坏 JSON？** 答：** 在隔离测试环境让 Key 不存在、保存合法 JSON、保存无效 JSON，分别观察 Repository 调用；坏 JSON 应走回源，不把这一步当数据本身不存在。

**小例子或手推：** 第一次 miss→查库→SET；第二次在 TTL 内读到 `[]`→直接返回空列表；过期后再回源。没有实测不能报命中率。

**常见误答：** “Redis 自动与数据库同步”；“5 秒内一定读到最新值”；“我们用了 Redisson 防击穿”。

**口述验收：** 用四个分支说明不存在、合法空列表、坏 JSON、SET 失败分别怎样返回。

**源码依据：** [实时读取流程](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:35)、[缓存辅助方法](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:236)、[种子数据](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:190)。

## T13 P0 五秒 TTL 与两层缓存的陈旧时间

**简历锚点：** “实时交通查询 5 秒缓存”。

**学习目标：** 区分 Key 存活时间、数据年龄和业务端到端新鲜度。

**必要概念：** TTL 从某次 SET 开始计算；数据年龄从源数据产生或读取时算起。由缓存 A 生成缓存 B，会给旧数据再设置一段寿命。源数据延迟、回源耗时、并发回填也会影响结果年龄。

**主问题：** 能否保证页面最多看到五秒前的数据？

**60秒参考答案：** 【当前静态代码】不能这样保证。5 秒是实时 Key 与汇总 Key 各自的 TTL。汇总 miss 时调用 getRealTimeData，可能拿到已经缓存接近五秒的旧实时数据，再给汇总结果设置新的五秒 TTL。因此即便不考虑其他问题，两个时间点不同也可能放大数据年龄；还要考虑源数据采集延迟和旧查询稍后回填。面试中应说“采用短 TTL 和写后失效减少陈旧”，不能说已经保证五秒强一致。

**追问1·原理：** 为什么两个 Key 都五秒仍可能超过五秒？** 答：** 它们分别从写入时计时，汇总 SET 并不知道输入数据已存活多久，没有继承输入的剩余寿命。

**追问2·边界：** 那能保证最多十秒吗？** 答：** 也不能直接保证；这个近十秒仅是无额外延迟、无竞态时的示例，整个链路还有数据生成、请求耗时和并发时序。

**追问3·故障验证：** 如何定位是缓存旧还是数据源旧？** 答：** 同时观察数据库 record_time、缓存内容 timestamp、Key PTTL 和请求时间；TTL 还长不代表其中数据刚生成。

**小例子或手推：** t=0 实时 Key 写入旧快照；t=4.9 汇总 miss，读实时快照后 SET 五秒；无主动失效时汇总可到 t≈9.9 才自然过期。

**常见误答：** “TTL=5 所有数据年龄≤5”；“给每层都设五秒就不会叠加”；“配置值就是实测延迟”。

**口述验收：** 画两个独立 TTL 时间轴，解释为何“近十秒例子”也不是系统上界。

**源码依据：** [五秒常量](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:32)、[汇总读取实时结果](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:113)、[汇总独立回填](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:168)。

## T14 P0 写库后删除缓存与入口覆盖

**简历锚点：** “交通缓存采用写库后失效”。

**学习目标：** 能解释删除的原因、执行顺序和没有覆盖的路径。

**必要概念：** 写后删除让下次读取从事实库重建结果；直接更新聚合缓存要求重算所有受影响字段，并处理多个写者覆盖。多个入口应复用同一业务写方法，才能共享校验和失效逻辑，但数据库直改会绕过它。

**主问题：** 为什么保存交通数据后删除两个 Key？

**60秒参考答案：** 【当前静态代码】saveTrafficData 先 normalize，保存交通记录，再更新拥堵告警，最后删除实时与路口汇总两个 Key，因为一条记录会影响原始实时结果及其聚合。HTTP 保存、批量逐条保存、Kafka 消费和模拟器的常见写入都调用这个方法，失效集中维护。需要保留边界：告警操作发生在删除之前，若告警抛错，删除不会执行；ensureSeedData 的内部保存和直接 SQL 不走该失效方法，不能说所有写库路径无条件被覆盖。

**追问1·原理：** 为什么通常先写库再删？** 答：** 先删后写时，并发读可能在数据库更新前读旧值并回填；先写后删减少这种简单窗口，但仍不是强一致方案。

**追问2·边界：** 把两个 Key 一次 DEL 就解决所有一致性吗？** 答：** 一次删除只能处理当时的 Key，无法阻止已读旧值的并发请求稍后回填，也无法与 PostgreSQL 组成同一事务。

**追问3·故障验证：** 如何确认入口确实失效？** 答：** 分别通过 HTTP 单条、批量和消费 Service 的测试调用写入，检查两个 Key 及随后的查询；先追代码调用点再设计实验，不假定消息可靠性已验证。

**小例子或手推：** 路口 A 北向增加一条更晚记录，会改变该方向实时行、路口总车流与加权速度，所以两个 Key 都需要失效。

**常见误答：** “DEL 成功即强一致”；“所有 SQL 更新都自动通知 Redis”；“Kafka 入口说明我实现了完整消息可靠性”。

**口述验收：** 说出保存四步、删除两个 Key 的原因，以及告警异常和绕过 Service 两项限制。

**源码依据：** [保存与批量](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:173)、[Kafka 调用点](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficKafkaConsumer.java:24)、[模拟器调用点](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficSimulatorServiceImpl.java:147)。

## T15 P1 数据库事务、save 与失效时机

**简历锚点：** “写库后失效”“PostgreSQL 与服务边界”。

**学习目标：** 避免把 save、flush、commit 混成一件事。

**必要概念：** save 把实体交给持久化逻辑，flush 把待处理修改同步到数据库，commit 才提交事务。Spring Data JPA 的 Repository save 默认有事务；若存在外层事务通常参与外层，返回不意味着外层已经提交。Redis DEL 不会自动加入 PostgreSQL 事务。

**主问题：** 在 save 后立即删缓存，是否必定发生在事务提交后？

**60秒参考答案：** 【当前静态代码】当前 TrafficDataServiceImpl 没有类或方法级 @Transactional，相关常见调用点也未见外层事务，因此无外层事务时 Repository 的 save 调用由自身事务完成。但不能把它推广成“任何 save 返回就是业务事务已提交”：以后若 Service 加事务，DEL 可能在外层 commit 前执行，读请求会读旧库值并回填。当前交通记录、告警和缓存也没有统一原子事务，批量是逐条处理，不是全成全败。

**追问1·原理：** 为什么 saveAndFlush 也不等于提交？** 答：** flush 只是将 SQL 同步，事务仍可能回滚；其他事务是否可见还取决于隔离与提交。

**追问2·边界：** 加 @Transactional 就能让 Redis 删除一起回滚吗？** 答：** 不能默认如此；本项目没有跨 PostgreSQL/Redis 的原子事务。【改进设想】可在成功提交后执行失效，并对删除失败设计补偿。

**追问3·故障验证：** 如何验证业务部分成功？** 答：** 在测试环境让告警写抛错，检查交通表是否已有该记录、缓存是否仍在；判断时必须记录有无外层事务，不能只看接口报错。

**小例子或手推：** 未来增加外层事务：save→DEL→读请求查到未提交前旧值→旧值回填→写事务 commit。提交后失效能针对这个窗口，但仍需处理其他回填竞态。

**常见误答：** “save 就是 commit”；“加一个注解让两种数据库强一致”；“批量方法名意味着原子批量”。

**口述验收：** 明确区分当前无外层事务的情况与未来增加外层事务的情况。

**源码依据：** [当前 Service 类](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:21)、[业务操作顺序](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:173)、[Repository 类型](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/repository/TrafficDataRepository.java:18)。

## T16 P0 并发旧值回填的时间线

**简历锚点：** “Cache-Aside 与写库后失效”的直接一致性追问。

**学习目标：** 能用两个请求构造竞态，避免只说“可能有并发问题”。

**必要概念：** 竞态是结果依赖请求交错顺序。删除某一时刻的缓存，不会取消已在执行中的读请求；读请求可能拿着过时结果晚于删除写入。TTL 只能在该次旧值回填后开始限制其寿命。

**主问题：** 已经先写库再删缓存，为什么还能读到旧数据？

**60秒参考答案：** 【通用原理，锚定当前读写序列】请求 A miss 后从库读到 v1，暂停回填；请求 B 把库更新为 v2 并删除缓存；A 恢复，把手里的 v1 SET 回 Redis，于是后续查询命中旧值。当前 getRealTimeData 的回填和 saveTrafficData 的删除没有版本校验或互斥，所以存在这个可构造窗口。【改进设想】可以评估按 Key 的回源互斥、版本校验及提交后失效；应说明每种方法解决的窗口，不能声称一条延迟删除就完全强一致。

**追问1·原理：** 先删再写会更好吗？** 答：** 会出现删完但写库尚未完成时读旧值回填的简单窗口；操作顺序有价值，却不能消除所有异步交错。

**追问2·边界：** 加锁是否万事大吉？** 答：** 锁必须覆盖相关读回填与写失效，并处理超时、持有者失败和多个实例；只锁读回源可能减少击穿，却未必隔离写入。

**追问3·故障验证：** 如何稳定复现？** 答：** 在测试中用栅栏暂停 A 于查库之后、SET 之前，执行 B 的保存与删除，再释放 A；检查数据库 v2、缓存 v1。随机压测没复现不能证明不存在。

**小例子或手推：** A读v1→B提交v2→B删Key→A写v1并设五秒→C命中v1。请在纸上标出每一步“数据库值/缓存值”。

**常见误答：** “先更新再删除没有竞态”；“等五秒就等于强一致”；“Redis 单线程能串行化数据库请求”。

**口述验收：** 30 秒复现四步核心交错，并给出确定性验证方法和一项改进限制。

**源码依据：** [查询后回填](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:42)、[回填发生点](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:65)、[写后失效发生点](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:175)。

## T17 P0 缓存降级与认证不降级的区别

**简历锚点：** “缓存异常时回退 PostgreSQL”。

**学习目标：** 明确局部降级不等于整个请求在 Redis 宕机时可用。

**必要概念：** 降级是在依赖不可用时采用较弱但可接受的路径。fail-open 倾向继续放行，fail-closed 倾向拒绝；选择取决于数据是否可重建、错误放行的代价。入口认证与业务缓存即使共用 Redis，也有不同目标。

**主问题：** Redis 宕机后，实时交通接口还能返回数据库结果吗？

**60秒参考答案：** 【当前静态代码】需要分层回答。TrafficDataService 的缓存 GET、JSON 解析、SET、DEL 都捕获异常；业务方法能继续回库或返回已查到结果。但带有效 JWT 的受保护请求在进入 Service 前，会在过滤器查询黑名单；这个 EXISTS 调用没有同样的异常兜底，所以整个接口仍可能先被认证依赖故障阻断。登录失败计数与成功后的计数删除也没有同类降级。不能把简历的“缓存回库”扩展成“Redis 故障不影响系统”。

**追问1·原理：** 为什么不直接让黑名单查询失败时放行？** 答：** 查不到撤销状态不等于未撤销，直接放行会让已登出的凭证获得访问机会；安全与可用性策略必须显式决定。

**追问2·边界：** 设置 Redis timeout=2s 就保证请求两秒结束吗？** 答：** 不保证，这是连接或命令配置；一个请求可能有多个调用、重试及其他耗时，端到端延迟要实测。

**追问3·故障验证：** 怎样把两层验证分开？** 答：** 先直接测 Service 在 Redis GET 失败时能回库，再测真实带 JWT HTTP 请求在 EXISTS 失败时的行为；两类结果分别记录，不能用 Service 单测代替接口可用性。

**小例子或手推：** 有效 JWT→EXISTS 超时→未到 Controller，业务 readCache 的 catch 根本没有机会执行；这是解释“明明写了回库仍请求失败”的关键。

**常见误答：** “catch 了 Redis 异常，所以全站不受影响”；“查黑名单失败就当不存在”；“超时配置就是 SLA”。

**口述验收：** 按入口认证、业务缓存、登录计数三类说明故障行为，提出分层验证。

**源码依据：** [缓存异常分支](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:236)、[黑名单查询](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/RedisAuthServiceImpl.java:35)、[Redis 超时配置](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/resources/application.yml:49)。

## T18 P1 JSON 缓存与类型、字段契约

**简历锚点：** “实时交通查询缓存”“前后端联调”。

**学习目标：** 知道 JSON 字符串缓存为何方便，也能解释命中与回源可能出现的类型差异。

**必要概念：** 序列化把 Java 对象转为 JSON 文本，反序列化按目标类型重建对象。JSON 有数字、字符串等类型，却不完整保留 Java 的 Long、Integer、LocalDateTime 等类信息。泛型 TypeReference 保存容器结构，Map 的 Object 值仍需要谨慎处理。

**主问题：** 为什么用 StringRedisTemplate 和 JSON，怎样避免联调中的类型坑？

**60秒参考答案：** 【当前静态代码】缓存结果是 `List<Map<String,Object>>`，用 ObjectMapper 写成 JSON String，再通过 TypeReference 读取同样的容器结构。这样 Redis 里可直接观察结果，适合演示查询，但无类型 Map 的数字和时间在回源与反序列化后可能呈现不同 Java 类型，不能依赖某个具体强制转换。当前聚合使用 Number 的 intValue/doubleValue，减少部分数字类型差异；对外字段名、日期格式和数字含义仍应验证两条路径一致。

**追问1·原理：** 为什么 `TypeReference<List<Map<String,Object>>>` 仍不保证时间变回 LocalDateTime？** 答：** 内部值声明为 Object，没有指定该字段目标时间类型；解析器依据 JSON 与配置推断，缺少完整领域类型信息。

**追问2·边界：** 换成 DTO 就解决所有缓存兼容吗？** 答：** 明确字段类型有帮助，但仍要处理新增、删除、重命名和时间格式变化；缓存版本前缀或失效策略属于后续设计。

**追问3·故障验证：** 怎样验证命中和回源响应一致？** 答：** 固定数据库输入，分别让 Key 缺失和命中，比较 JSON 的字段、数值、时间格式与空值；再测试无效 JSON 是否正常回源。

**小例子或手推：** 车流 10、30，速度 40、20，加权均速=(10×40+30×20)/40=25。代码从 Number 取值，不能把缓存命中后的数字一律强转为 Long。

**常见误答：** “JSON 保留所有 Java 类型”；“有 ObjectMapper 就不需契约测试”；“平均速度简单相加除方向数”。

**口述验收：** 解释容器泛型与内部字段类型的差异，并算对加权均速。

**源码依据：** [序列化与反序列化](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:236)、[汇总加权](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:131)、[Number 转换](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:286)。

## T19 P1 PostgreSQL 最新记录、索引与查询验证

**简历锚点：** “数据模型梳理”“数据库查询定位集成问题”。

**学习目标：** 会解释实际查询条件，并用数据与执行计划验证直觉。

**必要概念：** “最新”需要先指定分组维度；相关子查询会引用外层行确定同组最大值。联合索引的列顺序影响可支持的过滤与排序。索引可能被优化器使用，是否使用和收益大小需要执行计划与数据分布证明。

**主问题：** 实时查询怎样找到每个路口方向的最新数据？

**60秒参考答案：** 【当前静态代码】Repository 查询外层交通行，要求 recordTime 等于同 intersectionId、同 direction 的最大 recordTime，再按路口和方向排序。它不是只取全表最新时间，所以不同方向的最新时间可以不同。但若同组存在相同最大时间的多行，当前条件可能返回多行，没有显式以 id 决胜。实体已有路口与时间联合索引；是否需要加入 direction，要基于实际计划评估，不能只凭字段名称报优化倍数。

**追问1·原理：** 为什么不能简单用全表 MAX(record_time)？** 答：** 不同方向更新可能不齐，全表最大时间会漏掉尚未产生该时刻数据的方向。

**追问2·边界：** history 的 limit=10 是否只从数据库拿十行？** 答：** 当前条数分支先查近两天记录，再在 Java 排序、skip；没有在这个 Repository 查询中下推数据库 LIMIT，数据量大时可能加载过多。

**追问3·故障验证：** 页面重复路口方向记录怎样查？** 答：** 按路口、方向、时间分组检查同一最大时间的重复记录，再对比 SQL 结果与缓存；需要时在测试数据上查看 EXPLAIN，不先归咎于前端重复渲染。

**小例子或手推：** A北向最新10:05有两行、A南向最新10:03有一行：该实时条件可返回三行，不能直接宣称每方向一定一行。

**常见误答：** “MAX 查询天然只返一行”；“有索引一定快”；“limit 参数已实现数据库分页”。

**口述验收：** 讲清分组维度、同时间重复边界、索引验证方式和 limit 实现位置。

**源码依据：** [实时相关子查询](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/repository/TrafficDataRepository.java:51)、[历史查询](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/repository/TrafficDataRepository.java:44)、[内存截取](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:97)。

## T20 P1 异常处理、服务日志与业务日志

**简历锚点：** “完成日志异常处理范围整理”“结合服务日志定位集成问题”。

**学习目标：** 区分技术异常、HTTP 响应、持久化业务日志的作用和覆盖范围。

**必要概念：** 服务日志通常记录执行与异常，业务日志保存某类业务事件；统一响应包装仅定义 JSON 结构，HTTP 状态由控制器或异常处理逻辑设置。MVC 的 ControllerAdvice 处理范围不能直接扩展到前置过滤器。

**主问题：** 项目怎样返回异常、记录日志？

**60秒参考答案：** 【当前静态代码】GlobalExceptionHandler 把 RuntimeException 和 IllegalArgumentException 映射为 HTTP 400 与业务 code 400；其他 Exception 返回 500。运行时异常分支主要记错误消息，一般异常分支记录堆栈。登录成功还调用 SystemLogService 写数据库业务日志；其中 username 固定为 system，真实登录用户名放在描述里，不能说已完整关联操作者。缓存辅助方法多数吞异常，没有现成的命中率和降级计数，因此排障观测仍有缺口。

**追问1·原理：** 为什么只看 message 可能不够？** 答：** 消息难以定位具体调用点，堆栈、时间、请求上下文可帮助关联；【改进设想】可补结构化异常日志和请求标识，但不宣称项目已接入链路追踪。

**追问2·边界：** 过滤器 Redis 超时会进入这个 Advice 吗？** 答：** 不能默认会；它发生在 MVC Controller 外，需要单独的认证异常处理策略和实测响应。

**追问3·故障验证：** 前端只在 401 清 Token，后端错误为 400 会怎样？** 答：** 该前端分支不会因 400 自动清 Token，仍会 reject 错误数据；要观察 HTTP 状态与业务 code，不能只看文案。

**小例子或手推：** 密码错误抛 RuntimeException→MVC Advice 返回 HTTP 400；前端 status===401 分支不执行。此处与未认证受保护请求的处理不能混为一谈。

**常见误答：** “统一异常就是所有层全部覆盖”；“数据库日志已记录每次失败登录”；“所有认证失败都返回 401”。

**口述验收：** 举出一个已有日志、一个缺少的观测点、一个不属于 Advice 的边界。

**源码依据：** [异常映射](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/common/GlobalExceptionHandler.java:16)、[业务日志字段](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/SystemLogServiceImpl.java:27)、[前端错误处理](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/frontend/src/services/api.ts:36)。

## T21 P1 Docker Compose 五组件与六服务

**简历锚点：** “本地 Docker Compose 五服务环境”“PostgreSQL、Redis、Kafka、后端和前端”。

**学习目标：** 能准确画出本地拓扑，并解释简历与配置的计数差异。

**必要概念：** Compose service 是一个运行定义；业务上说的组件可能连同辅助进程一起提供功能。image 提供预构建镜像，build 从项目 Dockerfile 构建。network 连接容器，volume 让数据不依赖容器可写层的寿命。

**主问题：** 五个服务分别是什么，为什么配置里还有 ZooKeeper？

**60秒参考答案：** 【简历自述】五个主要组件是 PostgreSQL、Redis、Kafka、backend、frontend。【当前静态代码】Compose 另外启用 ZooKeeper 供这里的 Kafka 配置使用，因此按运行服务数严格说是六个。面试口述我会主动用“多服务联调环境”或“六个服务”，避免把简历的简化计数说成配置事实。PostgreSQL 和 Redis 挂载数据卷，Kafka 依赖 ZooKeeper，backend 连接数据库和中间件，frontend 提供页面及代理；注释掉的 AI 服务不计入启动拓扑。

**追问1·原理：** 为什么不能用容器文件层替代数据库卷？** 答：** 容器重建会替换可写层；命名卷把数据库数据与容器生命周期分离，但仍不等于备份。

**追问2·边界：** 这是否证明项目采用微服务？** 答：** 不能。数据库、中间件和前后端分成容器属于部署组织；业务是否微服务要看独立业务边界与部署设计，本简历不做该主张。

**追问3·故障验证：** 怎样数真正启用服务？** 答：** 在项目目录用 `docker compose config --services` 查看解析后的服务名；再用 `docker compose ps` 看运行状态。这里仅提供命令，未把配置数当作运行成功数。

**小例子或手推：** 画“frontend→backend，backend→PostgreSQL/Redis/Kafka，Kafka→ZooKeeper”。箭头统一表示访问的目标，不表示全部响应和消息流向。

**常见误答：** “实际只有五个容器”；“注释的 AI 服务也部署了”；“六个容器等于六个业务微服务”。

**口述验收：** 列全六服务、两种持久化卷用途，主动解释计数差异。

**源码依据：** [PostgreSQL](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:10)、[ZooKeeper 与 Kafka](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:51)、[backend](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:79)、[frontend](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:111)。

## T22 P1 Profile、容器地址与 Kafka 连接排障

**简历锚点：** “排查 Profile 与中间件连接问题”。

**学习目标：** 先确定谁在连接谁、运行在哪，再判断地址和配置是否正确。

**必要概念：** localhost 指当前进程所在网络环境；容器内 localhost 指该容器。Compose 同网络容器通过 service 名访问内部端口；宿主机通过发布端口访问。Spring Profile 决定激活配置组，环境变量还可覆盖基础配置。

**主问题：** 本机能连 Redis，backend 容器却连不上，怎么查？

**60秒参考答案：** 【当前静态代码】Compose 给 backend 注入 prod Profile，并将数据库地址设为 postgres:5432、Redis 主机设为 redis、Kafka bootstrap 设为 kafka:9092。基础 yml 默认很多 localhost 地址；如果注入没生效，backend 就会错误连接自己。当前资源目录只有基础与 dev 文件，没有 prod 文件，不能凭 Profile 名称假定另有专门配置。我会从启动日志的 active profile、容器内生效地址、DNS、端口和依赖就绪逐层核对，日志中不打印凭证。

**追问1·原理：** 宿主机用 localhost:9092 能连接 bootstrap，为什么 Kafka 后续仍失败？** 答：** broker 还会返回 advertised.listeners；当前广播 kafka:9092，宿主机未必能解析 kafka，bootstrap 可达不代表返回地址可达。

**追问2·边界：** Compose 运行时改前端 API 环境变量一定有效吗？** 答：** 当前前端先构建静态 JS，再由 Nginx 提供；构建期变量可能已写入产物，不能假定运行期环境会自动改包内地址。

**追问3·故障验证：** 怎样验证地址层级？** 答：** 从发起请求的容器或宿主机检查名称解析和目标端口，再看服务协议响应；仅从宿主机测试成功不能证明容器链路成功。

**小例子或手推：** backend→redis:6379 是容器访问；宿主机→localhost:6379 是端口映射；浏览器中的 localhost 指用户机器，不是 frontend 容器。

**常见误答：** “所有地方都用 localhost”；“prod 名称保证生产配置已加载”；“Kafka 端口通就一定消费正常”。

**口述验收：** 正确回答三种 localhost，指出 Kafka 广播地址与前端构建变量两个边界。

**源码依据：** [Profile 和后端连接注入](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:94)、[Kafka 广播地址](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:72)、[前端构建阶段](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/frontend/Dockerfile:20)、[基础 Redis 地址](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/resources/application.yml:49)。

## T23 P1 初始化、健康检查与启动依赖

**简历锚点：** “环境搭建与维护”“排查初始化问题”。

**学习目标：** 区分容器启动、协议可用、数据初始化和业务接口可用。

**必要概念：** started 只说明进程已启动，不等于依赖已准备接收请求；healthcheck 是特定探测，不能覆盖所有业务。PostgreSQL 官方镜像的初始化脚本通常在空数据目录初始化时执行，已有卷不等于每次重放 SQL。

**主问题：** 修改 init.sql 后重启，为什么表或数据没有按预期变化？

**60秒参考答案：** 【当前静态代码】Compose 把 init.sql 挂到数据库初始化目录，并使用命名卷保存 PostgreSQL 数据。【通用原理】已有数据目录启动通常不会重新执行初始化脚本，因此应检查当前卷、表结构和初始化日志，不能直接认为文件修改已经迁移到数据库。项目还启用 JPA ddl-auto:update，并存在默认用户初始化及空交通表种子逻辑，排查时要区分这些不同来源。先做只读检查，再规划可回滚迁移，不通过删除数据卷来替代诊断。

**追问1·原理：** depends_on 保证中间件都就绪吗？** 答：** 当前 PostgreSQL 用 service_healthy；Redis、Kafka 用 service_started。后两者启动仍可能尚未可用，且 PostgreSQL 协议健康也不保证所有业务数据符合预期。

**追问2·边界：** 库里突然出现演示交通数据一定来自 Kafka 吗？** 答：** 不能。实时查询 miss 后 ensureSeedData 在空表时会直接写种子，模拟器也可写入；需要看数据源字段和调用日志。

**追问3·故障验证：** 启动故障的检查顺序？** 答：** 查 compose ps、依赖日志、数据库协议探测，再查表是否存在与应用 profile，最后发一个带认证的业务请求；每一步保留现象与时间，不把进程 running 当作联调通过。

**小例子或手推：** 旧卷中 users 已存在→重启 PostgreSQL→init.sql 未必再执行；JPA update 或默认用户初始化仍可能在 backend 启动时运行，需分别归因。

**常见误答：** “重启必定重新初始化数据库”；“service_started 等于 ready”；“查不到就删卷重建”。

**口述验收：** 列出三种数据初始化来源，说明 PostgreSQL 与 Redis/Kafka 的依赖条件差异。

**源码依据：** [初始化挂载](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:20)、[依赖条件](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/docker-compose.yml:84)、[JPA 配置](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/resources/application.yml:24)、[默认用户初始化入口](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/config/DefaultUserInitializer.java:25)。

## T24 P1 联调故障闭环与可复现实验

**简历锚点：** “结合 Swagger、服务日志与数据库查询定位集成问题”。

**学习目标：** 用证据定位一条真实调用链，并诚实区分验证方案与已执行结果。

**必要概念：** 故障闭环包括现象、复现输入、分层证据、最小原因假设、验证和回归。对照实验只改变一个变量；压测结果需要环境、数据量、并发、时长、指标定义，不能从配置推导性能提升。

**主问题：** 用户反馈“保存成功但页面还是旧值”，你怎样排查？

**60秒参考答案：** 【方案，非已发生事故】我先固定路口、方向、记录时间和请求时间，确认浏览器实际 HTTP 状态与业务 code。再查 PostgreSQL 是否出现目标记录、是否因 recordTime 较旧而不进入实时结果，然后看两个缓存内容和 PTTL、保存是否走到失效，以及是否存在并发旧值回填。用 Swagger 发相同查询区分前端与后端，查看日志定位告警异常或认证阻断。修正后同时验证单次读写、过期、异常和并发；没有运行记录就只给步骤，不编造“已解决线上事故”。

**追问1·原理：** 为什么先查业务查询条件再删缓存？** 答：** 新保存行若时间早于已有最新行，实时结果不变符合当前查询条件；乱删缓存可能掩盖真正的契约误解。

**追问2·边界：** 如何回答“缓存提升了多少性能”？** 答：** 目前只有实现和 5 秒配置证据，没有本次可复现性能数据；可以提出比较有缓存与绕过缓存时数据库调用数、P95 延迟和错误率的实验。

**追问3·故障验证：** 给出最小检查组合？** 答：** `docker compose ps` 看状态，`docker compose logs --tail 100 backend` 看时间附近异常，Redis GET/PTTL 看两 Key，SQL 按路口方向与时间排序看记录；输出应脱敏，命令执行结果另存。

**小例子或手推：** 库已有 A北向10:05，后来保存10:03，接口成功但“最新”仍为10:05。这个案例无需假设缓存失效，先解释 SQL 语义。

**常见误答：** “先重启所有容器”；“只要保存成功页面必须立刻变”；“没有测试也能估计提升十倍”。

**口述验收：** 两分钟说完至少四层证据、一个排除假设的对照、三项回归条件；明确哪些实际跑过。

**源码依据：** [保存与失效链](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/service/impl/TrafficDataServiceImpl.java:173)、[实时查询语义](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/java/com/itms/repository/TrafficDataRepository.java:51)、[Swagger 路径](/E:/BaiduNetdiskDownload/3D/resume_work/source_repos/itms-bd/backend/src/main/resources/application.yml:58)。

## 口述复测与继续追问规则

每题按 0–4 分自评：0=无法解释；1=只记术语；2=主答正确但边界混乱；3=能讲原理、当前行为与手推；4=能用源码及验证方案回答三层追问。P0 目标全部≥3，T07、T09、T13、T15、T16、T17 中任何事实错误都回到卡片复学。

继续生成题目时只从本卡的简历锚点向下追：把“正常输入”换成“过期、并发、依赖失败或字段不匹配”，并必须补答案、来源、状态变化和验证方式。不要因技术栈出现 Kafka 就扩张为 Kafka 内核题库，也不要把改进建议写回既有成果。

| 复测主题 | 必须能答出的结论 | 题号 |
| --- | --- | --- |
| 个人范围 | Redis 与 Compose 主责；模型、接口与联调参与；不认领交通算法 | T01–T04 |
| JWT | 先验签/过期，后查撤销；摘要 Key；剩余 TTL；角色 claim 不等于授权 | T05–T08 |
| 失败计数 | 五次只提示，正确密码仍可继续；首次 INCR/EXPIRE 非原子 | T09–T11 |
| 缓存 | Cache-Aside、两个五秒 Key、双层陈旧、写后删除、事务与回填窗口 | T12–T16 |
| 故障与查询 | 业务缓存可回库不代表认证入口可用；JSON、SQL、日志分层定位 | T17–T20 |
| 集成环境 | 六个启用服务；容器地址/Profile；初始化与就绪不同；证据闭环 | T21–T24 |
