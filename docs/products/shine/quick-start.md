---
title: 快速开始
sidebar_position: 3
---

# 快速开始

下面以代理 shell 命令为例，完成一次查看、安装、使用和检查流程。

## 1. 查看可用预设

```bash
shine shell list
shine app list
shine sys list
```

三个入口分别列出 shell 命令、应用配置和当前操作系统的初始化项目。

## 2. 安装代理命令

```bash
shine shell install proxy
```

Shine 会把脚本放到 `~/.shine/presets/shell/`，在 `~/.shine/bin/` 创建命令入口，并将该目录加入支持的 shell profile。

打开一个新终端，或重新加载当前 shell 配置：

```bash
source ~/.zshrc
# bash 用户使用：source ~/.bashrc
```

PowerShell 用户可重新打开终端，确保更新后的 profile 生效。

## 3. 使用并检查

```bash
setproxy
shine list
shine info proxy
```

`shine list` 只显示当前已安装且可用的内容；`shine info` 会显示目标状态和必要的差异信息。

取消当前终端会话中的代理：

```bash
usetproxy
```

## 4. 安全预览卸载

```bash
shine shell uninstall proxy --dry-run
```

确认输出后去掉 `--dry-run` 即可执行。Shine 只移除自身管理的脚本、命令入口和相关 profile 片段。

接下来可以安装[应用配置](./guides/app-presets.md)，或使用[系统初始化预设](./guides/system-init.md)。

