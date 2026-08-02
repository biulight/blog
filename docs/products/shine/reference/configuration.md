---
title: 配置参考
sidebar_position: 2
---

# 配置参考

Shine 将全局运行时状态保存在 `~/.shine/`。首次需要配置时会创建 `~/.shine/config.toml`。

## 常用全局字段

```toml
presets_dir = "~/dotfiles/shine-presets"
presets_overlay_git = "https://example.com/team/shine-overlay.git"
presets_overlay_git_branch = "main"
app_default_dest_root = "~/.config"
allow_app_hooks = true
sync_terminal_theme = true
gpg_key_id = "user@example.com"

secret_backend = "age"
age_recipients = ["age1se1qexample...", "age1qteammate..."]
age_identity = "~/.shine/age/identity.txt"

[env]
HTTP_PROXY_PORT = "6152"
SOCKS5_PROXY_PORT = "6153"
PROXY_HOST = "127.0.0.1"
PROXY_NO_PROXY = "localhost,127.0.0.1,::1"
MY_API_TOKEN = { value = "<令牌>", description = "内部 API 的访问令牌" }
```

| 字段 | 作用 |
| --- | --- |
| `presets_dir` | 使用完整的外部预设目录替代内置预设 |
| `presets_overlay_git` | 由 Shine 浅克隆并镜像到 `~/.shine/overlay/` 的 Git overlay URL |
| `presets_overlay_git_branch` | Git overlay 跟踪的分支；省略时使用远端默认分支 |
| `app_default_dest_root` | 未声明目标路径的旧式 app 预设默认根目录 |
| `allow_app_hooks` | 允许外部 app 预设在安装或升级后运行生命周期钩子 |
| `sync_terminal_theme` | 控制受管 Unix shell profile 是否自动运行终端主题同步，默认为启用 |
| `gpg_key_id` | `shine env secret encrypt` 默认 GPG recipient |
| `secret_backend` | 默认密钥后端，省略时为 `gpg` |
| `age_recipients` | `age` 后端默认加密接收者列表 |
| `age_identity` | 解密 `age:` 密文时使用的身份文件路径，省略时可使用 `~/.shine/age/identity.txt` |
| `[env]` | 模板变量及 shell helper 使用的值 |

## Env 条目格式与说明

全局 `config.toml`、项目 `shine.config.toml` 的 `[env]`，以及各层 `shine.env.toml` 覆盖
文件，都支持两种等价的值格式：

```toml
[env]
PLAIN_VALUE = "example"
DETAILED_VALUE = { value = "example", description = "供构建任务使用的示例变量" }
```

- 字符串适合不需要补充说明的变量。
- 详细格式中的 `value` 参与 `env get`、模板替换、`env secret encrypt`、`env secret export` 和
  `env run --with`，行为与字符串格式相同。
- `description` 只用于 `shine env list` 的可读说明，不会传入子进程或模板。
- 当前配置中的内联 `description` 优先于预设 `<presets>/env.toml` catalog 的同名说明。
- `shine env set` 更新已有详细条目时会保留其 `description`。
- 覆盖文件中的详细项同时覆盖值和说明；字符串只覆盖值，并保留从低优先级配置或 preset
  catalog 继承的说明。
- 数字、数组、缺少字符串 `value` 等无效类型会报告文件路径和变量名，不会被静默忽略。

## 项目配置

Shine 从当前目录向上查找最近的 `shine.config.toml`。项目配置是全局配置之上的稀疏覆盖层；没有声明的字段继续继承全局值，相对路径以声明它的配置文件所在目录为基准。

Shine 0.40.0 不再识别项目中的旧式 `config.toml` 和 `.env.toml`。升级前请分别改名为
`shine.config.toml` 和 `shine.env.toml`；普通同名文件会被忽略，不会作为 Shine 配置读取。

Shine 0.40.0 也不再自动迁移旧的全局 `~/.shine/env.toml`。升级前可先运行一次 v0.39 完成迁移；已经升级时，请将旧文件移动为 `~/.shine/shine.env.toml`，若目标文件已存在则手动合并。检测到旧文件时，普通配置加载会停止并显示恢复提示，避免悄悄忽略仍在使用的值。

## 目录与来源优先级

预设目录按以下顺序选择：

1. `SHINE_PRESETS`
2. 项目 `shine.config.toml` 中的 `presets_dir`
3. 全局 `config.toml` 中的 `presets_dir`
4. 默认 `~/.shine/presets/`

`SHINE_CONFIG_DIR` 会改变全局配置和运行时状态目录；未另行指定预设来源时，预设目录为 `$SHINE_CONFIG_DIR/presets/`。

Overlay 在选定的基础预设来源上按相同相对路径覆盖文件，不替代整棵目录。手动关联的
`presets_overlay_dir` 与 `presets_overlay_git` 互斥；使用 `shine preset overlay link` 可避免同时配置。
Git 管理的 overlay 只有在首次 `shine preset pull` 克隆成功后才生效，本地检出会在后续拉取时
强制镜像到远端状态，因此不要直接修改 `~/.shine/overlay/`。

## Env 值覆盖顺序

同名环境值按以下顺序合并，后者覆盖前者：

1. 内置默认值
2. 全局 `[env]`
3. 项目 `[env]`
4. 全局 `~/.shine/shine.env.toml`
5. 当前 overlay 的 `shine.env.toml`
6. 项目 `shine.env.toml`

`shine.env.toml` 是不带 `[env]` 表头的覆盖文件，例如：

```toml
HTTP_PROXY_PORT = "7890"
PROXY_HOST = { value = "127.0.0.1", description = "本地代理主机" }
```

## Workspace 环境

`shine.workspace.toml` 定义项目可用 mode、环境源文件和加密 recipient：

```toml
version = 1

[env]
modes = ["development", "production"]
default_mode = "development"
override_process_env = false
files = [
  ".env.shine.toml",
  ".env.local.shine.toml",
  ".env.{mode}.shine.toml",
  ".env.{mode}.local.shine.toml",
]

[env.encryption]
recipient = "user@example.com"
# 也可使用 age 后端
# backend = "age"
# age_recipients = ["age1se1qexample...", "age1qteammate..."]
```

环境源按 `files` 顺序合并。默认保留当前进程已经存在的变量；设置 `env.override_process_env = true` 后，改由 workspace 值覆盖。

每个环境源文件使用以下结构：

```toml
version = 1

[plain]
PUBLIC_VALUE = "example"

[secret]
EXISTING_SECRET = true
PROMPT_ON_SEAL = false
PLAINTEXT_TO_SEAL = "<待封存的值>"

[payload]
data = "<由 Shine 管理的 GPG 密文>"
```

`shine env secret seal` 会把 `[secret]` 中的待处理值合并进加密 payload，并将已封存项改为
`true`。`shine env run` 按文件顺序合并 `[plain]` 和解密后的 secret；配置了可用的 GPG
recipient 时，还会维护按 mode 区分的加密缓存。

`shine env run --with KEY[=ALIAS]` 还可注入当前 Shine 配置 `[env]` 中的值。它优先读取
`KEY_SECRET`，不存在时读取 `KEY`；显式注入值覆盖 workspace 和当前进程中的同名变量。

## 受管目录

```text
~/.shine/
├── config.toml
├── shine.env.toml
├── app-manifest.toml
├── tasks.toml
├── bin/
├── http/
├── overlay/
├── rendered/
└── presets/
    ├── app/
    ├── shell/
    └── sys/
```

不要手工删除 manifest 后再期望 Shine 识别旧安装；优先使用对应的 `uninstall --dry-run` 和 `uninstall`。
