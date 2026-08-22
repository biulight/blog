---
title: Vim 与 Neovim：从 vi 到现代编辑器
description: 了解 Vim 和 Neovim 的历史、现状、差异与未来方向。
sidebar_position: 1
---

# Vim 与 Neovim：从 vi 到现代编辑器

这一节先帮你建立一个判断：Vim 和 Neovim 不是两套必须二选一的「快捷键软件」，而是一条延续数十年的编辑传统。先掌握共同的模式、动作和文本对象，再按自己的环境选择编辑器与配置，学习成本最低。

## 从 vi 开始

1976 年，Bill Joy 在 Unix 上开发了 `vi`。它把输入文字与发出编辑命令分开：在 Normal 模式中，`d` 表示删除、`w` 表示移动到下一个单词；组合成 `dw` 就是“删除一个单词”。这种“操作符 + 动作”的组合方式，让常用编辑操作无需离开主键区，后来成为 Vim 系列最重要的使用习惯。

1991 年，Bram Moolenaar 发布 Vim（`Vi IMproved`）。它在兼容 `vi` 的基础上加入了多窗口、语法高亮、脚本与插件等能力，并长期被许多 Unix-like 系统作为可用的 `vi` 实现。Bram 于 2023 年去世后，Vim 仍由社区维护；Vim 9.1 发行说明也明确将该版本献给这位持续领导项目三十多年的作者。

Vim 的生命力，来自 Bram Moolenaar 三十余年的持续投入，也来自后来无数维护者与使用者的共同传承。感谢他留下的不只是一个编辑器，更是一种让人专注于文字与思考的工作方式。

## Neovim 为什么出现

Neovim 于 2014 年从 Vim 分叉。它不是重新发明编辑方式，而是在尽可能保持 Vim 编辑体验和 Vimscript 兼容性的同时，重新整理内部架构，让异步任务、外部界面和扩展开发更容易进行。

因此，两者最核心的知识是通用的：模式切换、操作符、动作、文本对象、寄存器、宏、搜索与替换，在 Vim、Neovim 以及各类 Vim 模式插件中都能迁移。Neovim 官方也将自己定义为 Vim 的 fork，而不是 clone；除 Vim9script 外，它尽量保持对 Vim 编辑与 Vimscript 特性的兼容。

## 今天如何看待它们

Vim 并没有停止发展。当前 Vim 9 系列继续维护，Vim9 script、类与对象、virtual text、平滑滚动和内置 EditorConfig 支持等能力，说明它仍是一个活跃、跨平台且适合远程服务器和轻量环境的编辑器。

Neovim 则更强调可扩展性与现代开发体验：

- 内置 Lua 运行时与 API，适合用 `init.lua` 配置和开发插件。
- 内置 LSP 客户端；连接语言服务器后，可获得跳转定义、重命名、诊断、补全等能力。语言服务器本身仍需要另行安装。
- 提供 Tree-sitter 集成、异步任务、终端模拟器和 MessagePack-RPC API，便于插件、图形界面和其他程序与编辑器协作。

这不代表 Neovim 天然更适合每个人。若你在服务器上希望零配置打开文件，或要遵循既有的 Vim 配置与运维习惯，Vim 往往更直接；若你愿意维护 Lua 配置，并希望把终端编辑器逐步扩展为开发环境，Neovim 通常是更顺手的起点。

## 未来：共同的核心，不同的重点

两者都在延续 modal editing 的核心价值，所以今天学习的 `d`、`c`、`y`、`f`、`/` 和文本对象，不会因项目演进而失效。

Vim 的公开开发列表持续记录下一次补丁和后续版本的修复与改进，重心仍是稳定、兼容和广泛平台支持。Neovim 则公开维护路线图：已完成的版本持续完善 Lua、LSP、Tree-sitter 和界面 API；其 0.13 方向被命名为 “The year of Batteries Included”，包含更完善的内置包管理、远程工作流、LSP 与界面能力，并把 1.0 作为准备目标。路线图中的条目会随优先级调整，不能视作发布日期或功能承诺。

对学习者而言，最可靠的策略是：先用 Vim 的共同语言建立肌肉记忆；然后在实际工作中选择 Vim、Neovim，或 VS Code、JetBrains、Obsidian 的 Vim 模式。工具可以迁移，编辑思维会留下来。

## 接下来学什么

继续阅读 [Vim 起步](./起步.md)，先练习进入与退出各模式、移动光标和完成最基本的编辑；熟悉 `w`、`$` 等基础动作后，再阅读 [Vim 的核心思想](./核心思想.md)，理解如何用“操作符 + 动作”组织编辑命令。若你已经决定在终端中使用 Neovim，可再阅读 [终端中使用 AstroNvim](../preface/terminal-astronvim.md)。

## 参考资料

- [Vim 简介](https://www.vim.org/about.php)
- [Vim 版本历史](https://github.com/vim/vim-history)
- [Vim 9.1 发行公告](https://www.vim.org/vim-9.1-released.php)
- [Vim 官方仓库](https://github.com/vim/vim)
- [Neovim 简介与从 Vim 迁移说明](https://neovim.io/doc/user/nvim/)
- [Neovim 与 Vim 的差异](https://neovim.io/doc/user/vim_diff/)
- [Neovim 路线图](https://neovim.io/roadmap/)
