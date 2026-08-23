---
title: 使用 Shine 快速配置 Ubuntu 服务器
slug: /shine-ubuntu-server
authors: biulight
tags: [Shine, Linux, Ubuntu]
---

拿到一台新的 Ubuntu 服务器后，可以用 Shine 统一完成常用命令行工具的安装和 shell profile 配置。相比逐条复制安装脚本，Shine 可以先预览将要执行的步骤，并记录已经初始化的项目，方便之后检查状态。

<!--truncate-->

本文使用适合生产服务器的 `minimal` profile，安装 Neovim、fzf、bat、eza 和 zoxide，不包含 shell 历史同步、提示符、Node.js 工具链或 Homebrew。

## 开始前

请先确认：

- 当前系统为 Ubuntu；
- 服务器可以访问 GitHub 等软件下载源；
- 当前用户可以在需要时使用 `sudo`。

系统初始化可能安装软件包、下载程序并更新 shell profile。正式执行前先使用 `--dry-run` 检查实际步骤。

## 安装 Shine

运行官方安装脚本：

```bash
curl -fsSL https://github.com/biulight/shine/releases/latest/download/install.sh | sh
```

默认安装位置是 `~/.local/bin/shine`，安装脚本不会修改 shell 配置。确认 `~/.local/bin` 已加入 `PATH`，再检查版本：

```bash
export PATH="$HOME/.local/bin:$PATH"
shine --version
```

需要设置永久 `PATH`、指定安装目录或固定版本时，请查看 Shine 的[安装与升级](https://biulight.github.io/shine/zh-Hans/installation)说明。

## 预览服务器配置

先查看当前版本为 Ubuntu 提供的初始化项目：

```bash
shine sys list
shine sys bootstrap --preset minimal --dry-run
```

第二条命令只打印选择结果、脚本调用和 profile 更新，不修改系统。确认项目和目标路径符合预期后，再继续执行。

## 应用 minimal profile

```bash
shine sys bootstrap --preset minimal
```

过程中可能因为安装系统软件而请求 `sudo` 权限。完成后查看 Shine 记录的初始化状态：

```bash
shine sys status
```

如果以后想检查这些软件是否有可用更新，可以运行：

```bash
shine sys update
```

该命令只检查由 `shine sys bootstrap` 记录的软件，不会自动安装升级。

## 需要更完整的终端环境

`minimal` 适合保持精简的生产服务器。如果这是开发机，或你还需要 AstroNvim、Atuin、Yazi、Starship 和 zsh-vi-mode，可以先预览 `recommended` profile：

```bash
shine sys bootstrap --preset recommended --dry-run
```

确认后去掉 `--dry-run` 即可应用。Ubuntu 还提供包含 ZeroTier、pnpm、mise 和 Homebrew 的 `all` profile；建议先对照[内置预设清单](https://biulight.github.io/shine/zh-Hans/reference/built-in-presets#系统预设)，不要在服务器上安装不需要的组件。

更多交互选择、下载代理和受管系统配置的用法，见 Shine 中文手册的[初始化与管理系统](https://biulight.github.io/shine/zh-Hans/guides/system-init)。
