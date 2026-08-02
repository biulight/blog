---
title: 任务与本地服务
sidebar_position: 6
---

# 任务与本地服务

本页说明如何保存个人快捷命令，以及把 app 预设生成的资源通过本机 HTTP 地址提供给其它应用读取。

## 保存常用命令

把一条完整命令保存为任务：

```bash
shine task save logs -- tail -f /var/log/example.log
shine task save kill-port -- sh -c 'lsof -ti :3000 | xargs kill'
shine task save project-check --cwd ~/src/example -- bun run check
```

之后可以从任意目录运行：

```bash
shine task run logs
shine run logs
shine task list
shine task info kill-port
```

任务保存在当前 Shine 运行时目录的 `tasks.toml` 中；设置 `SHINE_CONFIG_DIR` 或全局 `--config-dir` 时，会使用对应目录下的任务列表。通过 `--cwd` 保存的任务始终从该目录运行；未设置时继续使用调用者的当前目录。

Shine 按参数数组保存并直接执行命令，不会自动经过 shell。因此普通参数边界会被保留，退出码也会原样传递给调用方。需要管道、重定向、变量展开或通配符时，把 shell 写进任务本身，例如 `sh -c '...'`。Windows 上没有系统自带的 `sh`，这类写法只适合 Unix 环境。

覆盖或删除任务：

```bash
shine task save logs --force -- journalctl -f
shine task delete logs
```

任务名只能包含字母、数字、点、短横线和下划线，并且必须以字母或数字开头。

## 生成 app 辅助资源

部分 app 预设可以声明构建脚本，用来根据当前配置生成额外文件：

```bash
shine app artifact apply surge
```

`app artifact apply` 是显式操作；`shine app install`、`shine update` 和 `shine upgrade` 不会自动运行 artifact 脚本。脚本失败时命令会失败，脚本输出会直接显示在终端。

构建脚本会收到当前 `[env]` 表中的值，以及一组由 Shine 设置的路径变量：

| 变量 | 作用 |
| --- | --- |
| `SHINE_APP_ID` | 当前 app 预设 ID |
| `SHINE_APP_DIR` | 实际运行脚本的 app 目录，overlay 中有脚本时指向 overlay |
| `SHINE_APP_SOURCE_DIR` | 基础 app 预设目录 |
| `SHINE_APP_OVERLAY_DIR` | 当前 app 的 overlay 目录；没有 overlay 时不设置 |
| `SHINE_APP_HTTP_DIR` | 该 app 可发布资源目录，位于 `~/.shine/http/app/<APP_ID>/` |
| `SHINE_CONFIG_DIR` | 当前 Shine 运行时目录 |
| `SHINE_CACHE_DIR` | 当前 app 的缓存目录 |
| `SHINE_STATE_DIR` | 当前 app 的状态目录 |

`[env]` 值会按存储内容传入，不会自动解密 `_SECRET` 项，也不会触发 GPG、age 或 Touch ID 提示。

## 启动本地 HTTP 服务

需要让其它本机应用读取 `~/.shine/http/` 下的资源时，先启动服务：

```bash
shine serve start
```

默认监听 `127.0.0.1:6174`。如需 macOS 用户服务：

```bash
shine serve install
shine serve status
shine serve uninstall
```

`serve install` 当前只支持 macOS，并使用 launchd 安装用户服务。前台运行或用户服务都只绑定 `127.0.0.1`。

为已生成的资源打印 URL：

```bash
shine serve url app/surge/custom-rules.sgmodule
shine serve url app/surge/custom-rules.sgmodule --port 6180
```

不要把令牌、私钥、cookies 或其它敏感内容写入 `~/.shine/http/`。服务没有额外认证；在共享机器上，本机其它用户也可能访问这个端口读取可发布目录中的文件。
