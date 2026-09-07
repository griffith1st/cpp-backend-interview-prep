# 计算机网络与高性能网络编程

## 阅读导航

- [系统复习文档完整版](系统复习文档.md)：此前 20 章长文，含课程知识、简历项目映射、计算题、实验与 POP3 专项。

- [Q58-Q74 高频题详解](高频题详解.md)：TCP 状态与可靠性、HTTP/TLS/DNS、非阻塞连接与背压。
- [计算和抓包练习](高频题详解.md#计算和抓包练习)：用数量级和数据包证据检验口述结论。
- [Muduo 源码路线与参考](高频题详解.md#muduo-源码路线与参考)：把协议问题关联到服务端实现。
- [Q58-Q74 逐题答案入口](../08-题库/答案索引.md#network)：直接跳转每道原题对应的答案。

## 1. 分层与一次请求

必须能串起：域名解析 -> 路由/ARP -> TCP 或 QUIC 建连 -> TLS -> HTTP -> 负载均衡 -> 服务处理 -> 响应。回答时说明每层的地址、数据单元、关键状态和常见失败。

## 2. TCP/UDP

- TCP 头部关键字段、序号/确认号、MSS、窗口、校验和。
- 三次握手为何不是两次；初始序号；SYN 重传与队列。
- 四次挥手、半关闭、TIME_WAIT 的作用、CLOSE_WAIT 的根因。
- 滑动窗口、接收窗口、拥塞窗口、慢启动、拥塞避免、快速重传/恢复。
- 超时重传、重复 ACK、累计确认、乱序、Nagle 与 delayed ACK。
- 粘包是字节流边界问题；用长度字段、分隔符或定长消息做 framing。
- UDP 的报文边界、无连接特性及可靠 UDP 需要补充的机制。

## 3. 应用层

- DNS：递归/迭代、缓存、TTL、A/AAAA/CNAME。
- HTTP 方法、状态码、幂等性、缓存头、Cookie/Session、长连接。
- HTTP/1.1 队头阻塞，HTTP/2 多路复用/HPACK/流控，HTTP/3 基于 QUIC。
- TLS：ClientHello、证书链验证、密钥协商、Finished、会话恢复。
- WebSocket、RPC、序列化、服务发现和负载均衡的基本取舍。

## 4. Socket 与 I/O 多路复用

服务端调用链：

```text
socket -> setsockopt -> bind -> listen -> accept
       -> nonblocking -> epoll_ctl -> epoll_wait
       -> read until EAGAIN -> decode -> handle -> buffered write
```

- 解释阻塞/非阻塞、同步/异步，不混用概念。
- select 有 fd 数量/拷贝/遍历问题；poll 改善数量限制但仍线性扫描。
- epoll 将关注集合放在内核并提供就绪事件；ET 下必须非阻塞并读写到 EAGAIN。
- Reactor 分离事件分发和处理；one loop per thread 是常见而非唯一模型。
- 连接管理必须考虑超时、半包、慢客户端、背压、优雅关闭和 fd 上限。

## 5. 高频故障定位

| 现象 | 优先检查 |
| --- | --- |
| 大量 TIME_WAIT | 主动关闭方、短连接、连接池、端口范围，不先粗暴调内核参数 |
| 大量 CLOSE_WAIT | 应用收到 FIN 后未 close，检查连接生命周期和异常路径 |
| connect 超时 | 路由、防火墙、监听、SYN 队列、丢包 |
| accept 变慢 | backlog、全连接队列、事件循环阻塞、fd 上限 |
| 延迟尖刺 | 重传、GC/锁、队列、DNS、下游、磁盘；用时间线证据区分 |
| 吞吐上不去 | 单连接窗口、带宽时延积、拷贝、系统调用、锁和应用处理 |

命令：

```bash
ss -s
ss -antp
tcpdump -i any -nn 'tcp port PORT'
curl -v --trace-time URL
```

## 6. Muduo 阅读线

按以下顺序读，不从所有 example 开始：

1. `muduo/net/EventLoop.*`
2. `muduo/net/Poller.*` 与 epoll 实现
3. `muduo/net/Channel.*`
4. `muduo/net/Acceptor.*`、`TcpServer.*`
5. `muduo/net/TcpConnection.*`、`Buffer.*`
6. `EventLoopThreadPool.*` 与定时器
7. Echo 测试和一个完整 example

本地材料：

- [网络目录](../repos/cyc2018-cs-notes/notes/计算机网络%20-%20目录.md)
- [传输层](../repos/cyc2018-cs-notes/notes/计算机网络%20-%20传输层.md)
- [HTTP](../repos/cyc2018-cs-notes/notes/HTTP.md)
- [Socket](../repos/cyc2018-cs-notes/notes/Socket.md)
- [Muduo 源码](../repos/chenshuo-muduo/muduo/net)

