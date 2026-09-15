# RMDB 证据索引与面试表述边界

核查批次：2026-09-15 至 2026-09-16。用途：支持同目录 28 张 RMDB 学习卡的源码定位，区分源码事实、旧文档陈述、风险推演和未执行测试。项目源码只读。

## 1. 项目地址、版本和来源层级

| 项目 | 本轮核查结果 |
| --- | --- |
| 本地源码 | `E:\BaiduNetdiskDownload\Anything\git_compare\rmdb` |
| origin | [https://github.com/griffith1st/rmdb.git](https://github.com/griffith1st/rmdb.git)；来自本地 `git remote -v`，本轮未访问远端核对在线状态 |
| HEAD | `7a9fe1d4fc24c0bc6bbc7b4db067ce3ed19923bc` |
| HEAD 提交 | 2026-08-11 22:40:56 +08:00，`add detailed RMDB study plan` |
| 上一条可见提交 | `f79180445e18bb7c42eef2faef62aacd66dffa57`，2026-08-05 07:49:49 +08:00，`document RMDB tasks and code attribution` |
| 历史完整度 | `git rev-parse --is-shallow-repository` 为 true；`git rev-list --count HEAD` 为 2。不能据此推断项目只有两次开发提交 |
| 工作区状态 | `git status --porcelain=v1` 输出为空；本轮未修改源码 |
| 简历输入 | [简历项目原文](/E:/BaiduNetdiskDownload/Anything/output/双项目一天面试学习/简历项目原文.txt:1) |
| 当前边界底稿 | [项目边界-RMDB-ITMS-最终版](/E:/BaiduNetdiskDownload/Anything/cpp-backend-interview-prep/07-项目与工程/项目边界-RMDB-ITMS-最终版.md:1) |
| 旧学习记录 | [RMDB 项目详细学习方案](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/RMDB项目详细学习方案.md:1) |
| 旧归属记录 | [RMDB_TASKS_AND_ATTRIBUTION](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/RMDB_TASKS_AND_ATTRIBUTION.md:1) |

旧归属文档提及 `b6df74d` 初次整体导入及 `bbf8466` 后续索引修复，但本地 shallow clone 中用 `git cat-file -t` 查询两者均不存在。因此本轮把它们列为“旧文档记载”，没有把历史内容或作者划分重新验证为 Git 事实。提交账号也不能单独证明全部代码的个人归属。

证据强度：简历说明用户陈述的责任范围；静态源码说明当前版本有哪些分支；旧文档说明过去记录了什么；运行记录才说明某环境下实际观察到什么。本轮没有新增数据库运行结果。

## 2. 卡片到源码的最小阅读入口

每行只给关键入口，先读该函数，再向上下游扩展；无需先读完整仓库。行号为本地 HEAD 对应文件的真实行号，链接不绑定未来版本。

| 卡片 | 可核查结论 | 第一入口 | 补充入口 |
| --- | --- | --- | --- |
| R01 | 教学功能边界，索引/优化器简化 | [索引容器](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:11) | [空逻辑优化](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/optimizer/planner.cpp:145) |
| R02 | 页偏移计算、read/write、分配与空回收 | [DiskManager](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/disk_manager.cpp:15) | [deallocate_page 空实现](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/disk_manager.cpp:45) |
| R03 | 命中/缺页、替换映射和 victim | [fetch_page](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/buffer_pool_manager.cpp:34) | [update_page](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/buffer_pool_manager.cpp:15) |
| R04 | dirty 逻辑或、pin 降为零、flush | [unpin_page](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/buffer_pool_manager.cpp:57) | [flush_page](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/buffer_pool_manager.cpp:75) |
| R05 | 链表头插、尾淘汰、哈希定位 | [LRU 操作](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/replacer/lru_replacer.cpp:10) | [get_record 复制后 unpin](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.cpp:8) |
| R06 | 文件头、页头、bitmap、slot 布局 | [RmPageHandle](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.h:24) | [RmFileHdr](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_defs.h:22) |
| R07 | 空闲页复用、满页删除、扫描跳洞 | [insert_record](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.cpp:21) | [delete_record](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.cpp:64)、[RmScan](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_scan.cpp:13) |
| R08 | Parser→Analyze→Plan→Portal | [服务端调用](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:125) | [check_column](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/analyze/analyze.cpp:121) |
| R09 | 执行器推进契约和投影 | [SeqScan](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_seq_scan.h:50) | [Projection](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_projection.h:47) |
| R10 | int64 字面量范围、raw 和比较 | [convert_sv_value](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/analyze/analyze.cpp:198) | [Value::init_raw](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/common/common.h:72) |
| R11 | 严格日历校验、十进制日期编码 | [DATETIME 解析](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/common/datetime_utils.h:33) | [类型转换](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/analyze/analyze.cpp:25) |
| R12 | ordered vector、重复键异常、B+ 树路径简化 | [insert_entry](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:188) | [find_leaf_page](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:131)、[split](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:176) |
| R13 | key 按索引列定义顺序拼接、前缀规则选择 | [make_index_key](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/index_utils.h:8) | [get_index_cols](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/optimizer/planner.cpp:26) |
| R14 | 复合边界、get_range、回表与完整过滤 | [IndexScan::beginTuple](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_index_scan.h:102) | [get_range](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:153) |
| R15 | 先扫描收集 RID，再构造 DML 执行器 | [Portal UPDATE/DELETE](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/portal.h:75) | [UPDATE 申请 X](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:37) |
| R16 | 多索引逐个修改、当前索引局部补偿、写集滞后 | [UpdateExecutor::Next](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:41) | [普通 RMDBError 处理](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:154) |
| R17 | 聚合在输出层，SUM 类型限制和空输入输出 | [聚合分支](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/execution_manager.cpp:182) | [SUM 仅 INT/FLOAT](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/analyze/analyze.cpp:60) |
| R18 | 全量物化、stable_sort、最后 limit 截断 | [SortExecutor::beginTuple](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/execution_sort.h:36) | [generate_sort_plan](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/optimizer/planner.cpp:277) |
| R19 | 8 MiB 左块、跨块右扫、无条件右缓存 | [load_left_block](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_nestedloop_join.h:41) | [advance_to_match](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_nestedloop_join.h:81)、[缓存条件](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_nestedloop_join.h:135) |
| R20 | commit 清写集、追加日志、解锁、flush | [commit](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/transaction_manager.cpp:52) | [先响应后隐式 commit](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:177) |
| R21 | abort 逆序恢复 INSERT/DELETE/UPDATE 和索引 | [abort](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/transaction_manager.cpp:81) | [写集追加旧值](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:71) |
| R22 | 读 S 表锁、写 X 表锁、兼容表 | [compatible](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/concurrency/lock_manager.cpp:6) | [表与记录锁接口](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/concurrency/lock_manager.cpp:105) |
| R23 | no-wait 冲突抛异常，上层 abort | [lock](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/concurrency/lock_manager.cpp:51) | [TransactionAbortException catch](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:139) |
| R24 | 行镜像日志、flush 顺序、write 持久性边界 | [日志追加缓冲](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_manager.cpp:19) | [INSERT 顺序](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_insert.h:75)、[write_log](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/disk_manager.cpp:161) |
| R25 | 全日志分析、committed redo、active undo | [analyze](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_recovery.cpp:126) | [redo](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_recovery.cpp:177)、[undo](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_recovery.cpp:192) |
| R26 | open_db 从基表重建、编号初值与恢复边界 | [open_db](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/system/sm_manager.cpp:101) | [next_txn_id](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/transaction_manager.h:71)、[global_lsn](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_manager.h:350) |
| R27 | 六个 GoogleTest 定义与目标，不代表本轮运行 | [unit_test](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:195) | [CMake 目标](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/CMakeLists.txt:24) |
| R28 | 难点依据与贡献边界 | [归属文档](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/RMDB_TASKS_AND_ATTRIBUTION.md:7) | [多对象 UPDATE](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:41) |

## 3. 六个现有单测定义与验证口径

本轮对 `src/unit_test.cpp` 搜索 `TEST/TEST_F/TEST_P`，看到六个定义：

| 用例 | 定位 | 本轮证据 |
| --- | --- | --- |
| LRUReplacerTest.SampleTest | [195 行](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:195) | 源码存在，未运行 |
| BufferPoolManagerTest.SampleTest | [284 行](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:284) | 源码存在，未运行 |
| BufferPoolManagerConcurrencyTest.ConcurrencyTest | [382 行](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:382) | 源码存在，未运行 |
| StorageTest.SimpleTest | [430 行](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:430) | 源码存在，未运行 |
| RecordManagerTest.SimpleTest | [571 行](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:571) | 源码存在，未运行 |
| IndexScanTest.RangeScanAdvancesAcrossEntries | [666 行](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:666) | 源码存在，未运行；旧归属文档把后续索引回归修复归为整理维护工作 |

旧学习计划记录分题测试脚本位于 `E:\Code\rmdb.tar`，以及 `txn_index.sql` 等历史路径。本轮没有以这些路径中的脚本和输出作为新验证证据；不要把待补的运行结果写成“通过”。构建环境是 C++17/CMake，源码调用 POSIX 文件接口，重跑应使用匹配的 Linux/WSL 环境并保存编译器、commit、命令和结果。

下面是**待执行命令模板** ，不是运行记录；应在独立构建目录/临时数据库中运行，避免污染面试所用数据。`ctest -N` 只用于查看注册情况，退出码为零不代表真的执行了六个用例。

```bash
cmake -S . -B build-interview
cmake --build build-interview -j
./build-interview/bin/unit_test --gtest_list_tests
./build-interview/bin/unit_test
ctest --test-dir build-interview -N
```

## 4. 面试需要主动守住的实现边界

| 编号 | 静态可确认事实 | 允许表述 | 不应表述 |
| --- | --- | --- | --- |
| B01 | 主索引条目为有序 vector；树分裂合并等为简化实现 | 实现功能型唯一索引、范围访问和 DML 同步路径 | 完整磁盘 B+ 树、节点分裂合并已经落地 |
| B02 | Planner::logical_optimization 返回原 Query | 基础计划组装、规则选索引 | 完整成本优化器、最优连接顺序 |
| B03 | UPDATE 每个索引只局部恢复；写集在本行最后追加 | 有基础同步，异常原子性仍有需要复现的中间状态 | 所有失败都原子、任意异常自动回滚 |
| B04 | 普通 RMDBError 只打印错误；锁冲突异常才显式调用 abort | 区分普通语句错误与事务冲突中止 | 只要报错就整个事务撤销 |
| B05 | INSERT 改记录后记日志；缓冲淘汰不检查 pageLSN/persistLSN | 有基础 WAL 日志流程，写前约束仍需补核 | 任意数据页都严格日志先行 |
| B06 | write_page/write_log 中未见 fsync/fdatasync | 写文件调用存在；强故障持久性未被证明 | write 成功即断电安全 |
| B07 | commit 释放锁后 flush；隐式事务先发响应后调用 commit | 能指出当前顺序及其风险 | 客户端成功一定意味着提交日志可靠持久 |
| B08 | redo 仅 committed，undo 仅 active，未用 prev_lsn 链 | 基础物理日志 REDO/UNDO | 完整 ARIES、完整崩溃幂等 |
| B09 | next_txn_id/global_lsn 从 0 初始化；所读启动链未见恢复接续 | 连续重启和编号复用为待测重点 | 所有重启后的事务身份已正确延续 |
| B10 | SUM 限制 INT/FLOAT；排序全量物化后截断 | 按当前类型和组合语义说明能力 | SUM 支持全部数值类型、LIMIT 自动少扫描 |
| B11 | 读写执行器主要获取表 S/X 锁 | 表级 no-wait 并发控制 | 正常 SQL 已采用高并发行锁/MVCC |

上述条目是本轮核查得到的实现边界，不是要求用户在开场逐条背缺陷。先回答面试官的问题；涉及保证、失败、持久化或完整算法时再准确限定能力。相关风险未经本轮运行复现，不包装成线上故障。

## 5. 待复现的最小场景设计

这些场景从简历承诺自然延伸，用于学会回答失败追问，不扩展整个项目。此表是测试设计；实际列统一为“未执行”。

| 场景 | 最小输入/时序 | 应检查的断言 | 当前状态 |
| --- | --- | --- | --- |
| 两个唯一索引 UPDATE 中途冲突 | A=(u1,v1)、B=(u2,v2)，u/v 各唯一；A→(u3,v2) | 报错后顺扫仍是旧 A；u1 能找到 A、u3 找不到；v1/v2 不变；abort 和重启后再次检查 | 未执行；静态可见局部补偿缺口 |
| 多行 UPDATE 后续行冲突 | 第一行成功，第二行唯一冲突 | 明确语句失败应撤销本语句还是整个事务；检查前一行、写集与索引 | 未执行 |
| 同列多个索引范围约束 | `a=3 AND a>=3`、交换顺序；以及 `a>=3 AND a>3` | 与顺扫结果集合一致；特别检查等值端点 | 未执行 |
| 复合前缀加范围 | `(a,b)` 上 a=2 AND b>5、只有 b 条件 | 候选可多取但不能漏取；顺扫和索引扫一致 | 未执行 |
| 聚合与 LIMIT 组合 | 表有三行，COUNT(*) 或 SUM(x) 搭配 LIMIT 1/0 | 按明确 SQL 契约验证 LIMIT 应作用于聚合输出还是输入；记录当前行为 | 未执行；静态可见聚合位于输入截断之后 |
| INSERT 记录已改但日志未写 | 在这两步间注入失败/崩溃，并考虑页被写出 | 重启后未提交行不可见；文件头、bitmap、索引一致 | 未执行 |
| abort 完成日志写出但撤销页未可靠保存 | 更新后 abort，在相关落盘边界中断 | 启动时不因 ABORT 分类而保留未撤销数据 | 未执行 |
| 连续两次重启与编号复用 | 旧日志保留，先提交；重启新事务未提交崩溃；再重启 | 新旧 txn_id 不混淆、提交分类和恢复结果正确 | 未执行 |
| 恢复过程中再次崩溃 | 在 redo 或 undo 中途终止，再次启动 | 重复执行最终收敛，索引没有残留或重复，RID/空闲链可继续使用 | 未执行 |

不要运行“修改现场源码后 kill -9”来制作虚构历史经历。若补实验，应在复制目录/隔离分支中保存输入与日志，并把真实观察追加到本目录。

## 6. 文档自身核查结果

学习主文固定为 R01—R28，每卡含简历锚点、概念教学、主问、口述答案、三层带答案追问、例子、误答、自测和源码定位；28 个主问、84 个追问，18 个 P0、10 个 P1。文档结构和文件/行号链接另作机械校验，不与数据库功能测试混同。
