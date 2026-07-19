---
title: 管理 Shell 预设
sidebar_position: 1
---

# 管理 Shell 预设

Shell 预设把脚本安装到 Shine 的受管目录，并在 `~/.shine/bin/` 创建可直接调用的命令入口。Shine 当前支持 Bash、Zsh 和 PowerShell 的 profile 与命令目录管理；原生命令入口使用 `.sh` 或 `.ps1`，Bun 可作为另一种跨平台命令运行时。

## 查看与安装

```bash
shine shell list
shine shell install proxy
shine shell install            # 安装当前平台可用的全部类别
```

也可以使用自动识别 shell 或 app 类别的简写：

```bash
shine install proxy
```

安装后需打开新终端或重新加载 shell profile。需要补全时运行：

```bash
shine completions install
```

## 重新安装

当受管脚本、命令入口或 PATH 片段需要按当前预设重建时：

```bash
shine shell reinstall proxy
shine reinstall proxy
```

重新安装会覆盖 Shine 管理的对应内容。先用 `shine info proxy` 检查状态，避免把有意的本地修改当作损坏处理。

## 卸载

```bash
shine shell uninstall proxy --dry-run
shine shell uninstall proxy
shine shell uninstall proxy --purge
```

`--purge` 会额外删除目标类别的预设目录；未指定类别时会处理整棵 shell 预设目录。它不会删除 `~/.shine/config.toml`。

## 内置常用命令

| 类别 | 命令 | 用途 |
| --- | --- | --- |
| `proxy` | `setproxy`、`usetproxy` | 设置或清除当前终端会话的代理变量 |
| `utils` | `copyfile` | 通过 OSC52 将文件内容复制到本地剪贴板 |
| `utils` | `shine-env-export` | 将 Shine env 值载入当前 shell |
| `utils` | `shine-theme-sync` | 输出当前终端明暗主题的 shell `export` 语句 |
| `agent` | `ccenv` | 为 Claude Code + DeepSeek provider 配置当前会话 |

某些类别按平台提供不同脚本；`shine shell list` 只显示当前平台可用的条目。

想用 Bun 编写跨平台命令预设？请参阅[可选运行时的 Shell 入口](./custom-presets.md#可选运行时的-shell-入口)。
