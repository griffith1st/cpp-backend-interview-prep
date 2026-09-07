# C++ 面试考点

## 阅读导航

- [系统复习文档](系统复习文档.md)：12 章串起语言、资源、STL、并发和工程验证。

- [Q1-Q42 面试题详解](面试题详解.md)：逐题提供口述答案、机制与边界、反例或验证方法，默认 C++17。
- [语言与对象模型 Q1-Q19](面试题详解.md#q1)
- [STL、模板与工具链 Q20-Q30](面试题详解.md#q20)
- [并发、内存模型与性能 Q31-Q42](面试题详解.md#q31)
- [对应抽题清单](../08-题库/高频问题.md)：本章保留该清单的原题号，便于盲答后对照。

复习顺序：先关掉答案口述，再对照机制与边界，最后完成每题的验证思路。标注“片段”的代码只展示局部语义，并非完整程序；工具检测到的问题是证据，某次运行正常不是正确性证明。

下文 `repos/` 下的本地参考材料是可选子模块，需按 [仓库恢复说明](../README.md) 初始化后阅读；本章新增的 Q1-Q42 题解不依赖这些子模块。

## 1. 语言基础

必须掌握：

- 基本类型宽度与平台差异、整数提升、符号转换、溢出与未定义行为。
- 声明/定义、作用域、链接属性、存储期、对象生命周期。
- 初始化：默认、值、直接、拷贝、列表初始化；窄化转换。
- 指针、引用、数组、函数指针、const 的顶层/底层语义。
- static、inline、constexpr、consteval、thread_local 的作用。
- overload resolution、默认参数、隐式转换、explicit、用户自定义转换。

高频追问：`sizeof` 与数组退化、悬空引用、严格别名、对齐、大小端、宏与 inline 的差异。

## 2. 对象模型与资源管理

- 构造/析构顺序、成员初始化顺序、委托构造、异常中的析构。
- 拷贝/移动构造与赋值，Rule of 0/3/5，copy-and-swap。
- RAII、资源所有权、强/基本/不抛异常保证。
- 继承、访问控制、虚函数、纯虚函数、抽象类、虚析构、对象切片。
- vptr/vtable 的常见实现模型；不要把具体 ABI 布局说成语言标准保证。
- 多继承、虚继承、菱形继承、RTTI、dynamic_cast。

手写任务：

1. 管理文件描述符的仅移动 RAII 类。
2. 支持深拷贝和移动的动态数组类。
3. 简化版 `unique_ptr`、引用计数控制块和 `weak_ptr` 思路。

## 3. 现代 C++

- 左值、将亡值、纯右值；`std::move` 只做转换，不执行移动。
- 转发引用、引用折叠、`std::forward`、完美转发的限制。
- `auto`/`decltype` 推导、lambda 捕获与泛型 lambda。
- `constexpr`、结构化绑定、`if constexpr`、fold expression。
- `optional`、`variant`、`any`、`string_view` 的生命周期风险。
- Concepts/Ranges 了解用途；面试核心仍是 C++11/14/17。

本地材料：

- [现代 C++ 中文教程](../repos/changkun-modern-cpp-tutorial/README-zh-cn.md)
- [教程代码](../repos/changkun-modern-cpp-tutorial/code)
- [C++ Core Guidelines](../repos/isocpp-core-guidelines/CppCoreGuidelines.md)

## 4. STL 与泛型

| 容器 | 结构/特征 | 高频追问 |
| --- | --- | --- |
| vector | 连续内存、摊还扩容 | capacity、扩容移动、迭代器失效、reserve/resize |
| deque | 分段连续 | 首尾插入、随机访问、缓存局部性 |
| list | 双向链表 | splice、稳定迭代器、额外内存 |
| map/set | 通常为平衡树 | O(log n)、有序遍历、自定义比较器 |
| unordered_map/set | 哈希桶 | load factor、rehash、冲突、最坏复杂度 |
| priority_queue | 堆适配器 | Top K、自定义比较器、建堆复杂度 |

还要掌握 iterator category、algorithm、allocator 基本职责、emplace 的边界、erase/remove 惯用法和常用容器的线程安全规则。

本地材料：[STL 总结](../repos/huihut-interview/STL/STL.md)

## 5. 并发与内存模型

- thread 生命周期、join/detach、mutex、recursive_mutex、shared_mutex。
- lock_guard、unique_lock、scoped_lock；锁顺序和异常安全。
- condition_variable 必须使用谓词循环，理解虚假唤醒和丢失唤醒。
- promise/future/packaged_task/async 的基本关系。
- data race 与 race condition；sequenced-before、synchronizes-with、happens-before。
- atomic、CAS、memory_order_relaxed/acquire/release/seq_cst。
- ABA、伪共享、缓存一致性；无锁不等于更快。

手写任务：有界阻塞队列、线程池、读多写少缓存。每个实现都要补停止流程、异常路径和竞态测试。

## 6. 编译、链接与调试

- 预处理 -> 编译 -> 汇编 -> 链接；头文件保护和 PImpl。
- 符号、重定位、name mangling、静态库/动态库、运行时装载。
- ODR、模板定义为何通常在头文件、inline 变量。
- 栈帧、调用约定、core dump、Debug/Release 差异。
- CMake target 思维：`add_library`、`target_link_libraries`、作用域和生成器。

最低工具要求：

```bash
g++ -std=c++17 -Wall -Wextra -Wpedantic -g main.cpp
g++ -std=c++17 -fsanitize=address,undefined -fno-omit-frame-pointer main.cpp
gdb ./a.out
```

## 7. 面试验收题

1. `new/delete` 与 `malloc/free` 的语义差异是什么？
2. vector 扩容时为什么可能复制而不是移动？
3. shared_ptr 的控制块通常包含什么，`make_shared` 有何取舍？
4. 构造函数和析构函数中调用虚函数会发生什么？
5. 返回局部对象何时发生 RVO/NRVO，何时不应手写 `std::move`？
6. unordered_map 何时 rehash，哪些引用/指针/迭代器失效？
7. 条件变量为什么要在循环中检查条件？
8. acquire/release 如何建立跨线程可见性？
9. 一个符号“未定义引用”可能在哪些阶段和配置产生？
10. 如何系统定位崩溃、内存越界、数据竞争和性能回退？

主参考入口：[C/C++ 面试总纲](../repos/huihut-interview/README.md)

