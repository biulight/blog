---
title: Vim：从第一次编辑到编辑语言
description: 面向开发者的 Vim 基础教程：先完成一次安全编辑，再用 Operator、Motion 和 Text Object 组织编辑操作。
sidebar_position: 0
---

# Vim：从第一次编辑到编辑语言

这组教程不以背诵快捷键表为目标，而是让你先说清楚自己要做什么、要操作什么范围，再把它写成 Vim 操作。

```text
Action / Operator  → 做什么
Target             → 对什么范围
Control            → 做几次、如何重复
```

例如，`di(` 可以读成“delete 当前圆括号内部的对象”，而不是一条孤立的快捷键。

## 阅读顺序

1. [前言：Vim 与 Neovim](./背景与选择.md)：了解历史传承、Bram Moolenaar 的贡献以及 Vim / Neovim 的关系。
2. [00 Vim 起步](./起步.md)：在安全文本中完成移动、编辑、撤销和退出。
3. [01 Vim 的核心思想](./核心思想.md)：认识 Action、Target 与 Control。
4. [02 Motion 与 Count](./移动与数量.md)：用合适粒度到达目标。
5. [03 Operator 与 Motion](./操作符与移动.md)：把“做什么”和“到哪里”组合起来。
6. [04 Text Object](./文本对象.md)：直接描述单词、引号和括号中的对象。
7. [05 Change 与插入位置](./修改与插入.md)：完成一次可以重复的修改。
8. [06 Yank、Delete、Register 与 Put](./复制删除与寄存器.md)：理解文本去了哪里。
9. [07 字符定位与 Search](./定位与搜索.md)：更快抵达下一个目标。
10. [08 重复修改](./重复修改.md)：用 `.` 重放一次有意义的编辑。
11. [09 综合练习](./综合练习.md)：在未见过的代码中表达编辑意图。

前言是整套教程的开篇，承担背景介绍与致谢的作用；00 是第一篇动手教学章。需要配置练习环境时，
再进入对应的接入页。

## 适用环境

教程以原生 Vim 和 Neovim 的稳定编辑语义为基线。基础 Mode、Motion、Operator 和常见 Text Object 通常也适用于 IDE 的 Vim Mode；保存、关闭、系统剪贴板，以及 Buffer / Window / Tab Page 等能力则可能由宿主应用接管。

建议先在日常编辑器中开启 Vim Mode 练习。需要接入帮助时，可阅读 [VS Code](../preface/vscode.md)、[JetBrains](../preface/jetbrains.md) 或 [AstroNvim](../preface/terminal-astronvim.md) 的说明。

读完前言后，从 00 起步进入实操；所有练习都应在可丢弃的文本或未保存副本中进行。按错键时，先按 `Esc` 回到 Normal Mode，再用 `u` 撤销。
