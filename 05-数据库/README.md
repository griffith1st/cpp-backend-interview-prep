# 数据库与缓存

## 1. 关系数据库基础

- 关系模型、主键/外键、范式与反范式、约束。
- SQL 执行大致阶段：解析、绑定、重写、优化、执行、存储访问。
- 页、记录、缓冲池、WAL、索引、执行器、事务管理的职责边界。
- 常见 Join 算法：Nested Loop、Hash Join、Sort Merge Join。

## 2. MySQL 索引

- B+ 树相对二叉树/B 树/哈希：扇出、树高、范围扫描、顺序 I/O。
- InnoDB 聚簇索引与二级索引；二级索引回表。
- 联合索引、最左前缀、覆盖索引、索引下推、前缀索引。
- 索引失效不能靠口诀：结合谓词、类型转换、函数、选择性和优化器成本分析。
- `EXPLAIN` 重点关注访问类型、key、rows、filtered、Extra，再用实际执行验证。

必须练习：

1. 为三类查询设计联合索引并解释列顺序。
2. 比较深分页、游标分页和覆盖索引子查询。
3. 给定 `ORDER BY + LIMIT` 判断是否可利用索引顺序。
4. 构造回表和覆盖索引查询，比较执行计划与读取量。

## 3. 事务、锁与日志

- ACID 各自由锁、MVCC、日志、刷盘和恢复机制共同保证。
- 隔离级别和脏读、不可重复读、幻读、写偏差等现象。
- MVCC：版本链、快照/Read View、可见性；与当前读的区别。
- 记录锁、间隙锁、临键锁、意向锁；锁范围由访问路径决定。
- 死锁：等待图、检测、选择牺牲者、重试；业务仍需固定加锁顺序。
- redo 保证持久性/崩溃恢复，undo 支持回滚/MVCC，binlog 服务复制和逻辑恢复。
- 理解 WAL 与两阶段提交的目标，不死背具体版本实现细节。

## 4. SQL 优化

- 先用慢查询、指标和执行计划定位，不先猜索引。
- 减少扫描行、回表、排序、临时表和不必要的数据传输。
- 避免 N+1、无界查询、超大事务和在事务内做慢外部调用。
- 批量写、合理分页、预聚合和读写分离都要讨论一致性代价。
- 统计信息、数据倾斜、参数差异会让“同一 SQL”表现不同。

## 5. Redis

- string/hash/list/set/zset/stream 的结构特征和适用场景。
- SDS、dict、skiplist、quicklist/listpack 等内部结构了解其目标。
- 单线程命令执行不代表系统只有一个线程，也不代表复合业务原子。
- RDB/AOF、重写、复制、故障切换的基本机制和数据丢失窗口。
- 过期策略与淘汰策略；big key、hot key、阻塞命令和内存碎片。
- 缓存穿透、击穿、雪崩；布隆过滤器、互斥重建、逻辑过期和限流。
- 缓存一致性：旁路缓存、失效而非双写、延迟双删的边界、CDC/消息补偿。
- 分布式锁必须讨论唯一 token、原子释放、租约续期、主从切换和 fencing token。

## 6. 数据库内核实践

BusTub 阅读顺序：

1. `src/storage/page` 与 `src/buffer`
2. PageGuard、LRU-K/ARC、DiskScheduler
3. table heap、tuple、catalog
4. B+ 树页、索引和迭代器
5. plan/executor 与优化规则
6. lock manager、transaction manager、恢复边界

本地材料：

- [数据库系统原理](../repos/cyc2018-cs-notes/notes/数据库系统原理.md)
- [MySQL](../repos/cyc2018-cs-notes/notes/MySQL.md)
- [Redis](../repos/cyc2018-cs-notes/notes/Redis.md)
- [国内题库 MySQL 篇](../repos/voice-interview-reference/09.MySQL篇)
- [BusTub 源码](../repos/cmu-bustub/src)

注意：题库内容来自面经汇总，答案需再用源码、官方文档或实验交叉验证。

## 7. 面试验收题

1. 为什么联合索引 `(a,b,c)` 对不同谓词的可用部分不同？
2. 覆盖索引为什么可能显著降低 I/O？
3. MVCC 能解决哪些读写冲突，哪些操作仍需加锁？
4. 一条 update 从执行到提交涉及哪些锁、页和日志？
5. 主从延迟下读写分离如何保证“写后读”？
6. Redis 缓存与数据库不一致时如何检测和修复？
7. 热点 key、big key 分别如何发现与治理？
8. 缓冲池为什么需要 pin、dirty 和替换策略？
