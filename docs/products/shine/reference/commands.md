---
title: 命令参考
sidebar_position: 1
---

# 命令参考

本页已审阅至 Shine 0.37.0（提交 `410f8b5`）。任何子命令都可以使用 `--help` 查看当前安装版本的准确参数。

## 顶层命令

| 命令 | 作用 |
| --- | --- |
| `shine init [--yes]` | 将当前目录初始化为预设目录 |
| `shine install <CATEGORY>` | 自动匹配并安装一个 shell 或 app 类别 |
| `shine reinstall <CATEGORY>` | 自动匹配并重新安装一个类别 |
| `shine uninstall <CATEGORY>` | 自动匹配并卸载一个类别 |
| `shine list` | 列出当前已安装且可用的预设与配置 |
| `shine info <TARGET>` | 查看已安装目标的状态和差异 |
| `shine pull` | 快进拉取由 Git 管理的预设与 overlay 来源 |
| `shine update` | 检查受管内容和 Shine 稳定版更新 |
| `shine upgrade` | 更新已安装的 shell 与 app 配置 |
| `shine clear` | 清理架构变更后遗留的旧运行时状态 |
| `shine export` | 导出内置预设到当前预设目录 |
| `shine link <PATH>` | 设置外部预设目录 |
| `shine unlink` | 移除外部预设目录设置 |
| `shine ssh [SSH_ARGS]... <HOST> [COMMAND]` | 开启带会话级文件传输通道的 SSH 会话 |
| `shine local <SUBCOMMAND>` | 在 `shine ssh` 远端会话内传输文件或查看连接状态 |

所有命令都支持全局 `--config-dir <PATH>`，用于临时选择全局配置和运行时状态目录。

## Shell 与 App

```text
shine shell init [--force]
shine shell list
shine shell install [CATEGORY]
shine shell reinstall [CATEGORY]
shine shell uninstall [CATEGORY] [--purge] [--dry-run]

shine app init [--force]
shine app list
shine app info <CATEGORY>
shine app install [CATEGORY] [--dry-run]
shine app reinstall [CATEGORY] [--dry-run]
shine app uninstall [CATEGORY] [--force] [--purge] [--dry-run]
```

`app uninstall --force` 会删除安装后已被修改的受管文件，使用前应先运行 `--dry-run` 并确认不再需要这些修改。

## 状态、更新与补全

```text
shine info <TARGET> [--diff] [--verbose]
shine pull
shine update [--pull] [--verbose] [--refresh]
shine upgrade [--pull] [--verbose] [--prune-stale]
shine clear [--dry-run]
shine completions install
shine completions <bash|zsh|powershell>
```

- `--refresh` 跳过 24 小时版本检查缓存。
- `update --pull` 先拉取 Git 来源并重新加载配置，再检查状态。
- `upgrade --pull` 先拉取 Git 来源并重新加载配置，再更新已安装配置。
- `--prune-stale` 移除预设来源中已不存在的旧受管 app 文件。
- `info --diff` 显式输出预期内容差异，`--verbose` 还会输出内容。

## 系统预设

```text
shine sys list [--all]
shine sys info <ITEM>
shine sys status
shine sys init [--preset <PROFILE>] [--dry-run] [--force-profile]
shine sys apply [ITEM] [--dry-run]
shine sys uninstall <ITEM> [--dry-run]
```

## 环境变量

```text
shine env show [--reveal]
shine env set <KEY> <VALUE>
shine env get <KEY>
shine env delete <KEY>
shine env encrypt [--backend <gpg|age>] [-r <RECIPIENT>]... [--from <KEY>] [--set <KEY>]
shine env decrypt <KEY>
shine env export <KEY> [--as <ALIAS>]
shine env seal [FILE] [--workspace <FILE>] [--backend <gpg|age>] [-r <RECIPIENT>]...
shine env run [--workspace <FILE>] [--mode <MODE>] [--with <KEY[=ALIAS]>]... -- <COMMAND>...
shine env identity init [--touch-id] [--access-control <POLICY>] [-o <PATH>] [--force]
shine env identity show
```

`--with` 可以重复使用。它把 Shine 配置中的 `KEY` 仅提供给本次启动的子进程；写成
`KEY=ALIAS` 可改变子进程看到的变量名。只使用 `--with` 时不要求存在
`shine.workspace.toml`。

`env identity init --touch-id` 只适用于 macOS，并依赖 `age-plugin-se`；未使用 `--touch-id` 时依赖 `age-keygen`。

## SSH 文件传输

```text
shine ssh [SSH_ARGS]... <HOST> [COMMAND]
shine local download <REMOTE_SOURCE> [LOCAL_DESTINATION] [--force] [--dry-run]
shine local upload <LOCAL_SOURCE> [REMOTE_DESTINATION] [--force] [--dry-run]
shine local status
```

`shine ssh` 会把普通 `ssh` 参数原样传给系统 `ssh`，并额外建立本次会话可用的传输通道。`shine local` 必须在这个远端 shell 中运行；`download` 表示从远端下载到本机，`upload` 表示把本机文件或目录上传到远端。目标已存在时先使用 `--dry-run` 预览，确认后再加 `--force` 覆盖文件或合并目录。

## 自定义来源与程序升级

```text
shine overlay link <PATH> [--create]
shine overlay show
shine overlay unlink
shine pull
shine self install [--dest <PATH>]
shine self upgrade [--channel <stable|preview>]
```
