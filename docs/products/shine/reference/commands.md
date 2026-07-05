---
title: 命令参考
sidebar_position: 1
---

# 命令参考

以下命令适用于 Shine 0.35.0。任何子命令都可以使用 `--help` 查看当前安装版本的准确参数。

## 顶层命令

| 命令 | 作用 |
| --- | --- |
| `shine init [--yes]` | 将当前目录初始化为预设目录 |
| `shine install <CATEGORY>` | 自动匹配并安装一个 shell 或 app 类别 |
| `shine reinstall <CATEGORY>` | 自动匹配并重新安装一个类别 |
| `shine uninstall <CATEGORY>` | 自动匹配并卸载一个类别 |
| `shine list` | 列出当前已安装且可用的预设与配置 |
| `shine info <TARGET>` | 查看已安装目标的状态和差异 |
| `shine update` | 检查受管内容和 Shine 稳定版更新 |
| `shine upgrade` | 更新已安装的 shell 与 app 配置 |
| `shine clear` | 清理架构变更后遗留的旧运行时状态 |
| `shine export` | 导出内置预设到当前预设目录 |
| `shine link <PATH>` | 设置外部预设目录 |
| `shine unlink` | 移除外部预设目录设置 |

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
shine update [--verbose] [--refresh]
shine upgrade [--verbose] [--prune-stale]
shine clear [--dry-run]
shine completions install
shine completions <bash|zsh|powershell>
```

- `--refresh` 跳过 24 小时版本检查缓存。
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
shine env encrypt [-r <RECIPIENT>] [--from <KEY>] [--set <KEY>]
shine env decrypt <KEY>
shine env export <KEY> [--as <ALIAS>]
shine env seal [FILE] [--workspace <FILE>] [-r <RECIPIENT>]
shine env run [--workspace <FILE>] [--mode <MODE>] -- <COMMAND>...
```

## 自定义来源与程序升级

```text
shine overlay link <PATH> [--create]
shine overlay show
shine overlay unlink
shine self install [--dest <PATH>]
shine self upgrade [--channel <stable|preview>]
```

