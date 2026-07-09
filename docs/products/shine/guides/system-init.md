---
title: 初始化与管理系统
sidebar_position: 3
---

# 初始化与管理系统

系统预设为 macOS、Ubuntu 和 Windows 提供可选择的开发环境初始化步骤。实际可用项目以当前版本的 `shine sys list` 为准。

## 先查看，再执行

```bash
shine sys list
shine sys list --all
shine sys info split-dns
shine sys init --dry-run
```

`--dry-run` 会显示选择结果、脚本调用和受管 profile 更新，但不执行变更。某些初始化项目需要管理员权限或额外环境变量，`shine sys info <ITEM>` 会列出要求。

## 交互选择或应用 Profile

```bash
shine sys init
shine sys init --preset recommended
```

- 在交互式终端中，`shine sys init` 会打开多选界面。
- 指定 `--preset` 时直接应用命名 profile。
- 非交互环境没有指定 profile 时使用预设的默认 profile。

完成后检查记录：

```bash
shine sys status
```

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

系统 profile 会尽量合并并保留用户内容。只有明确希望备份并替换冲突 profile 时，才使用 `shine sys init --force-profile`。

## 平台说明

- macOS 的受管 shell profile 以 zsh 为目标。
- Ubuntu 支持 bash 和 zsh。
- Windows 系统预设和 profile 集成使用 PowerShell。
- Ubuntu 与 macOS 可自动识别终端明暗背景并设置 `SHINE_TERMINAL_THEME`；设置 `SHINE_SYNC_TERMINAL_THEME=0` 可关闭。
