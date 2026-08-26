# 已拉取的 GitHub 仓库

这些目录由上级 `Pre` 知识库以 Git submodule 统一管理，均使用 `--depth 1 --no-tags --filter=blob:none` 浅克隆。仓库的 Git 历史仍保留在各自目录中，可在对应目录执行 `git remote -v` 和 `git log -1`。从主仓库完整恢复资料时使用 `git clone --recurse-submodules`，或在已有克隆中执行 `git submodule update --init --recursive`。

| 本地目录 | GitHub | 用途 |
| --- | --- | --- |
| `huihut-interview` | `huihut/interview` | C/C++、STL、数据结构、算法、系统、网络、面试经验 |
| `cyc2018-cs-notes` | `CyC2018/CS-Notes` | 中文 OS、网络、数据库、Linux、系统设计与算法复习 |
| `changkun-modern-cpp-tutorial` | `changkun/modern-cpp-tutorial` | C++11 至 C++26 教程、中文书和示例代码 |
| `zhedahht-coding-interview-chinese2` | `zhedahht/CodingInterviewChinese2` | 剑指 Offer C++ 源码与经典题型 |
| `youngyangyang-leetcode-master` | `youngyangyang04/leetcode-master` | 中文算法路径、题解和思维导图 |
| `cmu-bustub` | `cmu-db/bustub` | 数据库内核课程项目：缓冲池、B+ 树、执行器、事务 |
| `chenshuo-muduo` | `chenshuo/muduo` | C++11 Linux 事件驱动网络库与测试 |
| `donnemartin-system-design-primer` | `donnemartin/system-design-primer` | 系统设计、容量估算、架构案例和 Anki |
| `isocpp-core-guidelines` | `isocpp/CppCoreGuidelines` | C++ 设计、接口、资源管理和并发最佳实践 |
| `voice-interview-reference` | `0voice/interview_internal_reference` | 国内公司面经及 MySQL、Redis、网络、内存等专题 |

推荐顺序：`huihut`/`CS-Notes` 建立总纲 -> `modern-cpp` 补 C++ -> `leetcode-master` 刷题 -> `Muduo` 或 `BusTub` 深挖项目 -> `system-design-primer` 补系统设计。
