---
title: 同步终端主题
sidebar_position: 7
---

# 同步终端主题

在 macOS 或 Ubuntu 的受管 shell profile 中，Shine 可以自动判断终端背景是浅色还是深色，并导出 `SHINE_TERMINAL_THEME=light|dark`。同时会为未自行设置的 `BAT_THEME` 选择 `GitHub`（浅色）或 `OneHalfDark`（深色）。

## 手动检查

```bash
shine theme sync
eval "$(shine theme sync --quiet)"
```

第一条命令只显示应写入 shell 的 `export` 语句；第二条才会在当前 shell 生效。已经自行设置的 `BAT_THEME` 不会被覆盖。

Shine 依次使用已有的 `SHINE_TERMINAL_THEME`、终端提供的 `COLORFGBG`，最后才通过 OSC 11 查询终端背景色。无法确定时不会猜测或写入变量。

## 在受管 profile 中自动同步

运行 `shine sys bootstrap` 后，macOS 和 Ubuntu 的受管 profile 会自动调用同步。可通过任一种方式关闭：

```toml title="~/.shine/config.toml"
sync_terminal_theme = false
```

```bash
export SHINE_SYNC_TERMINAL_THEME=0
```

环境变量优先级更高，适合临时禁用。即使关闭自动同步，仍可随时手动运行 `shine theme sync`。

也可以安装 `utils` 类别中的 `shine-theme-sync` 命令，用于自己维护的 profile：

```bash
shine shell install utils
eval "$(shine-theme-sync)"
```

## SSH 会话

`shine ssh <HOST>` 会在本机连接前读取当前终端主题，并将结果注入远端会话。因此远端无需能响应 OSC 11 查询，且 `bat` 等工具可与本机终端保持一致。
