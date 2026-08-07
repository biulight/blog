---
title: 安装与升级
sidebar_position: 2
---

# 安装与升级

Shine 支持 macOS、Linux 和 Windows。官方安装脚本从 GitHub Releases 下载当前平台的二进制文件。

## macOS 与 Linux

```bash
curl -fsSL https://github.com/biulight/shine/releases/latest/download/install.sh | sh
```

默认安装到 `~/.local/bin/shine`，安装脚本不会修改 shell 配置。确认 `~/.local/bin` 已在 `PATH` 中，然后验证：

```bash
shine --version
```

如需指定位置或版本：

```bash
SHINE_INSTALL_DIR=/custom/bin sh install.sh
SHINE_VERSION=1.2.0 sh install.sh
```

## Windows PowerShell

```powershell
irm https://github.com/biulight/shine/releases/latest/download/install.ps1 | iex
```

默认安装到 `%LOCALAPPDATA%\Programs\shine\shine.exe`，不会修改用户 `PATH`。如需指定位置或版本：

```powershell
$env:SHINE_INSTALL_DIR = "$env:USERPROFILE\bin"; .\install.ps1
$env:SHINE_VERSION = "1.2.0"; .\install.ps1
```

## 从源码安装

已安装 Rust **1.88 或更高版本**时，可从 crates.io 安装：

```bash
cargo install shine-cli
```

若在 Shine 源码仓库中构建，运行 `cargo build --release`；二进制文件位于
`target/release/shine`。

## 升级 Shine

安装后可由 Shine 下载稳定版或 preview 版：

```bash
shine self upgrade
shine self upgrade --channel stable
shine self upgrade --channel preview
```

`preview` 是持续滚动的预发布通道，不参与日常自动更新检查。运行 `shine update` 可以同时检查已安装配置和稳定版程序更新。

在 Unix 系统上，如果 `shine self install` 或 `shine self upgrade` 需要写入当前用户不可写的位置，Shine 会自动通过 `sudo` 重新执行复制步骤。Windows 仍需要在有权限的终端中完成受保护位置的安装。

下一步：[完成第一次预设安装](./quick-start.md)。
