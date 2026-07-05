---
title: 配置参考
sidebar_position: 2
---

# 配置参考

Shine 将全局运行时状态保存在 `~/.shine/`。首次需要配置时会创建 `~/.shine/config.toml`。

## 常用全局字段

```toml
presets_dir = "~/dotfiles/shine-presets"
app_default_dest_root = "~/.config"
gpg_key_id = "user@example.com"

[env]
HTTP_PROXY_PORT = "6152"
SOCKS5_PROXY_PORT = "6153"
PROXY_HOST = "127.0.0.1"
PROXY_NO_PROXY = "localhost,127.0.0.1,::1"
```

| 字段 | 作用 |
| --- | --- |
| `presets_dir` | 使用完整的外部预设目录替代内置预设 |
| `app_default_dest_root` | 未声明目标路径的旧式 app 预设默认根目录 |
| `gpg_key_id` | `shine env encrypt` 默认 GPG recipient |
| `[env]` | 模板变量及 shell helper 使用的值 |

## 项目配置

Shine 从当前目录向上查找最近的 `shine.config.toml`。项目配置是全局配置之上的稀疏覆盖层；没有声明的字段继续继承全局值，相对路径以声明它的配置文件所在目录为基准。

旧式项目 `config.toml` 和 `.env.toml` 仅作为兼容方式读取，并计划在 Shine 0.40.0 停止支持。分别改名为 `shine.config.toml` 和 `shine.env.toml`。

## 目录与来源优先级

预设目录按以下顺序选择：

1. `SHINE_PRESETS`
2. 项目 `shine.config.toml` 中的 `presets_dir`
3. 全局 `config.toml` 中的 `presets_dir`
4. 默认 `~/.shine/presets/`

`SHINE_CONFIG_DIR` 会改变全局配置和运行时状态目录；未另行指定预设来源时，预设目录为 `$SHINE_CONFIG_DIR/presets/`。

Overlay 在选定的基础预设来源上按相同相对路径覆盖文件，不替代整棵目录。

## Env 值覆盖顺序

同名环境值按以下顺序合并，后者覆盖前者：

1. 内置默认值
2. 全局 `[env]`
3. 项目 `[env]`
4. 全局 `~/.shine/shine.env.toml`
5. 当前 overlay 的 `shine.env.toml`
6. 项目 `shine.env.toml`

`shine.env.toml` 是扁平 TOML 文件，例如：

```toml
HTTP_PROXY_PORT = "7890"
PROXY_HOST = "127.0.0.1"
```

## Workspace 环境

`shine.workspace.toml` 定义项目可用 mode、环境源文件和加密 recipient：

```toml
version = 1

[env]
modes = ["development", "production"]
default_mode = "development"
files = [
  ".env.shine.toml",
  ".env.local.shine.toml",
  ".env.{mode}.shine.toml",
  ".env.{mode}.local.shine.toml",
]

[env.encryption]
recipient = "user@example.com"
```

环境源按 `files` 顺序合并。默认保留当前进程已经存在的变量；设置 `env.override_process_env = true` 后，改由 workspace 值覆盖。

## 受管目录

```text
~/.shine/
├── config.toml
├── shine.env.toml
├── app-manifest.toml
├── bin/
├── rendered/
└── presets/
    ├── app/
    ├── shell/
    └── sys/
```

不要手工删除 manifest 后再期望 Shine 识别旧安装；优先使用对应的 `uninstall --dry-run` 和 `uninstall`。

