# RMDB：一天内可顺序学习的知识点与分层问答

版本：2026-09-15；源码基准：`7a9fe1d4fc24c0bc6bbc7b4db067ce3ed19923bc`。本轮完成静态源码核查，没有重新编译或运行数据库测试。

## 使用方式与证据约定

先沿 R01—R10 建立基础，再学索引、执行、事务、恢复。P0 必须能脱稿回答；P1 至少会说“当前实现、局限、改进方向”。每张卡先读必要概念，再遮住答案口述，最后手推例子。每个“60 秒答案”是讲解稿，可按自己的表达缩短，不是需要伪装熟练度的台词。

- **简历锚点** ：说明为什么允许问这一题，不代表每项实现均由当前源码证明个人归属。
- **代码可见** ：文件中可直接确认的行为。** 原理** ：数据库一般概念。** 改进** ：尚未落地的建议。
- **风险推演** ：从分支和顺序推导的待复现场景，不表述为已经观察到的故障。
- 题中 SQL、数据和状态均为教学例子，未运行的预期不计作测试通过。
- 源码链接均指向本地基准；更多函数和边界见同目录《01_RMDB证据索引.md》。不要把旧学习计划中的“过关标准”读成已完成结果。

## 知识地图与学习验收

| 编号 | 优先级 | 知识点 | 学完应能做什么 |
| --- | --- | --- | --- |
| R01 | P0 | 项目定位与个人边界 | 用 30 秒说明做了什么、能展开什么 |
| R02 | P0 | 磁盘页、页号和文件偏移 | 计算页偏移，区别分配与实际写入 |
| R03 | P0 | page、frame 与缓冲池命中 | 手画页面映射变化 |
| R04 | P0 | pin、dirty 与安全淘汰 | 手推两次 fetch 和两次 unpin |
| R05 | P0 | LRU、锁和所有权 | 推出 victim，解释 pin 不等于事务锁 |
| R06 | P0 | 定长记录布局与 RID | 从 RID 找到 slot 字节位置 |
| R07 | P0 | bitmap、空闲页链与扫描 | 解释删除后的空槽复用和跳洞 |
| R08 | P0 | SQL 解析、分析、计划、执行 | 一条 SQL 分四阶段讲通 |
| R09 | P0 | 拉取式执行器与投影 | 描述 begin/Next/next 的契约 |
| R10 | P0 | BIGINT 全链路类型扩展 | 解释为什么不能只改 int 为 long |
| R11 | P1 | DATETIME 校验和可排序编码 | 区别日期编码和时间戳 |
| R12 | P0 | 唯一索引与实际数据结构 | 准确说出有序 vector 的能力和成本 |
| R13 | P1 | 复合键和最左前缀 | 判断四种谓词能否选索引 |
| R14 | P0 | IndexScan 边界与残余过滤 | 解释 key→RID→基表记录 |
| R15 | P1 | DML 先收集 RID | 解释边扫描边修改的风险 |
| R16 | P0 | 多索引 UPDATE 与原子性边界 | 推导失败中途哪些状态需恢复 |
| R17 | P1 | 聚合状态与空输入语义 | 算 COUNT/SUM/MAX 并说明限制 |
| R18 | P1 | 排序、LIMIT 与阻塞算子 | 区别结果少与计算少 |
| R19 | P0 | BNLJ 分块与复杂度 | 手推分块、匹配和右侧重扫 |
| R20 | P1 | COMMIT 和事务生命周期 | 区分释放写集、释放锁、日志持久性 |
| R21 | P0 | ABORT 写集逆序回滚 | 还原记录及其索引 |
| R22 | P0 | 表级 S/X 锁与并发范围 | 判断两事务锁兼容性 |
| R23 | P0 | no-wait 与冲突回滚 | 说明无等待环的代价 |
| R24 | P0 | WAL、物理日志与落盘顺序 | 区分原则、调用意图与持久性缺口 |
| R25 | P1 | 启动 analyze/redo/undo | 手推提交与活跃事务日志 |
| R26 | P1 | 恢复幂等、索引重建与 ARIES 边界 | 说明重放和重复崩溃为什么难 |
| R27 | P1 | 单测、并发与恢复验证 | 设计输入、断言、故障点和证据 |
| R28 | P1 | 项目难点、取舍与诚实深挖 | 讲一个可定位的难点，回答改进优先级 |

## 第一组：把存储链路讲明白

### R01｜P0｜项目定位与个人边界

**简历锚点：** “基于 RMDB 教学框架独立完成题目 1-11”。

**学习目标：** 把课程任务、当前功能、个人贡献三件事分开。

**必要概念：** 数据库把 SQL 请求变成记录访问；数据库内核项目重点是数据怎样存、怎样查、失败怎样处理。教师框架提供接口和骨架，补全实现仍有价值。源码证明功能存在，个人贡献还需要任务记录、提交差异或本人确认支持。

**主问：你的 RMDB 项目究竟做了什么？**

**60 秒答案：** RMDB 是教学数据库项目。我基于框架完成简历列出的题目 1-11，学习主线是把 SQL 一直打通到磁盘页：存储层负责页和定长记录，查询层负责语义检查、计划和执行器，扩展层加入类型、唯一索引、聚合排序和 BNLJ，事务部分加入提交回滚、表锁、no-wait 和基础日志恢复。我会重点展开缓冲池的 pin/dirty，或一次 UPDATE 如何维护记录和索引。当前索引是进程内有序条目的简化实现，恢复也是基础 REDO/UNDO，不能说成完整磁盘 B+ 树和完整 ARIES。

**追问 1：最熟的是哪一层？** 答：选择自己完成脱稿验收的链路，例如“我先讲存储，再讲 UPDATE/ABORT”，随后说明输入、状态变化和一个失败分支；不要为了显得全面认领尚未学习的模块。

**追问 2：能证明是你做的吗？** 答：简历是本人经历陈述，代码位置是功能证据；进一步提供课程任务、原框架与本人版本差异和自己的调试记录。当前两条 Git 历史不足以单独证明所有函数的作者。

**追问 3：如果面试官让你讲 B+ 树分裂？** 答：先说明当前项目分裂路径是简化项；如果对方要求原理，可以解释节点满时分裂及父节点更新，但明确这是原理理解，不说是本项目已完成机制。

**小例子：** 把“我写了一个数据库”改成“我补全教学数据库的存储、执行和基础事务链路，可以从 UPDATE 的旧值保存讲到 ABORT”。

**常见误答：** “项目里所有代码都由我设计”“项目支持完整工业数据库能力”。

**自测验收：** 30 秒说清背景、三项职责、一个可展开难点和两条实现边界。

**源码依据：** [索引实际容器](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:11)、[恢复筛选提交事务](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_recovery.cpp:177)、[逻辑优化入口](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/optimizer/planner.cpp:145)。

### R02｜P0｜磁盘页、页号和文件偏移

**简历锚点：** “磁盘页”。

**学习目标：** 解释数据库如何把页映射到文件字节。

**必要概念：** 文件由字节构成；页是固定大小的存储单位。同一页号在不同文件中对应不同数据，因此身份需要文件和页号。页分配可以先分配逻辑编号，实际写文件在后续发生。

**主问：DiskManager 如何读写某一页？**

**60 秒答案：** 当前实现用文件描述符 fd 和 page_no 定位页，把 page_no 乘 PAGE_SIZE 得到文件偏移，再调用 lseek 和 read/write。read_page 遇到不足请求长度的读取会把尾部补零；write_page 检查返回字节数，不足时抛错。allocate_page 对该文件的页号计数器递增，主要分配编号。deallocate_page 当前为空，因此不能把删除缓冲页说成磁盘空间已回收。这个分层让记录层只处理页和 slot，无须每次计算整个文件的布局。

**追问 1：页号 3 的位置在哪里？** 答：若教学例子中页大小为 4096 字节，偏移是 12288；真实常量以源码为准，页号按从 0 开始计算。

**追问 2：调用 write 就保证断电不丢吗？** 答：不保证。write 通常把内容交给操作系统；还要检查 fsync/fdatasync 等持久性屏障及存储保证。当前写页和写日志函数中未见这类同步调用。

**追问 3：能直接用于高并发共享 fd 吗？** 答：lseek 改变共享文件位置，后续 read/write 依赖该位置。应检查调用方串行化是否覆盖所有路径；若独立并发调用存在，pread/pwrite 是值得考虑的改进。这里是风险检查方向，未复现该故障。

**小例子：** `(fd=5,page=2)` 与 `(fd=6,page=2)` 页号一样，但应当是不同缓存身份。

**常见误答：** “分配页一定马上向文件写一整页”“删除页自动压缩文件”。

**自测验收：** 能算偏移，能区分逻辑分配、write 返回、断电持久化。

**源码依据：** [页读写与分配](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/disk_manager.cpp:15)、[日志追加](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/disk_manager.cpp:161)。

### R03｜P0｜page、frame 与缓冲池命中

**简历锚点：** “缓冲池”。

**学习目标：** 区分数据身份和内存位置。

**必要概念：** page 是数据库页；frame 是内存中容纳一页的槽位。page table 是“页身份→frame 编号”的映射，缓冲池满后同一个 frame 可以改装另一页。free list 保存未占用 frame，replacer 保存可淘汰 frame。

**主问：fetch_page 命中和未命中分别做什么？**

**60 秒答案：** 命中时通过 page table 找到 frame，增加 pin count，并从可淘汰集合中移除它。未命中时先找 free frame，没有空闲 frame 就向 LRU 要 victim；没有 victim 则返回空指针。复用 frame 时，如果旧页脏就写回，再移除旧映射、清理内存、建立新映射，然后从磁盘读取新页并设 pin 为 1。关键不变量是一个已缓存页面只有一份有效映射，且映射必须与 frame 中的页身份一致。

**追问 1：为什么不能只用 page_no 作 key？** 答：不同表文件可有相同页号，必须连同 fd 等文件身份区分。

**追问 2：为什么先处理旧映射？** 答：否则 A 已经被 B 覆盖，page table 仍把 A 指向同一 frame，会返回 B 的数据；脏 A 还可能永久丢失。

**追问 3：缓冲池耗尽怎样处理？** 答：当前返回 nullptr，上层记录访问包装成异常。不能随意选一个正在使用的 frame；生产改进可以等待资源、限制持有时长或做背压，但当前没有这样的承诺。

**小例子：** 只有一个 frame：fetch A→unpin A→fetch B，映射从 A→0 变成 B→0；A 若脏应先写回。

**常见误答：** “frame 就是磁盘页号”“缓冲池满了总能淘汰”。

**自测验收：** 闭卷画出 page table、free list、LRU 三者的分工。

**源码依据：** [fetch 与替换映射](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/buffer_pool_manager.cpp:15)、[无可用页的处理](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.cpp:96)。

### R04｜P0｜pin、dirty 与安全淘汰

**简历锚点：** “缓冲池”。

**学习目标：** 掌握页面生命周期里两个独立状态。

**必要概念：** pin count 记录页面被使用的次数；dirty 记录内存内容是否可能比磁盘新。被 pin 的页不能被替换，但可以是干净或脏的；pin 降到 0 只意味着可淘汰，不等于已经写回。

**主问：为什么 unpin 里的 dirty 要取逻辑或？**

**60 秒答案：** 多个访问者可能先后使用同一页，一个人修改了页，另一个人只是读。unpin 时必须用旧 dirty 或本次 dirty 合并，否则后一个只读调用会把已有脏标记清掉，未来淘汰就不写回。当前每次合法 unpin 减少 pin count，只在降到 0 时加入 LRU；重复 unpin 会返回 false。脏页在被替换或显式 flush 时写出，写完清 dirty。pin 解决内存是否能复用，dirty 解决是否需要保存修改，两者不能混为一谈。

**追问 1：同一页 fetch 两次、unpin 一次能淘汰吗？** 答：不能，pin 从 2 降为 1，还存在使用者。

**追问 2：unpin(false) 能把 dirty 清掉吗？** 答：不能，`true || false` 仍为 true；清 dirty 的时机是完成写回。

**追问 3：flush 一定要求 pin 为 0 吗？** 答：当前 flush_page 没有这个前置检查，并且无论 dirty 与否都会写页；不要把“淘汰必须无 pin”的规则误套到当前 flush 实现。并发写与 flush 的一致性还需看内容访问同步。

**状态走查：** `(pin=0,dirty=false)`→fetch 两次 `(2,false)`→写者 unpin(true) `(1,true)`→读者 unpin(false) `(0,true)`→淘汰写回。

**常见误答：** “unpin 就刷盘”“脏页不能淘汰”“pin 是独占锁”。

**自测验收：** 不看答案写出上面五步状态，说明哪一步进入 LRU。

**源码依据：** [unpin 合并脏标记](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/buffer_pool_manager.cpp:57)、[flush_page](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/buffer_pool_manager.cpp:75)。

### R05｜P0｜LRU、锁和所有权

**简历锚点：** “C++ 查询执行与存储系统、缓冲池”。

**学习目标：** 理解淘汰算法和安全使用页面的不同职责。

**必要概念：** LRU 近似淘汰最久没有被使用的可淘汰对象。链表维护顺序，哈希表定位节点，避免移除时线性搜索。RAII 是让对象析构自动释放资源的 C++ 思想，可用于未来管理 pin，但当前 record 路径仍显式 unpin。

**主问：你的 LRU 怎么实现？**

**60 秒答案：** 当前 LRU 用链表加哈希表，unpin 把可淘汰 frame 放在链表头，victim 从链表尾取出并删除哈希映射；pin 根据哈希定位并从链表中移除。重复 unpin 已在集合中的 frame 不会再插入。它维护的是可淘汰 frame 的顺序，并不是每条记录访问的全量历史。LRU 和缓冲池内部各有互斥锁保护状态；事务锁则保护并发事务的数据访问，pin 又只是阻止内存复用，三者作用不同。

**追问 1：链表加哈希的复杂度？** 答：在常见哈希假设下定位、移除和选 victim 为平均 O(1)，链表节点迭代器用于直接删除。

**追问 2：为什么顺序扫描可能效果不好？** 答：一次性大扫描会让很多不再使用的页进入缓存，挤掉热点页；可讨论 LRU-K、Clock 或扫描隔离作为改进，不说项目已经有。

**追问 3：异常路径漏了 unpin 会怎样？** 答：pin 泄漏导致 frame 长期不能淘汰，最终无 victim。可用作用域页句柄自动 unpin，并让调用者显式标脏；这是改进设计。

**状态走查：** 依次 unpin A、B、C 后头到尾为 C,B,A；pin B 后为 C,A；victim 返回 A。

**常见误答：** “LRU 的互斥锁实现事务隔离”“所有页都在 LRU”。

**自测验收：** 给出上述链表顺序，并用一句话分别解释 pin、latch、事务锁。

**源码依据：** [LRU 操作](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/replacer/lru_replacer.cpp:10)、[页读取后的复制和 unpin](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.cpp:8)。

### R06｜P0｜定长记录布局与 RID

**简历锚点：** “定长记录”。

**学习目标：** 从逻辑行定位到内存字节。

**必要概念：** 表的 schema 确定每列类型、长度、offset，行长固定。记录页包含预留区域、页头、bitmap 和 slot 区；bitmap 的一个 bit 表示一个 slot 是否有效。RID 由页号和槽号组成，不是 SQL 主键。

**主问：RID 怎么找到一条记录？**

**60 秒答案：** 先用 RID 的 page_no 向缓冲池取记录页，再检查 slot_no 是否越界以及 bitmap 是否置位。slot 地址等于 slot 区起点加 slot_no 乘 record_size。get_record 把该位置的数据复制到独立 RmRecord 中，然后 unpin 页，因此上层拿到的记录不依赖 frame 一直保留。定长布局便于随机定位和更新，代价是变长字符串、跨页记录和压缩布局需要额外设计。删除后 RID 的 slot 可能被复用，所以不能把 RID 当成永远不变的业务身份。

**追问 1：行里字段怎样取？** 答：记录起始地址加列 offset，再按列类型和长度解释该字节区间。

**追问 2：一个页能放多少行？** 答：须同时满足页头、bitmap、每行定长数据的总和不超过页大小；不能直接用 PAGE_SIZE/行长忽略管理开销。

**追问 3：CHAR(20) 是变长字段吗？** 答：当前是固定分配 20 字节的字段，短值补齐；它与变长字段的长度目录、溢出页是不同设计。

**小例子：** 行长 12 字节时，slot 3 的位置是 slots+36；它的某列 offset=4，则列地址是 slots+40。

**常见误答：** “RID 就是用户 id”“删除 slot 必须把后面的记录搬过来”。

**自测验收：** 画出页布局，给定 record_size、slot_no、offset 能算列地址。

**源码依据：** [文件头和记录结构](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_defs.h:22)、[slot 地址计算](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.h:24)、[读取有效性检查](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.cpp:8)。

### R07｜P0｜bitmap、空闲页链与扫描

**简历锚点：** “定长记录”。

**学习目标：** 掌握插入、删除、扫描共享的不变量。

**必要概念：** bitmap 管一页内的空槽；first_free_page_no 与 next_free_page_no 组成还有空槽的页链。有效行数应等于 bitmap 中已置位的槽数。扫描不能只按行数读取前 N 个 slot，因为删除会留下洞。

**主问：满页删除一条后，再插入如何复用空间？**

**60 秒答案：** 正常插入从空闲页链取页，找到第一个未占用 bit，复制记录、置 bit、增加行数。如果插入后页满，就把该页从空闲链头移走。删除时清 bitmap、减行数；如果删除前页满，说明它刚获得空槽，应重新加入空闲页链。扫描用 bitmap 找下一个有效 slot，当前页没有再换下一页。这里三个结构要一起维护：bitmap、num_records、空闲链，否则会出现读到删除行、空位不复用或把满页当成空闲页的问题。

**追问 1：为什么不是每次删除都把页加到链头？** 答：原来未满的页已在空闲链中，重复加入会破坏链结构或造成重复节点。

**追问 2：删除的字节必须清零才算删除吗？** 答：记录是否可见由 bitmap 决定；旧字节可以仍存在，扫描必须检查有效位。安全擦除是另外的问题。

**追问 3：恢复时指定 RID 插入有什么额外要求？** 答：必须保证页已存在、slot 为空，并同步行数和空闲链。当前指定 RID 路径对链调整有简化条件，应通过满页、中间空闲页和恢复重插场景验证，不能由正常 insert 通过推导所有恢复布局正确。

**状态走查：** 一页三个槽 `[1,1,1]`→删除 slot1 得 `[1,0,1]`，重新进入空闲链→普通插入复用 slot1→扫描只返回置位槽。

**常见误答：** “num_records=2 所以读 slot0 和 slot1”“所有删除都把页挂一次链”。

**自测验收：** 手画满页删除、非满页删除和跨页扫描三种情况。

**源码依据：** [普通与指定 RID 插入](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.cpp:21)、[删除](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_file_handle.cpp:64)、[扫描跳洞](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/record/rm_scan.cpp:13)。

## 第二组：从 SQL 到可执行的记录流

### R08｜P0｜SQL 的四阶段

**简历锚点：** “SQL 解析、语义分析、计划生成与执行器链路”。

**学习目标：** 按职责分阶段解释，不背目录名。

**必要概念：** Parser 识别语法并生成 AST；Analyze 使用表元数据绑定列、校验类型并产生 Query；Planner 把查询要求组织成 Plan；Executor 根据计划实际取行和改行。Portal 是当前把计划转换成执行器树的衔接层。

**主问：SELECT 从文本到结果经过什么？**

**60 秒答案：** 以 `select id from t where id=7` 为例，Parser 把 select、列和条件组成语法树；Analyze 检查 t 和 id 是否存在，补全列归属并把 7 转为匹配字段类型的值；Planner 为 t 选顺序扫描或索引扫描，再包投影计划；Portal 构造相应执行器，结果端不断拉取记录、按元数据解释字段并输出。不存在的列是语义错误，拼错 SQL 结构是语法错误。当前有基本计划生成和索引选择，logical_optimization 为空，不能宣称完整代价优化器。

**追问 1：两个表都有 id 时怎么办？** 答：未限定的 id 会产生歧义，应要求 t1.id 或 t2.id；Analyze 的 check_column 负责检查。

**追问 2：AST 和执行计划能合并吗？** 答：可以做极简解释器，但分层后同一语义能选择不同执行方式；AST 描述用户写了什么，计划描述怎样执行。

**追问 3：索引选择属于代价优化吗？** 答：当前按可用前缀长度等规则选择，未见基于统计信息估算各方案成本的完整流程；规则选择不能自动等同于成本最优。

**小例子：** `select missing from t` 语法可能成立，但元数据找不到列；`select from where` 在语法阶段失败。

**常见误答：** “Parser 会查磁盘拿行”“Optimizer 类存在就有完整优化器”。

**自测验收：** 脱稿为四阶段各说一个输入、输出和错误例子。

**源码依据：** [服务端四阶段调用](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:125)、[列绑定](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/analyze/analyze.cpp:121)、[计划转换](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/portal.h:156)。

### R09｜P0｜拉取式执行器与投影

**简历锚点：** “执行器链路”。

**学习目标：** 能手推一个执行循环。

**必要概念：** 执行器输出一串记录，父算子向子算子要下一条。当前接口中 beginTuple 定位第一条，Next 返回当前条，nextTuple 推进，is_end 判断结束；不要把 Next 误认为它自己推进。投影按选择列重组记录，并重算输出 offset。

**主问：执行器为什么能串起来？**

**60 秒答案：** 各执行器共享记录长度、列元数据和迭代接口。SeqScan 从 RmScan 获取有效 RID，再用条件过滤；Projection 从子执行器取当前行，只复制所需列。父算子不需要知道子节点是顺扫、索引扫还是连接，只按统一契约拉取。顶层循环是 beginTuple，未结束就 Next 取当前记录，处理后 nextTuple。Sort 会先读完输入再输出，所以有统一接口不代表所有算子都能立刻流式产生结果。

**追问 1：Next 调两次会跳两行吗？** 答：当前设计通常返回同一当前位置，推进由 nextTuple 完成；必须按具体接口使用。

**追问 2：为什么投影后 offset 要改？** 答：原行字段可能在 0、4、24，投影只选后两列时新行紧凑排列，旧 offset 不能照搬。

**追问 3：如何减少无用数据搬运？** 答：原理上可以谓词下推、投影下推、批处理或引用式数据结构；当前实现以独立 RmRecord 和 memcpy 为主，不能把这些改进说成已实现。

**状态走查：** 原始行 id=1,2,3，条件 id>1：begin 定位 2→Next 返回 2→next 定位 3→Next 返回 3→next 到 end。

**常见误答：** “每个 Next 都自动向后移动”“拉取式就没有内存物化”。

**自测验收：** 写出四接口正确调用顺序，并画两层执行器的数据方向。

**源码依据：** [SeqScan](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_seq_scan.h:50)、[Projection](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_projection.h:47)、[顶层拉取](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/execution_manager.cpp:256)。

### R10｜P0｜BIGINT 的全链路扩展

**简历锚点：** “实现 BIGINT”。

**学习目标：** 解释类型是跨层契约。

**必要概念：** BIGINT 在当前实现中是有符号 64 位整数、8 字节存储。类型功能包括字面量解析、合法范围、元数据长度、raw 编码、比较、输出和索引键比较，不只是语法关键字。

**主问：加 BIGINT 需要改哪些地方？**

**60 秒答案：** Parser 识别 BIGINT 并生成 8 字节列类型；整数 AST 保留字面量文本，Analyze 用 strtoll 检查 ERANGE 和解析尾部，值在 int 范围内先作为 INT，超出则作为 BIGINT，再按目标列做允许的转换。Value 的 raw 编码必须写满 8 字节，记录 offset 和列长要一致；执行比较、结果输出和索引 key 比较都要按 int64_t 解释。只有这些环节一致，超过 32 位的值才不会在插入、筛选或索引阶段被截断。SUM 当前另外限制为 INT/FLOAT，不能因为有 BIGINT 就说所有函数都支持它。

**追问 1：为什么先存字面量字符串？** 答：如果词法阶段先压进 int，大值已经溢出，语义阶段再换成 int64_t 无法恢复原值。

**追问 2：测试哪些边界？** 答：0、负数、INT 两端、INT 外但 int64_t 内的值、int64_t 两端以及两侧越界；同时检查插入、where、update、order by 和唯一索引。

**追问 3：用 memcmp 比 8 字节行不行？** 答：不能对一般机器端序的有符号整数直接按字节序判断数值大小；当前按类型读取 int64_t 后比较。对齐、端序和跨平台文件格式仍是进一步设计范围。

**小例子：** 2147483648 比 INT_MAX 大 1，应该作为 BIGINT 存储和比较；9223372036854775808 应被拒绝，而不是绕成负数。

**常见误答：** “把所有 int 换 long”“关键字能解析说明类型完成”。

**自测验收：** 从 SQL 字面量到打印结果列出至少六个需要一致的环节。

**源码依据：** [字面量范围检查](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/analyze/analyze.cpp:198)、[raw 编码](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/common/common.h:72)、[索引比较](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.h:27)。

### R11｜P1｜DATETIME 校验与可排序编码

**简历锚点：** “实现 DATETIME”。

**学习目标：** 说清表示、合法性与不支持的时间语义。

**必要概念：** 当前接受固定 `YYYY-MM-DD HH:MM:SS`，编码成形如 20260915103000 的 int64_t。高位年份、低位秒，合法日期的数值大小与时间先后相同；这不是距某个纪元的秒数。

**主问：DATETIME 怎么保证可比较？**

**60 秒答案：** 先检查长度 19 和分隔符位置，再逐段检查都是数字，校验年份 1000—9999、月份、按闰年决定的天数以及时分秒范围。合法后编码为 YYYYMMDDHHMMSS 的 8 字节整数，比较可以复用 int64_t 的数值顺序，输出时逐段拆回字符串。这种方式适合当前的存储、范围查询和排序，但没有 Unix 时间戳、时区转换或日期算术语义，不能直接相减得到时长。

**追问 1：1900 和 2000 都能有 2 月 29 日吗？** 答：1900 不是闰年，2000 是；规则是能被 400 整除，或被 4 整除且不能被 100 整除。

**追问 2：为什么不能把两个编码相减算秒？** 答：十进制各段不是统一进位时间单位，12:59:59 到 13:00:00 的编码差不是 1。

**追问 3：支持夏令时吗？** 答：当前没有时区信息和夏令时处理；若需求引入绝对时间，要重新明确存储和展示契约。

**小例子：** `2024-02-29 23:59:59` 合法；`2023-02-29 12:00:00`、`2024-01-01 24:00:00` 应拒绝。

**常见误答：** “存的是 Unix 时间戳”“格式正确就是合法日期”。

**自测验收：** 解释一个闰年反例、一个时间算术反例。

**源码依据：** [DATETIME 解析和编码](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/common/datetime_utils.h:33)、[字符串转目标类型](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/analyze/analyze.cpp:25)。

## 第三组：索引与修改的一致性

### R12｜P0｜唯一索引与实际数据结构

**简历锚点：** “唯一单列/多列索引”。

**学习目标：** 不把接口名字当作实现能力。

**必要概念：** 索引保存 key→RID，帮助定位基表行；唯一索引还要求 key 不重复。B+ 树是按页组织、有内部节点与叶节点、需要分裂合并的树。当前主路径是每个 fd 对应一个有序 vector，保存 key 字节和 RID。

**主问：你实现的是 B+ 树吗？**

**60 秒答案：** 当前版本实现的是功能型唯一索引，主要条目在进程内有序 vector 中。查找用 lower_bound，重复 key 会抛出错误，范围访问从下界向后取到上界。框架中虽然有 IxNodeHandle 和树相关接口，但 find_leaf_page、split、合并和根调整仍为空或简化行为，不能称为完整磁盘 B+ 树。打开数据库时会扫描基表重建索引。这个实现把唯一约束、IndexScan 和 DML 维护链路串通了，代价是内存容量限制、插入删除移动成本和重启重建成本。

**追问 1：查询与插入复杂度？** 答：二分定位约 O(log N)，范围输出再加 K；vector 在中间插入或删除可能移动 O(N) 条目，不能把整个插入说成 O(log N)。

**追问 2：建索引前表里已有重复数据？** 答：重建索引时逐行插入，重复键会触发异常；建索引路径有失败清理逻辑。仍应验证失败后元数据和索引文件没有半成品。

**追问 3：为什么完整 B+ 树适合磁盘？** 答：高扇出降低树高，节点对应页，叶子有序支持范围扫描；这是通用原理，当前容器未实现这些磁盘访问性质。

**小例子：** 索引已有 key=8→RID(2,1)，再插入 key=8 应拒绝；key=9 插入到有序位置。

**常见误答：** “类名叫 IxIndexHandle 所以有 B+ 树”“二分查找让更新也是 O(log N)”。

**自测验收：** 同时说出实现容器、唯一判断、三项代价和重启来源。

**源码依据：** [容器和 lower_bound](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:11)、[唯一插入](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:188)、[重建索引](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/system/sm_manager.cpp:121)。

### R13｜P1｜复合键和最左前缀

**简历锚点：** “多列索引”。

**学习目标：** 从有序规则推出索引可用条件。

**必要概念：** 索引 `(a,b)` 按定义顺序拼接 key，并按 a 再 b 比较，即字典序。唯一性约束整个组合，a 相同而 b 不同可以共存。查询连续等值前缀能缩小范围；遇到范围列后，后续列一般不能继续把候选集缩成一个简单连续区间。

**主问：为什么联合索引讲最左前缀？**

**60 秒答案：** 因为条目首先按第一列排序。对 `(a,b)`，a=1 的记录形成连续区域，a=1 且 b=2 还能继续缩小；只有 b=2 时这些记录可能分散在多个 a 的区域中，当前 Planner 不选择这个索引。Planner 遍历索引列找条件，以最长可用前缀优先，范围条件后停止扩展。这里是规则选择，不是成本估计。复合 key 由字段 raw 字节按索引定义复制，比较器再按每列类型和长度逐列比较。

**追问 1：a 重复就违反唯一吗？** 答：不是，唯一的是完整 `(a,b)`；(1,2) 和 (1,3) 可以共存。

**追问 2：WHERE 条件写 b=2 AND a=1 会失效吗？** 答：当前循环按索引列查找条件，普通等值条件的文本顺序不等于 key 顺序；代码注释中“完全匹配、不能调条件顺序”已落后于当前实现，应以分支为准。

**追问 3：a>1 AND b=2，b 完全没用吗？** 答：它通常不能继续缩紧一个简单连续索引区间，但仍可以作为残余过滤排除不满足的候选行。

**小例子：** 已排序 `(1,1),(1,4),(2,1),(2,4)`：a=1 连续，b=1 分散。分别判断 a=1、a=1 and b=4、b=4、a>1 and b=4。

**常见误答：** “最左前缀是 SQL 文本里必须先写 a”“联合唯一要求每列各自唯一”。

**自测验收：** 能对上述四条谓词说出选择与残余条件。

**源码依据：** [规则选择](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/optimizer/planner.cpp:26)、[key 拼接](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/index_utils.h:8)、[逐列比较](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.h:49)。

### R14｜P0｜IndexScan 的候选范围与残余过滤

**简历锚点：** “支持 IndexScanExecutor”。

**学习目标：** 说明命中索引为什么还要读表和判断条件。

**必要概念：** 范围下界/上界决定候选 key 集；RID 再定位基表记录；残余过滤完整检查 WHERE。索引范围可以比条件宽，但不能漏掉应该返回的行，过滤只能去掉误选，不能补回漏选。

**主问：IndexScanExecutor 怎样执行一次查询？**

**60 秒答案：** beginTuple 先取表共享锁，再用每列最小值和最大值初始化复合边界，按前缀条件填入等值或范围，并保存端点是否包含。索引 get_range 返回候选 RID 列表，执行器逐条取基表记录，用完整条件再次过滤；Next 返回当前合格记录，nextTuple 向后找下一个。当前索引只存 key 和 RID，因此是回表扫描。边界构造必须特别测大于、小于、等值前缀加范围和重复约束；只测单列等值不足以证明复合范围正确。

**追问 1：索引已经筛过了为什么再判断？** 答：后续列和其他谓词可能未进入范围，复合开区间用极值填充时也可能过宽，需要完整条件去掉多取行。

**追问 2：残余过滤能保证正确吗？** 答：只能在候选集是正确结果超集时保证不多返回。如果边界错误把合格行排除，后面过滤找不回来，应把 IndexScan 与 SeqScan 结果集合对比。

**追问 3：当前实现有什么值得专项核查？** 答：边界标志跨列共用，且同列多个条件的覆盖顺序需要检查；例如同列 `a=3 AND a>=3` 与顺序互换，应都保留 a=3。这里提出待复现输入，不先宣称结果错误。

**小例子：** 索引 `(a,b)`，条件 a=2 AND b>5 AND c=9：索引生成候选，b 的开边界和 c=9 都应最终正确判断；输出应与顺扫一致。

**常见误答：** “走索引就不读基表”“有完整过滤就不用测范围边界”。

**自测验收：** 画出条件→边界→RID→记录→完整过滤，并解释误选与漏选差别。

**源码依据：** [边界生成](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_index_scan.h:102)、[范围获取和残余过滤](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_index_scan.h:158)、[有序条目范围扫描](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/index/ix_index_handle.cpp:153)。

### R15｜P1｜DML 为什么先收集 RID

**简历锚点：** “维护插入、更新、删除后的索引一致性”。

**学习目标：** 区分定位目标和实际修改。

**必要概念：** UPDATE/DELETE 同时需要查找与写入。如果访问路径本身也被修改，扫描位置可能移动。先保存目标 RID，可以让执行阶段使用一个稳定目标集合，但它不能单独保证事务原子性。

**主问：为什么 UPDATE 不直接边扫描边修改？**

**60 秒答案：** 当前 Portal 先构造扫描执行器，把满足条件的 RID 收集到 vector，再交给 UpdateExecutor 或 DeleteExecutor。这样修改索引键或删除条目时，不会直接改变正在前进的索引游标，减少漏处理和重复处理的风险。扫描阶段拿表共享锁，实际 DML 请求表排他锁，升级冲突由 no-wait 处理。RID 集合解决的是目标定位问题；某行或某个索引修改一半失败，仍然需要独立的撤销和异常处理机制。

**追问 1：更新索引列为什么危险？** 答：记录的 key 从小值变大值可能移动到扫描后方；原地边扫边改的实现若继续追着同一范围走，可能再次遇到它。当前先物化 RID 能避免直接依赖被改变的索引位置。

**追问 2：收集 RID 的代价？** 答：额外 O(命中行数) 内存和扫描阶段，结果巨大时需要分批或其他机制，并且分批必须重新考虑锁和语义。

**追问 3：先收集以后别人删了这些行怎么办？** 答：应由相应并发控制防止目标集合与数据失配。当前正常扫描持有表共享锁至事务结束，其他表排他写会冲突；不能把无锁场景的安全性归功于 RID vector。

**小例子：** 索引 key 为 1,2,3，把满足 key<3 的记录设为 5；先收集两条 RID，再修改。唯一约束可能让该 SQL 失败，这是原子性问题，另见 R16。

**常见误答：** “收集了 RID，所以失败一定全部回滚”“vector 自带事务隔离”。

**自测验收：** 分别指出 RID 收集、表锁、写集三个机制各解决哪个问题。

**源码依据：** [Portal 收集 RID](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/portal.h:75)、[UPDATE 获取排他锁](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:37)。

### R16｜P0｜多索引 UPDATE 与原子性边界

**简历锚点：** “维护插入、更新、删除后的索引一致性；提交/回滚”。

**学习目标：** 能按真实顺序分析失败，不用“有事务”代替推理。

**必要概念：** 原子性要求一个操作在规定边界内全成或全不成。涉及基表、多个索引、日志和写集时，每个可抛异常点都是中间状态。事务回滚只知道已经被完整记录到写集里的修改，不能自动知道遗漏的半成品。

**主问：UPDATE 如何维护索引？发生唯一冲突时一定原子吗？**

**60 秒答案：** 当前先读取旧记录并复制旧值，再形成新记录；逐个索引删除旧 key、插入新 key，当前索引插入失败时恢复它的旧 key。所有索引操作后才写 UPDATE 日志并 flush，修改基表，再把旧记录加入事务写集。这个流程有局部恢复，但不能说完整异常原子性已经保证：如果前一个索引已改、后一个索引冲突，catch 只恢复后一个索引，而且当前行还没有写集记录。服务端普通 RMDBError 也没有统一 abort 分支。这是静态代码可定位的边界，实际故障表现仍应按场景复现。

**追问 1：给一个具体的中间失败例子。** 答：A=(u=1,v=1)，B=(u=2,v=2)，u、v 各有唯一索引。把 A 改成 (u=3,v=2)：u 索引可能已从 1 改为 3，v=2 冲突后只恢复 v=1；基表 A 还没改。要检查 u 索引是否残留 3，而不能只 SELECT 全表。

**追问 2：整体 abort 能自动修好这个例子吗？** 答：不一定。当前行的 WriteRecord 在修改基表之后才追加，前面的索引半更新未进入写集，因此必须有操作局部撤销记录或先完整登记补偿信息。

**追问 3：你会怎么改？** 答：先对所有索引验证新键冲突，记录各步已完成状态，在异常时按反序补偿；同时统一语句失败与事务失败策略。预检查不能代替真正的回滚，因为内存分配、I/O 或并发仍可能在后续失败。改动后重点测试多行、多索引和每一步故障注入。

**状态走查：** 旧记录→新记录副本→索引 1 完成→索引 2 失败→检查索引 1、索引 2、基表、写集四个对象。把“应当一起回滚”和“当前确实回滚了哪些”分别写下来。

**常见误答：** “catch(...) 所以全部恢复”“有 WAL 就能修复内存里的所有半更新”“报错等于 abort”。

**自测验收：** 能指出异常发生前后的两个状态，并设计顺扫、索引查、重启后三组断言。

**源码依据：** [UPDATE 索引、日志、基表和写集顺序](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:41)、[普通错误处理](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:154)、[INSERT 顺序](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_insert.h:66)。

## 第四组：聚合、排序与连接的执行成本

### R17｜P1｜聚合状态与空输入语义

**简历锚点：** “聚合”。

**学习目标：** 从每行更新一个状态理解聚合，并核对支持边界。

**必要概念：** 聚合把多行变成少量结果。COUNT 累加行数；SUM 累加数值；MAX/MIN 保存当前最优值和是否初始化。空输入必须定义输出，不能把其他数据库的 NULL 语义原样套过来。

**主问：聚合在哪里实现，支持到什么程度？**

**60 秒答案：** 当前聚合主要在 QlManager::select_from 中，读取执行器输出后，为每个聚合列维护 count、整数和、浮点和及最大最小值状态。COUNT 每行加一，SUM 当前只接受 INT 和 FLOAT，MAX/MIN 通过通用类型比较更新保存值。空输入时 COUNT 输出 0，SUM 当前输出零，MAX/MIN 输出空字符串。不能把这个简化实现说成完整 SQL 聚合系统，也不能因 BIGINT 可存储就声称 SUM(BIGINT) 支持；Analyze 会拒绝它。

**追问 1：COUNT(*) 和 COUNT(col) 一样吗？** 答：在支持 SQL NULL 的数据库中前者数行、后者数非 NULL 值。当前没有在这条聚合路径里检查列 NULL，两者不能借用标准区别作已实现承诺。

**追问 2：SUM 为什么不能一律 int 累加？** 答：累加多个 INT 可能超过 32 位，所以当前用 int64_t sum_int；即使更宽也仍有极大输入溢出边界，应另测，不能说永远不会溢出。

**追问 3：聚合加 LIMIT 一定遵守标准 SQL 顺序吗？** 答：要检查执行树和聚合位置。当前 LIMIT 由 SortExecutor 对输入结果截断，而聚合在输出端继续累加；组合语义需要专项验证，不能由“分别支持聚合和 LIMIT”推导组合正确。

**小例子：** INT 行值 2,3,5：COUNT=3、SUM=10、MAX=5、MIN=2；再手推空输入。以上为按代码推演的预期。

**常见误答：** “支持 BIGINT 就支持 SUM(BIGINT)”“空表 MAX 一定返回 SQL NULL”“有聚合就有 GROUP BY”。

**自测验收：** 写出四个聚合状态和空输入结果，说明一个组合语义待测项。

**源码依据：** [SUM 类型限制](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/analyze/analyze.cpp:60)、[聚合状态与输出](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/execution_manager.cpp:182)。

### R18｜P1｜排序、LIMIT 与阻塞算子

**简历锚点：** “排序、LIMIT”。

**学习目标：** 从实现过程估算时间和内存。

**必要概念：** 阻塞算子需要先拿到大量或全部输入才能输出第一条。多列排序按第一个不同字段决定顺序。LIMIT 限制输出数；是否少扫描、少排序取决于算法，而不是 SQL 中出现 LIMIT 就自动成立。

**主问：ORDER BY ... LIMIT 10 是怎么执行的？**

**60 秒答案：** 当前 SortExecutor 在 beginTuple 中读完子执行器所有记录，存入 tuples_，用 stable_sort 按排序列及升降序比较，最后 resize 到 limit。于是 LIMIT 10 只保证最终最多十行，当前仍物化并排序全部输入。通常排序时间按 O(N log N) 理解，记录存储空间按 O(N×行宽)，stable_sort 本身还可能使用辅助内存。没有 ORDER BY 但有 LIMIT 时也会经过这个执行器，当前没有提前停止读取的优化。

**追问 1：为什么多列比较发现第一个不同就返回？** 答：这是字典序规则。比如先按 score 降序，score 相同时再按 id 升序。

**追问 2：stable_sort 保证结果跨运行相同吗？** 答：它保持当前输入中相等键的相对顺序；输入本身可能随访问路径变化。需要稳定分页时通常加入唯一键作最终排序条件。

**追问 3：怎样优化 LIMIT K？** 答：ORDER BY LIMIT K 可以考虑维护 K 大小的堆，时间约 O(N log K)、空间 O(K×行宽)；仅 LIMIT 可提前停止。超内存全排序可用外部归并。以上均是改进方向。

**小例子：** 行 `(score,id)` 为 (90,2),(90,1),(80,3)，ORDER BY score DESC,id ASC LIMIT 2，应取 (90,1),(90,2)。

**常见误答：** “LIMIT 10 只读取十行”“stable_sort 意味着无额外内存”。

**自测验收：** 分别解释普通排序、Top-K、只有限制三种场景的当前成本和可改进点。

**源码依据：** [排序物化与截断](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/execution_sort.h:36)、[LIMIT 也生成 SortPlan](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/optimizer/planner.cpp:277)。

### R19｜P0｜BNLJ 分块与复杂度

**简历锚点：** “BNLJ”。

**学习目标：** 解释优化的是哪类成本。

**必要概念：** 普通嵌套循环对每条左记录扫描所有右记录。块嵌套循环把多条左记录留在内存，右侧一条记录与整块左记录比较，从而多个左记录共用一轮右侧扫描。谓词比较总量仍可能接近左右行数乘积。

**主问：BNLJ 比普通 Nested Loop 改善在哪里？**

**60 秒答案：** 当前 NestedLoopJoinExecutor 使用约 8 MiB 的左块预算，根据左侧行宽算最多装多少行，再扫描右侧，让右侧每行与块内所有左行匹配；换下一块时重新 begin 右侧。若左侧 M 行、右侧 N 行、每块 K 行，右侧重扫从大约 M 次变成 ceil(M/K) 次，但最坏比较仍是 O(MN)。它降低重复读取和执行器扫描成本，没有变成哈希连接。另有无连接条件且右侧能缓存时的分支，可以缓存右侧处理笛卡尔积。

**追问 1：为什么行宽影响性能？** 答：同样字节预算下，行越宽 K 越小，块数越多，右侧重扫次数越多；提前过滤和去掉不必要列有潜在收益。

**追问 2：8 MiB 是进程实际内存上限吗？** 答：不是，代码按记录长度累计预算，vector、unique_ptr、分配器和临时连接记录还有开销，其他算子也占内存；不要把常量当 RSS 上限。

**追问 3：为什么不直接用 Hash Join？** 答：当前 BNLJ 利用已有迭代接口，能按通用条件比较；哈希连接适合等值条件，还需哈希表、内存不足处理和类型一致的哈希。可以作为后续优化，不说当前实现了。

**状态走查：** 左侧 5 行，每块 2 行，右侧 4 行：左块为 2、2、1，右侧扫描约 3 轮，最多仍做 20 对比较。右表空则没有结果，需走完正确结束状态。

**常见误答：** “BNLJ 把复杂度降成 O(M+N)”“8 MiB 就是缓冲池大小”“没有 ORDER BY 也必须固定输出顺序”。

**自测验收：** 独立推导 ceil(M/K) 次右扫，区分比较成本与读取成本。

**源码依据：** [块预算和加载](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_nestedloop_join.h:32)、[跨块推进](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_nestedloop_join.h:81)、[右侧缓存分支](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_nestedloop_join.h:135)。

## 第五组：事务、并发与失败的状态变化

### R20｜P1｜COMMIT 与事务生命周期

**简历锚点：** “事务提交”。

**学习目标：** 区分逻辑提交和耐久提交的完成时点。

**必要概念：** 事务有 id、状态、写集、锁集和上一条日志位置。COMMIT 表示接受事务效果；写集用于活跃事务回滚，提交后可释放。提交日志使重启恢复判断事务归属，但可靠确认需要考虑持久化与响应时机。

**主问：commit 具体做了什么？**

**60 秒答案：** 当前 commit 清理写集中的 WriteRecord，追加 CommitLogRecord 并更新 prev_lsn，把事务状态设成 COMMITTED，释放所持锁，随后 flush 日志，最后从事务表移除。它不是把所有修改的数据页立刻刷完。这里要如实说明两个顺序边界：锁在日志 flush 前释放，普通隐式事务的响应发送也在后面的自动 commit 前；而底层日志 write 没有 fsync。因此我只能说存在提交与日志调用流程，不能据此承诺任何断电点都满足持久性。

**追问 1：提交后为什么可以删写集？** 答：活跃事务的内存撤销信息已不再用于正常主动回滚，崩溃后依据持久日志恢复；但提交失败中途如何处理必须单独设计。

**追问 2：提交一定刷所有数据页吗？** 答：当前没有；一般数据库可以采用提交强制日志、数据页稍后写出的 no-force 方式，但必须满足 WAL 和恢复前提，不能直接把当前实现完整归类为已正确实现该策略。

**追问 3：应该在什么时候告诉客户端成功？** 答：对于需要持久性承诺的提交，应在必要日志确实持久之后再确认；释放锁和失败处理也要有清晰边界。当前代码顺序提示这部分需要进一步验证和改进。

**小例子：** “记录页仍只在内存、提交日志已可靠持久”在正确 WAL 设计下可以由 REDO 恢复；“客户端已成功、提交日志尚未可靠持久”就不能轻易承诺崩溃不丢。

**常见误答：** “COMMITTED 枚举设了就耐久”“flush_log_to_disk 的函数名证明物理落盘”。

**自测验收：** 按真实顺序列六步，并指出释放锁、flush、响应三者的位置。

**源码依据：** [commit 顺序](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/transaction_manager.cpp:52)、[隐式提交前响应](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:177)、[日志 write](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/disk_manager.cpp:161)。

### R21｜P0｜ABORT 写集逆序回滚

**简历锚点：** “事务回滚”。

**学习目标：** 按反向操作同时恢复基表与索引。

**必要概念：** 写集是事务已登记的修改历史。撤销插入要删除新行；撤销删除要重新插入旧行；撤销更新要恢复旧值。多次修改同一行时应从最后一次开始撤销，所以写集按栈式处理。

**主问：abort 如何恢复记录和索引？**

**60 秒答案：** 当前 abort 从 write_set 尾部取操作。撤销 INSERT 时先删对应索引，再删行；撤销 DELETE 时按原 RID 插回旧记录并重建索引；撤销 UPDATE 时读取当前记录，删当前 key，把旧字节写回，再插入旧 key。处理完写集后记录 ABORT，标状态、解锁并 flush 日志。逆序很重要：同一行从 10 改到 20 再改到 30，应先回 20 再回 10。这个机制覆盖已登记的修改，不代表未入写集的中间失败也自动被撤销。

**追问 1：只恢复表，不恢复索引会怎样？** 答：顺扫看似正确，旧 key 可能查不到，新 key 可能还指向记录，唯一检查也可能错误，必须分别验证。

**追问 2：同一事务 insert 后 update 再 abort？** 答：先撤销 update 恢复刚插入的值，再撤销 insert 删除该记录；最终回到事务开始前没有该行的状态。

**追问 3：回滚过程中再次失败怎么办？** 答：需要可恢复的撤销进度，例如补偿日志及 undo-next 等机制，或等价的设计。当前没有完整 CLR 方案，因此不能保证所有“回滚时再次崩溃”的情况都已解决。

**状态走查：** 索引 id=1，value=10→更新到 20→更新到 30；write_set 尾是旧值 20，下一条旧值 10，逆序恢复后 value=10，相关新键都消失。

**常见误答：** “abort 就清空写集”“恢复旧行会自动修好所有索引”“正序 undo 也一样”。

**自测验收：** 手推 INSERT→UPDATE→DELETE→ABORT，并为每步写出行与索引的最终状态。

**源码依据：** [逆序回滚与索引恢复](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/transaction_manager.cpp:81)、[UPDATE 保存旧记录](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:71)。

### R22｜P0｜表级 S/X 锁与并发范围

**简历锚点：** “表级锁”。

**学习目标：** 准确回答实际锁粒度，而不是列出接口数量。

**必要概念：** S 共享锁允许多个读取者共存；X 排他锁与其他事务的 S/X 均冲突。表锁覆盖整张表，粒度粗但实现简单。IS/IX 是多粒度锁的意向模式；有记录锁接口不代表正常 SQL 路径已经使用细粒度锁。

**主问：RMDB 的读写并发靠什么控制？**

**60 秒答案：** 当前 SeqScan 和 IndexScan 在 beginTuple 时申请表共享锁，Insert、Update、Delete 在写入前申请表排他锁。锁管理器记录每个资源的已授予请求，检查兼容性，冲突立即抛事务中止异常。正常业务路径主要是表级控制，所以不同事务即使更新同表不同 RID 也会互相排斥。代码里有记录锁和 IS/IX 接口，但不能因此说当前实现了高并发完整多粒度协议，更不能说有 MVCC。

**追问 1：T1 读表，T2 读表，T3 写表？** 答：T1/T2 的 S 可以共存；T3 的 X 与它们冲突，按 no-wait 中止请求者。

**追问 2：为什么 UPDATE 可能从 S 升级到 X？** 答：Portal 先扫描收集 RID，扫描拿 S，执行 DML 时申请 X；若其他事务仍有 S，升级就会冲突。

**追问 3：怎样提高同表不同记录的写并发？** 答：需要规划表意向锁加记录锁、访问路径和锁升级规则，并处理范围条件的幻读问题。只是把表锁换成行锁还不足以声明保持相同隔离性质。

**小例子：** T1 更新 id=1，T2 更新 id=100；当前同表 X 锁仍冲突，即使业务行互不相同。

**常见误答：** “不同 RID 一定可以同时写”“有 record lock 函数所以 SQL 用行锁”“表锁就是 serializable 的完整证明”。

**自测验收：** 画 S/S、S/X、X/X 兼容表，指出当前锁申请的执行器位置。

**源码依据：** [共享表锁](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_seq_scan.h:50)、[写表锁](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_insert.h:40)、[兼容矩阵](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/concurrency/lock_manager.cpp:6)。

### R23｜P0｜no-wait 与冲突回滚

**简历锚点：** “no-wait 并发控制”。

**学习目标：** 用等待图解释策略，再说明失败代价。

**必要概念：** 数据库死锁需要事务相互等待形成环。no-wait 遇到不兼容锁立即失败，不把请求挂起等待，所以在该锁协议内部不形成等待环。它不保证事务最终都成功，也不解决进程中所有 mutex 使用错误。

**主问：no-wait 为什么能避免死锁，有什么代价？**

**60 秒答案：** 锁管理器发现别的事务持有不兼容锁时，直接抛 TransactionAbortException，服务端对应 catch 调用 abort。由于事务不等待锁，自然不会形成事务锁等待环，也不需要等待图检测。代价是热点下回滚多、重复工作多，某事务可能反复失败，吞吐和公平性要通过实验评估。可在客户端做有上限的退避重试，但不能自动重试不可重复的外部副作用，也不能宣称当前已经有完整重试系统。

**追问 1：T1 持 A 要 B，T2 持 B 要 A？** 答：后请求冲突锁的一方立即中止并回滚释放所持锁，不会双方都无限等待；具体谁成功依赖执行时序。

**追问 2：异常一抛锁就释放了吗？** 答：锁申请函数抛异常本身不等于回滚完成；需要服务端 catch 路径调用 TransactionManager::abort 释放事务已有锁。要追到上层错误处理。

**追问 3：和 wait-die、wound-wait 有何不同？** 答：后两者按事务年龄决定等待或中止，no-wait 不比较年龄，一律冲突即失败。此处只需理解选择代价，不需要认领项目实现了这些其他策略。

**状态走查：** T1 拿表 S；T2 申请 X→异常→T2 abort；T1 保持 S 继续工作。T2 重试应等新事务边界，不复用半失败状态。

**常见误答：** “no-wait 就是不加锁”“抛异常会自动撤销所有内存状态”“没有死锁所以并发一定高”。

**自测验收：** 两句话解释无等待环，再列回滚成本、饥饿和重试三项代价。

**源码依据：** [冲突立即抛异常](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/concurrency/lock_manager.cpp:56)、[上层触发 abort](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:139)、[解锁和 SHRINKING](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/concurrency/lock_manager.cpp:129)。

## 第六组：基础 WAL 与恢复边界

### R24｜P0｜WAL、物理日志与落盘顺序

**简历锚点：** “WAL 物理日志 redo/undo”。

**学习目标：** 先懂原则，再核对每一条持久化路径。

**必要概念：** WAL 的核心约束是：数据修改写到稳定存储之前，相应日志必须先可靠持久；要向客户端承诺提交，提交记录也要达到要求的持久级别。当前日志记录表名、RID 和行字节镜像；UPDATE 有旧值和新值，属于基于记录镜像的物理恢复信息，不是重新执行 SQL，也不是整页镜像日志。

**主问：你如何实现 WAL？当前有什么边界？**

**60 秒答案：** 当前 DML 生成 INSERT、DELETE、UPDATE 日志，日志有事务 id、LSN 和 prev_lsn，日志管理器序列化到缓冲区并通过 write_log 追加文件。UPDATE/DELETE 在改基表记录前显式 flush 日志；但 INSERT 是先插记录后生成日志，记录层还会写文件头。缓冲池淘汰没有比较 pageLSN 与持久 LSN，底层 write_log 未见 fsync。因此应表述为基础物理日志和 WAL 相关流程，不能证明严格满足所有崩溃点的 write-ahead 与断电持久性。

**追问 1：为什么 UPDATE 同时保留旧值、新值？** 答：REDO 要重建修改后的状态，UNDO 要恢复修改前状态；只存新值不能一般性恢复旧值，只存旧值也不够重做。

**追问 2：pageLSN 和 persistLSN 理论上怎么配合？** 答：pageLSN 表示页上最后一次修改的日志序号；写页前需要保证日志至少持久到该序号。当前 Page 有 LSN 接口，但本轮查看 DML、记录层和缓冲淘汰路径未见完整使用链，接口存在不是机制已闭环。

**追问 3：kill -9 测试能证明断电安全？** 答：不能。杀进程一般保留操作系统页缓存，真实掉电会丢失尚未同步到稳定存储的内容。需要把故障模型说清，分别测试进程崩溃、写失败、部分日志和更强故障假设。

**状态走查：** 原理要求“日志可靠持久→相关脏数据页可持久”；当前 INSERT 是“改记录→写插入日志”，若间隙发生写页/崩溃，必须专项检查，而不是凭函数名称判定符合 WAL。

**常见误答：** “日志在 SQL 返回前写过就一定 WAL”“write 等于 fsync”“项目实现了完整 ARIES”。

**自测验收：** 用箭头画正确原则，再圈出当前 INSERT、页淘汰、日志同步三个待验证环节。

**源码依据：** [INSERT 先改记录](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_insert.h:75)、[UPDATE 日志顺序](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:62)、[日志缓冲](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_manager.cpp:19)、[底层写日志](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/storage/disk_manager.cpp:161)。

### R25｜P1｜启动 analyze、redo、undo

**简历锚点：** “redo/undo”。

**学习目标：** 自己给日志分类并排执行顺序。

**必要概念：** 崩溃时内存事务状态消失，需要从日志判断哪些事务提交、终止或仍活跃。REDO 重建应保留的新值，UNDO 移除不应保留的未完成修改。顺序操作之间有依赖，重做通常按前进顺序、撤销按反序。

**主问：RMDB 启动恢复三步分别做什么？**

**60 秒答案：** 当前 analyze 一次读取日志文件，按日志头长度解析记录，维护 committed、aborted 和 active 集合，遇到不完整或不认识的尾记录会停止。redo 正向遍历日志，只重放 committed 事务的 INSERT/DELETE/UPDATE。undo 反向遍历日志，只撤销 active 事务，然后 flush 表页。代码采用“已提交重做、活跃撤销”的基础方案，不能等同于 ARIES 的重复历史重做，也不能假设所有日志损坏和交错恢复都已覆盖。

**追问 1：T1 更新 10→20 提交，T2 更新 20→30 未提交，恢复后呢？** 答：在表页与 RID 等前提有效的这个简单例子中，重做 T1 得 20，再撤销 T2 恢复旧值 20，最终应为 20；这只是教学推演，复杂交错还要测试。

**追问 2：为什么 UNDO 反向？** 答：事务连续更新 10→20→30，后一步旧值是 20，前一步旧值是 10；反向恢复得到 10，正向会最后停在 20。

**追问 3：已经有 ABORT 记录的事务怎么处理？** 答：当前从 active 集合移除，既不按提交事务 redo，也不按 active undo；这依赖之前撤销效果已经可靠落盘的前提。若 abort 日志可见而撤销数据页未可靠持久，恢复正确性需要专项核查。

**小例子：** 日志 BEGIN T1、UPDATE T1、COMMIT T1、BEGIN T2、INSERT T2：committed={T1}、active={T2}；执行 T1 的 redo 和 T2 的 undo。

**常见误答：** “redo 就是执行全部日志”“abort 事务在启动时一定再撤销一次”“有 analyze/redo/undo 名称就等于 ARIES”。

**自测验收：** 给自己写六条日志，独立分三类事务并排出恢复动作。

**源码依据：** [日志分析](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_recovery.cpp:126)、[REDO](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_recovery.cpp:177)、[UNDO](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_recovery.cpp:192)、[启动调用](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/rmdb.cpp:294)。

### R26｜P1｜恢复幂等、索引重建与 ARIES 边界

**简历锚点：** “基础恢复、索引一致性”。

**学习目标：** 回答重启一次与恢复可重复的差别。

**必要概念：** 幂等指重复执行不会继续改变最终结果。恢复自身也可能崩溃，因此不能只考虑一次从头跑完。索引可由基表重建时，基表是重建来源；基表恢复错误不会被索引重建自动修好。

**主问：重启后索引和记录如何保持一致？是否有完整 ARIES？**

**60 秒答案：** open_db 打开表和索引后，扫描基表重建内存有序索引；恢复时各条记录的 redo/undo 也同步删除旧索引和插入新索引。部分操作通过检查 RID 是否存在选择插入、更新或跳过，是基础幂等处理，但不能据此证明任意日志反复重放都正确。当前没有完整 checkpoint、脏页表、CLR 和按 prev_lsn 链撤销的流程，redo 也只处理提交事务。因此项目应称基础恢复。特别是重启后事务 ID/LSN 的接续、撤销中再崩溃和 RID 复用，值得优先验证。

**追问 1：prev_lsn 字段存在为什么还不算完整链式 undo？** 答：当前日志会保存该字段，但 RecoveryManager::undo 实际使用 logs_.rbegin 到 rend 全局反向遍历，并未沿每个事务的 prev_lsn 访问上一条待撤销记录。

**追问 2：当前最大的重启状态疑点是什么？** 答：事务管理器 next_txn_id 和日志 global_lsn 初始为 0，所查看启动恢复路径未见从历史最大值推进的逻辑。若旧日志保留而编号复用，按事务 id 的分类可能混淆新旧事务，应写连续两次重启用例复现；本轮没有运行结论。

**追问 3：索引重建能替代日志吗？** 答：不能，重建只能反映基表当时的内容；如果基表包含未提交或丢失已提交数据，必须先有正确恢复语义，索引才有正确来源。

**小例子：** 先提交并退出，再启动产生新事务后崩溃，再次启动；同时检查事务编号、基表结果和索引结果，不能只做一个干净重启。

**常见误答：** “有存在性判断所以完全幂等”“重建索引会自动恢复丢失记录”“记录了 prev_lsn 就是 ARIES”。

**自测验收：** 能列三项当前实现与完整 ARIES 的差别，并说明它们各影响什么。

**源码依据：** [打开时重建](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/system/sm_manager.cpp:101)、[恢复记录存在性分支](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_recovery.cpp:16)、[事务编号初值](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/transaction_manager.h:71)、[日志编号初值](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/recovery/log_manager.h:350)。

## 第七组：把会讲转化为可核验的项目经历

### R27｜P1｜单测、并发脚本与恢复脚本如何验证

**简历锚点：** “通过单测、并发脚本和恢复脚本验证关键路径”。

**学习目标：** 准确说明已有陈述与本轮证据的区别。

**必要概念：** 测试需要环境、输入、断言和结果。单测验证小范围不变量；SQL 集成测试贯穿多层；并发测试需要可控时序；恢复测试需要故障点和重启后的持久状态断言。脚本存在或学习计划写了“通过”不等于有真实执行记录。

**主问：你怎么证明这些功能是对的？**

**60 秒答案：** 我按层次准备证据：存储单测检查 pin、dirty、淘汰和 slot 复用；SQL 测试检查类型边界、唯一冲突、扫描结果与排序聚合；并发脚本用两个连接建立明确锁冲突，并在 abort 后检查写入消失；恢复脚本在日志、记录修改和提交附近设置崩溃点，重启后分别检查已提交保留、未提交撤销和索引一致。当前源码可见 GoogleTest 用例和构建目标，简历陈述历史验证过关键路径，但本轮只做静态审阅，未获得新的运行通过日志，也不宣称全部隐藏测试或生产性能。

**追问 1：怎样测脏页淘汰而不是只测缓存读取？** 答：使用小缓冲池，写 A 并 unpin(true)，引入足够多其他页迫使 A 被淘汰，再 fetch A；检查读回修改值，且确认确实发生替换路径。

**追问 2：并发测试为什么不能只开很多线程？** 答：线程多不保证命中目标交错。用两个会话和同步点让 T1 先持锁，T2 再请求冲突锁，断言 T2 abort、T1 可继续，避免把偶然未撞上冲突当成成功。

**追问 3：恢复后 SELECT 正确就够吗？** 答：不够。还需旧 key 查不到/查得到、新 key 消失/存在、唯一插入检查、再次重启和中途再次崩溃；查询要对照顺扫和索引访问，防止只验证一条路径。

**小例子：** 证据记录模板：日期｜commit｜环境｜命令｜初始表｜并发/崩溃时序｜预期｜实际｜日志文件。没有实际列就标“待执行”。

**常见误答：** “编译成功说明并发正确”“脚本文件在所以跑过”“本地一条测试通过说明课程满分”。

**自测验收：** 为 pin 泄漏、唯一冲突、no-wait、未提交崩溃各写一个可观察断言。

**源码依据：** [现有 GoogleTest 用例](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:195)、[索引范围用例](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/unit_test.cpp:666)、[unit_test 构建目标](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/CMakeLists.txt:24)、[旧学习计划的基线要求](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/RMDB项目详细学习方案.md:76)。

### R28｜P1｜项目难点、取舍与诚实深挖

**简历锚点：** “独立完成题目 1-11；功能扩展与关键路径验证”。

**学习目标：** 形成可承受追问的难点回答，而非虚构故事。

**必要概念：** 好的项目回答连接问题、约束、方案、验证和限制。个人真实经历要由本人补充，不能把本资料发现的风险伪装成自己当时解决过的故障。能解释尚未解决的问题，通常比过度承诺更可靠。

**主问：最有挑战的部分是什么，如果重做优先改哪里？**

**60 秒答案：** 我会选择自己能画状态变化的链路，例如记录、索引与事务回滚的协同。难点在于一条 SQL 会改变多个对象，不是每个模块单独能运行就整体正确；要把旧值、key、RID、写集和日志的顺序对齐，并检查中间异常。当前代码能看到基础同步与回滚流程，也存在多索引更新和日志顺序的边界。若重做，我会先把异常原子性和持久性契约补清并加故障用例，再优化索引结构或连接性能。具体“当时我修过哪一个 bug”只讲自己有记录、能够复述的那一个。

**追问 1：为什么不先做完整 B+ 树提高性能？** 答：性能优化应建立在结果正确和失败恢复可解释的基础上；已有数据规模、测试范围也未证明索引性能是最先要解决的瓶颈。

**追问 2：你能给性能提升数字吗？** 答：没有实测记录就不给。可以说明复杂度、预算常量和预计收益，再设计固定数据量、选择率、缓存冷热、并发度与重复次数的基准，报告原始结果和环境。

**追问 3：面试官追到你没实现的模块怎么办？** 答：先说“这部分是框架或当前版本的简化范围，我可以解释原理，但不作为我的已完成实现”；再回到自己能证明的调用关系和关键分支，不猜测整个系统结构。

**小例子：** 准备真实经历填空：“在【测试输入】下看到【实际现象】，定位到【函数/不变量】，修改【本人实际动作】，用【命令与输出】验证；剩余限制是【边界】。”未填写实际证据时，不把模板读成经历。

**常见误答：** “最大难点是项目很大”“性能提高 50% 但记不清怎么测”“本教程指出的缺口我当时都修好了”。

**自测验收：** 讲一个两分钟难点回答，面试官连续问“为什么、失败怎么办、怎么验证”时每次都有具体状态或证据。

**源码依据：** [多对象修改链](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/execution/executor_update.h:41)、[回滚链](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/src/transaction/transaction_manager.cpp:81)、[实际功能/归属记录](/E:/BaiduNetdiskDownload/Anything/git_compare/rmdb/RMDB_TASKS_AND_ATTRIBUTION.md:1)。

## 最后 15 分钟的闭卷验收

这不是新题目，不计入题库数量。它把前面 28 张卡串成一条检查链：

1. 画出 SQL→Parser→Analyze→Planner→Portal→Executor→Record/Index→BufferPool→Disk，每个节点说一个职责。
2. 手推 fetch 两次、dirty unpin、只读 unpin、淘汰；再画满记录页删除后复用空槽。
3. 用 `(a,b)` 复合索引解释最左前缀、RID 回表、残余过滤，并说明当前容器是什么。
4. 讲 UPDATE 的真实修改顺序；用两个唯一索引解释局部恢复为何不足以证明原子性。
5. 讲 S/X、no-wait、写集反向撤销；最后画日志先于数据持久的原则，并指出当前实现哪些地方还需要验证。

评分：每条 0 分=只能认词，1 分=能讲主流程，2 分=能手推失败并说出边界。五条共 10 分，至少 8 分且第 4、5 条均不为 0，才适合把 RMDB 作为主讲项目。未达标时回对应卡片复习，不扩展新的项目结构题。

内容统计：28 个主问，84 个递进追问，均附答案；18 个 P0，10 个 P1。全部例子为教学推演或待执行测试设计；没有把本次静态核查写成测试通过。
