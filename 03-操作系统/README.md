# 操作系统与 Linux

## 阅读导航

- [Q43-Q57 高频题详解](高频题详解.md)：进程线程、内存、文件、I/O 与 Linux 排障。
- [三道计算题](高频题详解.md#三道计算题)：页表大小、有效访问时间与 LRU 缺页次数。
- [Q43-Q57 逐题答案入口](../08-题库/答案索引.md#os)：先闭卷口述，再对照机制和验证方法。

## 1. 进程、线程与调度

- 进程地址空间、PCB、线程共享/私有资源、用户态与内核态。
- 创建与退出：fork、exec、wait；僵尸进程、孤儿进程、守护进程。
- 上下文切换的保存内容与成本；系统调用和中断的差异。
- 调度目标、时间片、优先级、吞吐与响应时间。
- IPC：管道、消息队列、共享内存、信号量、Socket；比较复制成本和同步需求。
- 协程是用户态调度机制，需结合阻塞 I/O、栈和运行时说明。

## 2. 同步、并发与死锁

- 临界区、原子性、可见性、有序性。
- mutex、rwlock、spinlock、semaphore、condition variable、futex 的用途。
- 死锁四条件；锁顺序、超时、try-lock、检测与回滚。
- 生产者消费者、读者写者、哲学家问题的状态与不变量。
- 优先级反转、惊群、伪共享和锁竞争。

## 3. 内存管理

- 虚拟地址、页表、多级页表、TLB、页大小和地址转换。
- 缺页异常、按需分页、换入换出、工作集与抖动。
- 写时复制、共享内存、mmap、匿名映射、内存映射文件。
- 进程布局：text/rodata/data/bss/heap/mmap/stack。
- 分配器基本思路：空闲链表、size class、arena、碎片与缓存。

高频计算题：页号/页内偏移、页表大小、有效访问时间、页面置换过程。

## 4. 文件系统与 I/O

- fd、file、inode、dentry 的关系；硬链接和软链接。
- 页缓存、buffered/direct I/O、fsync、崩溃一致性。
- 阻塞/非阻塞与同步/异步是两个维度。
- select/poll/epoll 的数据结构和复杂度；LT/ET 的读取规则。
- 零拷贝要说明具体路径：mmap、sendfile、splice、DMA，而不是笼统说“零次复制”。

## 5. Linux 排障最小工具集

| 目标 | 命令 |
| --- | --- |
| 进程/线程 | `ps -efL`、`top -H`、`pidstat -p PID 1` |
| 系统调用 | `strace -ff -tt -p PID` |
| 文件/句柄 | `lsof -p PID`、`ls -l /proc/PID/fd` |
| 网络 | `ss -lntp`、`ss -s` |
| 内存 | `pmap -x PID`、`cat /proc/PID/smaps` |
| CPU 性能 | `perf top`、`perf record/report` |
| 崩溃 | `gdb BINARY CORE`、`bt`、`thread apply all bt` |

## 6. 实验

1. fork 后分别修改内存，用 `/proc/PID/maps` 和缺页统计观察 COW。
2. 用两个进程通过 pipe、共享内存和 TCP 传同量数据，比较接口与同步方式。
3. 写阻塞与非阻塞 Socket 版本，记录 EAGAIN 和 epoll 事件。
4. 构造死锁，用 GDB 查看各线程栈，再通过固定锁顺序修复。
5. 对大文件比较 read/write、mmap、sendfile 的调用链和指标。

本地材料：

- [操作系统目录](../repos/cyc2018-cs-notes/notes/计算机操作系统%20-%20目录.md)
- [进程管理](../repos/cyc2018-cs-notes/notes/计算机操作系统%20-%20进程管理.md)
- [内存管理](../repos/cyc2018-cs-notes/notes/计算机操作系统%20-%20内存管理.md)
- [死锁](../repos/cyc2018-cs-notes/notes/计算机操作系统%20-%20死锁.md)
- [Linux](../repos/cyc2018-cs-notes/notes/Linux.md)

