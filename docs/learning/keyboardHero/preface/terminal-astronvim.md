---
title: 终端中使用 AstroNvim
sidebar_position: 4
---

# 终端中使用 AstroNvim

AstroNvim 是一套开箱即用、可扩展的 Neovim 配置。它适合希望在纯终端中完成编辑、文件浏览、搜索、Git 和语言服务操作的用户。

## 适用范围

- 想在 macOS、Linux 或 Windows 终端中使用完整 Vim/Neovim 工作流的用户。
- 愿意使用上游模板作为自己的 Neovim 配置起点的用户。

## 前置条件

安装前确认以下条件：

- Neovim `0.11` 或更高的稳定版。
- Git，用于获取官方模板。
- 支持真彩色的终端；建议使用 Nerd Font 以正常显示图标。
- C 编译器和系统剪贴板工具，以满足插件或剪贴板集成需求。

完整且随版本更新的要求、安装和配置说明以 [AstroNvim 官方文档](https://docs.astronvim.com/) 为准。

## 操作

以下步骤会把现有 Neovim 配置改名为备份，不会删除它。若此前已使用 AstroNvim 或有需要保留的同名备份，请先自行选择新的备份名称。

### macOS 或 Linux

在终端执行：

```bash
mv ~/.config/nvim ~/.config/nvim.bak
mv ~/.local/share/nvim ~/.local/share/nvim.bak
mv ~/.local/state/nvim ~/.local/state/nvim.bak
mv ~/.cache/nvim ~/.cache/nvim.bak

git clone --depth 1 https://github.com/AstroNvim/template ~/.config/nvim
rm -rf ~/.config/nvim/.git
nvim
```

前四条命令仅在对应目录存在时才需要执行；没有旧配置时可跳过。最后的 `rm -rf` 只移除刚克隆模板的 Git 元数据，使该目录成为你自己的配置；不要对其他路径使用该命令。

### Windows（PowerShell）

在 PowerShell 执行：

```powershell
Move-Item $env:LOCALAPPDATA\nvim $env:LOCALAPPDATA\nvim.bak
Move-Item $env:LOCALAPPDATA\nvim-data $env:LOCALAPPDATA\nvim-data.bak

git clone --depth 1 https://github.com/AstroNvim/template $env:LOCALAPPDATA\nvim
Remove-Item $env:LOCALAPPDATA\nvim\.git -Recurse -Force
nvim
```

同样地，没有旧目录时可跳过对应的 `Move-Item`。`Remove-Item` 的目标应严格保持为新克隆目录中的 `.git`。

首次运行 `nvim` 会安装 AstroNvim 及其依赖插件，请保持网络连接并等待完成。

## 验证

1. 运行 `nvim` 后应看到 AstroNvim 的欢迎界面或编辑器界面，而不是默认 Neovim 空白界面。
2. 打开一个文件，按 `i` 输入文字，按 `Esc` 回到 Normal 模式。
3. 输入 `:AstroVersion` 并回车，确认能够显示当前 AstroNvim 版本。

## 相关内容

- [AstroNvim 官方文档](https://docs.astronvim.com/)
- [AstroNvim 官方模板](https://github.com/AstroNvim/template)
- [Vim 起步](../vim/起步.md)
