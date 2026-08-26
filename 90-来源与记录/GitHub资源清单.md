# GitHub 资源清单与版本记录

检索日期：2026-08-26（Asia/Shanghai）。Stars、forks、仓库大小和更新时间来自 GitHub REST API 快照，会变化；学习时以本地目录中的 commit 为准。

## 已拉取仓库

| 仓库 | Stars 快照 | 大小 | 默认分支 | 本地 commit | 许可证字段 | 选择理由 |
| --- | ---: | ---: | --- | --- | --- | --- |
| [huihut/interview](https://github.com/huihut/interview) | 38,153 | 5,713 KB | master | `aba5cd97e8173dd6e1d1758b645e3a51534f872d` | NOASSERTION | C/C++ 面试总纲，含 STL、系统、网络、算法 |
| [CyC2018/CS-Notes](https://github.com/CyC2018/CS-Notes) | 185,660 | 116,179 KB | master | `b70121d377cb6005eb65f12b098cd5decd905669` | NOASSERTION | 中文 OS、网络、数据库、系统设计复习 |
| [changkun/modern-cpp-tutorial](https://github.com/changkun/modern-cpp-tutorial) | 25,768 | 39,821 KB | master | `24f9dd58c32334fa3b79091e3bbe084b2ee3e1f3` | MIT | 中文现代 C++ 教程和代码 |
| [zhedahht/CodingInterviewChinese2](https://github.com/zhedahht/CodingInterviewChinese2) | 5,409 | 773 KB | master | `2d6eb6d9127d1ad728ba60bb25bc5a5e91e519ac` | NOASSERTION | C++ 经典编程面试题源码 |
| [youngyangyang04/leetcode-master](https://github.com/youngyangyang04/leetcode-master) | 62,291 | 100,325 KB | master | `b43def349578bdbda371f00da505d3099374910d` | NOASSERTION | 中文算法学习顺序和题解 |
| [cmu-db/bustub](https://github.com/cmu-db/bustub) | 5,064 | 10,457 KB | master | `3e9884efdd42aab461e2d4f2cddd9d58ee5e382b` | MIT | 数据库内核项目和测试 |
| [chenshuo/muduo](https://github.com/chenshuo/muduo) | 16,225 | 1,795 KB | master | `f1fc77e0c13b80e5086ff457362c8a86d1b609d4` | NOASSERTION | C++11 Linux 事件驱动网络库 |
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 366,145 | 11,277 KB | master | `ae9bbd7b02d90b9866215de185217d33f39ab733` | NOASSERTION | 系统设计、估算、架构案例 |
| [isocpp/CppCoreGuidelines](https://github.com/isocpp/CppCoreGuidelines) | 45,275 | 27,180 KB | master | `33bcd015997f0d8e0fa0202eb66254a16f59ad8f` | NOASSERTION | C++ 资源管理、接口和并发规范 |
| [0voice/interview_internal_reference](https://github.com/0voice/interview_internal_reference) | 37,242 | 1,161 KB | master | `a549376da3ff8430a03e00ad7e1878ca00a063ad` | NOASSERTION | 国内公司面经和中间件专题 |

## API 筛选记录

另外核验过的候选：

- `TheAlgorithms/C-Plus-Plus`：适合核对算法实现和复杂度，不作为主线题库。
- `karanpratapsingh/system-design`：系统设计补充材料，当前主线先用 Primer。
- `jwasham/coding-interview-university`：范围很广，适合长期路线；当前知识库先按 C++ 后端岗位收窄。

## 许可证与使用边界

- `MIT` 仓库通常适合参考和修改，但仍需保留版权与许可证文本。
- `NOASSERTION` 表示 API 未声明可识别许可证，不能默认把源码或大段内容重新分发；本目录保留 GitHub 仓库作为个人学习副本，引用时回到原仓库。
- 面试笔记中的总结是本地原创整理，不替代原仓库许可证，也不把 Star 数当作正确性证明。

## 更新方式

在 `Pre` 目录执行：

```powershell
.\update.ps1
```

脚本只对已存在的仓库执行 `git pull --ff-only`，遇到本地分支分叉或未提交修改时停在该仓库并报告，不覆盖本地笔记。

