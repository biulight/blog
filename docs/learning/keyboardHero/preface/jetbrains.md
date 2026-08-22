---
title: JetBrains IDE 中使用 Vim
sidebar_position: 3
---

# JetBrains IDE 中使用 Vim

以 WebStorm 为例，安装 IdeaVim 后可以在 JetBrains IDE 的编辑器中使用 Vim 模式，并继续使用 IDE 的重构、导航和调试能力。

## 适用范围

- 已安装 WebStorm 或其他兼容 IdeaVim 的 JetBrains IDE。
- 希望在 IDE 中学习 Vim，并把常用 IDE 动作映射为 Vim 按键的用户。

## 前置条件

准备好 JetBrains IDE，并能访问 JetBrains Marketplace。Shine 是可选项，只用于托管 IdeaVim 配置，不会安装 WebStorm 或 IdeaVim 插件。

## 操作

### 安装并启用 IdeaVim

1. 打开 IDE 设置：Windows/Linux 使用 `Ctrl+Alt+S`；macOS 可从主菜单打开 **Settings/Preferences**。
2. 进入 **Plugins**，在 Marketplace 搜索并安装 **IdeaVim**。
3. 按提示重启 IDE。重启后，编辑器会启用 Vim 模式。

如需临时关闭 Vim 模式，在主菜单取消选择 **Tools | Vim**。

### 创建最小配置

点击状态栏的 IdeaVim 图标，选择 **Create ~/.ideavimrc**。在打开的文件中加入：

```vim
" 在 Insert 模式连续输入 jj，返回 Normal 模式
inoremap jj <Esc>

" 用空格作为 leader
let mapleader = " "

" 将 leader + r 映射为 IDE 的格式化代码动作
map <leader>r <Action>(ReformatCode)
```

保存后使用 **File | Reload All from Disk**，或重启 IDE，使配置重新加载。`<Action>(...)` 让 IdeaVim 调用 JetBrains 的原生功能；要找到其他 action ID，可在 **Find Action** 中启用 **IdeaVim: Track Action Ids**。

### 处理 IDE 与 Vim 的快捷键冲突

在 **Editor | Vim** 中为冲突快捷键选择处理者：

- **IDE**：优先执行 WebStorm 的快捷键。
- **Vim**：优先执行 Vim 动作。
- **Undefined**：每次冲突时提示选择。

先保留你频繁使用的 IDE 快捷键，等熟悉对应 Vim 动作后再逐步改为 Vim。

### 可选：用 Shine 托管配置

Shine 内置 `JetBrains` 应用预设，会管理 `~/.ideavimrc`。先预览目标与影响范围：

```bash
shine app install JetBrains --dry-run
```

确认后安装：

```bash
shine app install JetBrains
```

首次安装遇到已有但不受 Shine 管理的配置文件时，Shine 会创建 `*.shine.bak` 备份。之后应在自己的 Shine overlay 中维护个性化配置，不要直接修改受管副本。

## 验证

1. 在编辑器中按 `Esc`，光标应进入 Normal 模式；按 `i` 后可插入文本。
2. 插入模式输入 `jj`，确认返回 Normal 模式。
3. 在 Normal 模式按 `Space` 后再按 `r`，确认 IDE 执行“格式化代码”。
4. 若已使用 Shine，运行 `shine update` 检查受管配置状态。

## 相关内容

- [WebStorm 官方：Vim in WebStorm](https://www.jetbrains.com/help/webstorm/using-product-as-the-vim-editor.html)
- [IdeaVim 插件](https://plugins.jetbrains.com/plugin/164-ideavim)
- [Shine：管理应用配置](/products/shine/guides/app-presets)
- [Vim 起步](../vim/起步.md)
