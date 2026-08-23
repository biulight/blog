---
sidebar_position: 0
id: intro
sidebar_label: 前言
slug: /learning/keyboardHero
---

# 初衷

一直有个梦想，能像电影中的“黑客”不使用鼠标，只用键盘操作电脑。

要实现这个目标，Vim/Neovim 是无法绕开的基础。真正需要学习的不只是某个编辑器，而是 Normal、Insert、Visual 等模式，以及用组合动作完成编辑和导航的思维方式。VS Code、JetBrains、Obsidian 中的 Vim 模式，以及终端中的 Neovim，都建立在这套基础之上。

## Vim 不只在编辑器里出现

Vim 不只存在于专门打开的编辑器中。许多命令行工具会在需要输入多行内容时调用默认编辑器；例如 Git 在创建提交、合并提交或编写标签说明时，可能会打开 Vim（具体取决于 Git 和系统的编辑器配置）。

如果是在 Git 中意外进入 Vim，不需要慌张：按 `Esc` 回到 Normal 模式；确认内容后输入 `:wq` 并回车保存退出；若确定不保留这次尚未保存的修改，输入 `:q!` 并回车退出。先掌握这些最小操作，就能安全地继续工作。

浏览网页时也一样：Chrome、Safari 等浏览器可以通过 Vim 风格的扩展，让你用键盘滚动页面、切换标签页、打开链接和搜索。Vim 的价值不只是替代鼠标，而是把一套一致的导航和编辑习惯带到更多日常场景。

如果你准备长期使用键盘驱动的工作流，我个人推荐尝试 HHKB。我认为 HHKB 是非常适合程序员的键盘：它的布局紧凑，`Control` 键靠近主键区，适合频繁使用 Vim 和终端。对于手比较小的用户，紧凑布局通常也能减少手指移动距离。当然，HHKB 的布局和手感有自己的特点，购买前最好确认自己能够适应。

如果你使用 Mac，并且希望进一步改造系统级键位，例如把 Caps Lock 改成 Escape 或 Hyper Key，或者让快捷键在不同应用之间保持一致，那么 [Karabiner-Elements](./preface/karabiner-elements.md) 也是值得尽早了解的前置工具。它不是 Vim/Neovim 的依赖；只在应用内使用 Vim 模式时，可以暂时不安装。

建议先从 [Vim 起步](./vim/起步.md) 开始，再根据使用场景学习 [VS Code 中使用 Vim](./preface/vscode.md)、[JetBrains IDE 中使用 Vim](./preface/jetbrains.md)、[Obsidian 中的 Vim](./macApp/10%20Obsidian中的vim.md) 或 [终端中使用 AstroNvim](./preface/terminal-astronvim.md)。
