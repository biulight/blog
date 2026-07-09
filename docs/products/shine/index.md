---
title: Shine
slug: /products/shine
sidebar_position: 1
description: 使用 Shine 管理 shell 命令、应用配置与系统初始化预设。
---

# Shine

Shine 是一个跨平台命令行工具，将常用 shell 脚本、应用配置和系统初始化步骤打包成可安装、可检查、可升级、可安全卸载的预设。

当前手册适用于 **Shine 0.37.0**。

## 可以用它做什么

- 安装 `setproxy`、`copyfile` 等 shell 命令，并自动配置命令搜索路径。
- 安装 Git、Starship、Ghostty、Vim、Docker 等应用配置。
- 在 macOS、Ubuntu 和 Windows 上选择并执行系统初始化项目。
- 导出内置预设，通过外部目录或 overlay 保存自己的定制。
- 使用 GPG 管理配置变量或项目工作区中的敏感环境变量。
- 使用 `age` 与可选的 macOS Touch ID 管理团队共享密钥。
- 通过 `shine ssh` 会话在本机和远端之间传输文件或目录。
- 比较已安装文件与预设，升级时只处理 Shine 管理的内容。

## 从这里开始

1. [安装 Shine](./installation.md)
2. [完成第一次预设安装](./quick-start.md)
3. 根据目标阅读 [Shell 预设](./guides/shell-presets.md)、[应用预设](./guides/app-presets.md)、[系统初始化](./guides/system-init.md) 或 [SSH 会话文件传输](./guides/ssh-transfer.md)

如果已经遇到问题，直接前往[故障排查](./troubleshooting.md)。完整命令入口见[命令参考](./reference/commands.md)。
