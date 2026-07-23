---
title: 命令参考
sidebar_position: 1
---

# 命令参考

本页已审阅至 Shine 0.39.0 的发布提交 `4b23247`。任何子命令都可以使用 `--help` 查看当前安装版本的准确参数。

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
| `shine serve <SUBCOMMAND>` | 通过本地 HTTP 服务发布 `~/.shine/http/` 下的受管资源 |
| `shine theme sync` | 解析终端明暗主题并输出 shell `export` 语句 |
| `shine export` | 导出内置预设到当前预设目录 |
| `shine link <PATH>` | 设置外部预设目录 |
| `shine unlink` | 移除外部预设目录设置 |
| `shine ssh [--remote-shell <REMOTE_SHELL>] [--with <KEY[=ALIAS]>]... [--with-secret <KEY[=ALIAS]>]... [SSH_ARGS]... <HOST> [COMMAND]` | 开启带文件传输或 Windows 环境转发的 SSH 会话 |
| `shine local <SUBCOMMAND>` | 在 `shine ssh` 远端会话内传输文件或查看连接状态 |
| `shine task <SUBCOMMAND>` | 保存、运行和管理个人快捷命令 |
| `shine run <NAME> [-- EXTRA_ARGS...]` | 运行已保存任务，等同于 `shine task run` |

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
shine app build <APP_ID>
shine app unbuild <APP_ID>
```

`app uninstall --force` 会删除安装后已被修改的受管文件，使用前应先运行 `--dry-run` 并确认不再需要这些修改。

`app build` 只运行该 app 预设在 `[artifact]` 中声明的脚本；Shine 不会隐式构建，但预设可通过 `post_install` 或 `post_upgrade` 钩子显式调用它。
`app unbuild` 运行对应的 `teardown` 脚本，反转此前构建产生的外部修改。

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
shine sys update [ITEM] [--verbose] [--proxy]
shine sys init [--preset <PROFILE>] [--dry-run] [--force-profile] [--proxy]
shine sys apply [ITEM] [--dry-run]
shine sys uninstall <ITEM> [--dry-run]
```

`sys update` 只检查 `sys init` 已记录的引导软件，不执行升级，也不修改 sys manifest 或
profile。默认只显示确认有更新的项目；`--verbose` 还显示已是最新版及需要手动检查的项目，
`--proxy` 使用预设代理执行包管理器检查。

## 终端主题

```text
shine theme sync [--auto] [--quiet]
```

手动运行时无需 `--auto`；该参数仅供受管 shell profile 在自动同步时遵守配置开关使用。

## 任务与本地 HTTP 服务

```text
shine task save <NAME> [--force] -- <COMMAND>...
shine task run <NAME> [-- EXTRA_ARGS...]
shine task list
shine task info <NAME>
shine task delete <NAME>
shine run <NAME> [-- EXTRA_ARGS...]

shine serve install [--port <PORT>]
shine serve start [--port <PORT>]
shine serve status
shine serve uninstall
shine serve url <PATH> [--port <PORT>]
```

任务命令按参数数组保存并直接执行，不经过 shell。需要管道、重定向或通配符时，请显式保存 `sh -c '...'` 这类命令。`shine serve install` 当前只支持 macOS 用户服务；`start` 可在前台启动同一个本地服务。

## 环境变量

```text
shine env show [--reveal]
shine env set <KEY> <VALUE> [--force]
shine env get <KEY>
shine env delete <KEY> [--force]
shine env encrypt [--backend <gpg|age>] [-r <RECIPIENT>]... [--from <KEY>] [--set <KEY>] [--force]
shine env decrypt <KEY>
shine env export <KEY> [--as <ALIAS>]
shine env seal [FILE] [--workspace <FILE>] [--backend <gpg|age>] [-r <RECIPIENT>]...
shine env run [--workspace <FILE>] [--mode <MODE>] [--no-workspace] [--with <KEY[=ALIAS]>]... -- <COMMAND>...
shine env identity init [--touch-id] [--access-control <POLICY>] [-o <PATH>] [--force]
shine env identity show
```

`--with` 可以重复使用。它把 Shine 配置中的 `KEY` 仅提供给本次启动的子进程；写成
`KEY=ALIAS` 可改变子进程看到的变量名。`--no-workspace` 会跳过 workspace 查找，仅使用
显式 `--with` 和进程已有环境；它不能与 `--workspace` 或 `--mode` 同时使用。

`env identity init --touch-id` 只适用于 macOS，并依赖 `age-plugin-se`；未使用 `--touch-id` 时依赖 `age-keygen`。

如果某个键当前由 `shine.env.toml` 覆盖，`set`、`delete` 和带 `--set` 的 `encrypt` 会拒绝写入无效的低优先级配置。确认要修改实际生效的覆盖文件时，显式添加 `--force`。

## SSH 文件传输

```text
shine ssh [--remote-shell <posix|windows>] [--with <KEY[=ALIAS]>]... [--with-secret <KEY[=ALIAS]>]... [SSH_ARGS]... <HOST> [COMMAND]
shine local download <REMOTE_SOURCE> [LOCAL_DESTINATION] [--force] [--dry-run] [--scp]
shine local upload <LOCAL_SOURCE> [REMOTE_DESTINATION] [--force] [--dry-run] [--scp]
shine local status
```

Shine 自己的 `--with`、`--with-secret` 必须写在 SSH 目标之前；其余参数会传给系统 `ssh`。`--with` 只读取同名明文配置，`--with-secret` 才会解密 `<KEY>_SECRET`。`shine local` 必须在这个远端 shell 中运行；目标已存在时先使用 `--dry-run` 预览，确认后再加 `--force` 覆盖文件或合并目录。

`--remote-shell` 默认为 `posix`。Windows 远端必须显式使用 `--remote-shell windows`；该模式
仅提供 PowerShell 环境注入，不建立 `shine local` 传输通道。`shine local ... --scp` 可在
POSIX 远端传输模式下跳过默认的 rsync 选择，强制使用 scp。

## 自定义来源与程序升级

```text
shine overlay link [<PATH> | --git <URL> [--branch <BRANCH>]] [--create]
shine overlay show
shine overlay unlink
shine pull
shine self install [--dest <PATH>]
shine self upgrade [--channel <stable|preview>]
```

预设作者可在 shell 类别的 `shine.toml` 文件条目中设置 `runtime = "bun"`，为 TypeScript 或 JavaScript 创建命令入口；这不是单独的 Shine 命令，也是当前唯一可选运行时。规则、前提和未来扩展边界见[可选运行时的 Shell 入口](../guides/custom-presets.md#可选运行时的-shell-入口)。
