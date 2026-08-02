---
title: 初始化与管理系统
sidebar_position: 3
---

# 初始化与管理系统

系统预设为 macOS、Ubuntu 和 Windows 提供可选择的开发环境初始化步骤。实际可用项目以当前版本的 `shine sys list` 为准。

各平台 profile 的项目清单，以及 `split-dns` 所需的环境变量和安全预览步骤见[内置预设](../reference/built-in-presets.md#系统预设)。

## 先查看，再执行

```bash
shine sys list
shine sys list --all
shine sys info split-dns
shine sys bootstrap --dry-run
```

`--dry-run` 会显示选择结果、脚本调用和受管 profile 更新，但不执行变更。某些初始化项目需要管理员权限或额外环境变量，`shine sys info <ITEM>` 会列出要求。

## 交互选择或应用 Profile

```bash
shine sys bootstrap
shine sys bootstrap --preset recommended
shine sys bootstrap --preset minimal
shine sys bootstrap --proxy --dry-run
```

- 在交互式终端中，`shine sys bootstrap` 会打开多选界面。
- 指定 `--preset` 时直接应用命名 profile。
- 非交互环境没有指定 profile 时使用预设的默认 profile。

Ubuntu 还提供 `minimal` profile，适合生产服务器：仅安装 Neovim、fzf、bat、eza 和 zoxide，不包含 shell 历史同步、提示符、Node.js 工具链或 Homebrew。运行前仍应先执行 `shine sys bootstrap --preset minimal --dry-run` 复核当前版本的实际步骤。

下载需要经过 HTTP 代理时，添加 `--proxy`。Shine 会根据 `[env]` 中的 `PROXY_HOST`、`HTTP_PROXY_PORT` 和 `PROXY_NO_PROXY` 为初始化脚本设置大小写两套代理变量；默认地址为 `http://127.0.0.1:6152`。先配合 `--dry-run` 检查实际注入值。

Windows 的 `winget` 不读取这些环境变量，因此 Shine 还会显式传递 `winget install --proxy`。若系统尚未启用该选项，请在管理员 PowerShell 中先运行：

```powershell
winget settings --enable ProxyCommandLineOptions
```

完成后检查记录：

```bash
shine sys status
```

## 检查引导软件更新

初始化完成后，可只读检查当时记录的软件是否有可用更新：

```bash
shine sys update
shine sys update neovim --verbose
shine sys update --proxy
```

该命令只检查 `shine sys bootstrap` 已记录的引导软件，不安装或升级软件，也不修改 sys manifest
或 shell profile。默认只显示包管理器确认有更新的项目和可复制的上游升级命令；
`--verbose` 还会显示已是最新版和只能手动检查的项目。

当前内置预设可通过 Homebrew、apt 和 winget 检查更新。直接安装器和用户自行维护的 Git
配置会标记为需要手动检查，不会根据不可靠的信息猜测版本。`--proxy` 使用与
`sys bootstrap --proxy` 使用相同的代理配置；Windows 上会显式传递 winget 的 `--proxy` 参数。

`shine update` 和 `shine upgrade` 仍只处理 Shine 管理的配置和受管系统资源，不会升级这些
第三方软件。是否执行 `shine sys update` 输出的升级命令始终由用户决定。

顶层 `shine list` 会列出当前操作系统已登记在 sys manifest 中的受管系统配置；它用于快速总览，详细状态仍以 `shine sys status` 和 `shine sys info <ITEM>` 为准。`update --verbose` 与 `upgrade --verbose` 会同时展示跳过、已是最新以及需要注意的受管资源。

## 受管系统项目

部分系统配置是可重复应用和安全移除的受管项目：

```bash
shine sys apply --dry-run
shine sys apply split-dns
shine sys uninstall split-dns --dry-run
shine sys uninstall split-dns
```

需要把异地局域网中的私有域名定向到 ZeroTier DNS 时，可参考
[使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络](/knowledge/zerotier-coredns-split-dns)。

在 Ubuntu 上，`split-dns` 依赖应用查询 `systemd-resolved` 的 `127.0.0.53` stub。Shine 会在检测到 stub 被关闭时给出警告或拒绝写入无效配置；先重新启用 `DNSStubListener`，或确认本机解析链路确实会经过 `systemd-resolved`，再应用该项目。

系统 profile 会尽量合并并保留用户内容。只有明确希望备份并替换冲突 profile 时，才使用 `shine sys bootstrap --force-profile`。

## 平台说明

- macOS 的受管 shell profile 以 zsh 为目标。
- Ubuntu 支持 bash 和 zsh。
- Windows 系统预设和 profile 集成使用 PowerShell。
- Ubuntu 与 macOS 可自动识别终端明暗背景并设置 `SHINE_TERMINAL_THEME`；设置 `SHINE_SYNC_TERMINAL_THEME=0` 可关闭。
