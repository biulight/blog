---
title: 管理环境变量与密钥
sidebar_position: 5
---

# 管理环境变量与密钥

Shine 可以保存预设模板变量，也可以使用 GPG 封存项目环境中的敏感值。不要把真实密钥写进公开仓库或文档示例。

`shine env seal`、workspace 形式的 `shine env run`、`env run --with` 以及 `age` 密钥后端均已包含在 Shine 0.37.0 中。

## 查看和设置变量

```bash
shine env show
shine env get HTTP_PROXY_PORT
shine env set HTTP_PROXY_PORT 6152
shine env delete HTTP_PROXY_PORT
```

`PROXY_NO_PROXY` 控制 `setproxy` 设置的 `NO_PROXY` 和 `no_proxy`，默认为
`localhost,127.0.0.1,::1`。修改它或其他代理变量后，`shine update` 会把已安装的
`proxy` shell 预设标记为可更新；运行 `shine upgrade` 应用新值。

`shine env show` 默认隐藏敏感值；`--reveal` 会显示完整值，应只在安全终端中使用。变量通常保存到当前配置的 `[env]` 表。

全局 `~/.shine/config.toml` 和项目 `shine.config.toml` 的 `[env]` 支持简写字符串，也支持
同时记录值和说明：

```toml
[env]
HTTP_PROXY_PORT = "6152"
MY_API_TOKEN = { value = "<令牌>", description = "内部 API 的访问令牌" }
```

`value` 的使用方式与简写字符串完全相同；`description` 会显示在 `shine env show` 中。
对已有详细条目执行 `shine env set MY_API_TOKEN <新值>` 时，Shine 会更新 `value` 并保留
说明。

不带 `[env]` 表头的全局、overlay 和项目 `shine.env.toml` 覆盖文件也支持这两种格式：

```toml
HTTP_PROXY_PORT = "7890"
PROXY_HOST = { value = "127.0.0.1", description = "本地代理主机" }
```

详细项同时覆盖值和说明；字符串只覆盖值，并保留低优先级配置或 preset catalog 提供的
说明。数字、数组、缺少 `value` 等无效条目会直接报错，不会被静默忽略。

修改用于模板渲染的值后，运行：

```bash
shine upgrade
```

## 使用 GPG 加密值

先确认本机的 `gpg` 可以使用对应公钥；私钥保存在 YubiKey 时，可参考
[在 macOS 和 Windows 使用 YubiKey OpenPGP](../../../knowledge/yubikey-openpgp.md)完成接入。然后在
`~/.shine/config.toml` 中指定默认接收者：

```toml
gpg_key_id = "user@example.com"
```

将已有明文变量加密并保存为另一个 key：

```bash
shine env encrypt --from MY_TOKEN --set MY_TOKEN_SECRET
shine env decrypt MY_TOKEN_SECRET
```

加密只需要接收者公钥；解密时才需要连接持有对应私钥的 YubiKey，并按提示输入 PIN 或触摸设备。

需要导出到当前 shell 时：

```bash
eval "$(shine env export MY_TOKEN)"
eval "$(shine env export MY_TOKEN --as API_TOKEN)"
```

安装 `utils` shell 预设后，也可以使用 `shine-env-export MY_TOKEN --as API_TOKEN`。

## 使用 age 与 Touch ID

Shine 支持 `age` 作为第二种密钥后端。它适合把密文提交到团队仓库中，并加密给多个成员各自的 recipient。已有 GPG 密文不需要迁移：不带标签的旧密文继续按 GPG 解密，`age` 后端生成的新密文会带有 `age:` 标签。

先安装 `age`。macOS 上如需 Touch ID / Secure Enclave 身份，还需要 `age-plugin-se`：

```bash
brew install age age-plugin-se
```

生成身份并记录输出中的 recipient：

```bash
shine env identity init
shine env identity init --touch-id
shine env identity show
```

`--touch-id` 只适用于 macOS；解密时会触发系统 Touch ID 提示。普通身份使用 `age-keygen`，默认写入 `~/.shine/age/identity.txt`。

把默认后端和团队 recipient 写入 `~/.shine/config.toml`：

```toml
secret_backend = "age"
age_recipients = ["age1se1qexample...", "age1qteammate..."]
age_identity = "~/.shine/age/identity.txt"
```

也可以只在单次命令中选择后端和 recipient：

```bash
shine env encrypt --backend age -r age1se1qexample... -r age1qteammate... --from MY_TOKEN
shine env seal --backend age -r age1se1qexample... -r age1qteammate...
```

`-r/--recipient` 对 GPG 和 age 都可以重复使用。移除某个 recipient 不会撤销它对历史密文的访问；需要重新加密或重新 `seal` 才能轮换访问范围。

如果 AI Agent 会参与开发，先阅读[在 AI Agent 参与开发时保护环境密钥](./agent-secret-safety.md)，确认 identity 文件、Touch ID 和命令执行权限的安全边界。

## 只向一个命令提供变量

不修改当前终端、也不创建 workspace 文件时，使用可重复的 `--with`：

```bash
shine env run --with MY_TOKEN -- bun run build
shine env run --with MY_TOKEN=API_TOKEN -- bun run build
shine env run --with TOKEN_A --with TOKEN_B=OTHER_TOKEN -- bun run build
```

每个 `KEY` 都优先解密 `<KEY>_SECRET`，不存在时才读取明文 `<KEY>`。等号右侧是子进程中
的变量名。显式 `--with` 值优先于当前进程和 workspace 的同名变量。

## 使用分层项目环境

在项目根目录创建 `shine.workspace.toml`，声明可用 mode、按顺序合并的文件和 GPG recipient：

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
# 也可使用 age
# backend = "age"
# age_recipients = ["age1se1qexample...", "age1qteammate..."]
```

后面的环境文件覆盖前面的文件。`{mode}` 会替换为 `--mode` 指定的值；省略 `--mode`
时使用 `default_mode`。环境源文件可以同时包含明文值和待封存的 secret：

```toml
version = 1

[plain]
VITE_APP_NAME = "Example App"

[secret]
DATABASE_URL = true
API_TOKEN = false
SENTRY_TOKEN = "<待封存的值>"

[payload]
data = "<由 Shine 管理的 GPG 密文>"
```

- `true` 保留 payload 中已有的密文值。
- `false` 会在下次 `seal` 时安全提示输入。
- 字符串会在封存后替换为 `true`，避免明文继续留在文件中。

封存待处理的 secret，再用合并后的环境启动命令：

```bash
shine env seal
shine env run --mode production -- bun run build
```

`seal` 默认处理 workspace 引用的环境文件。可用 `shine env seal <FILE>` 只处理一个文件，
或通过 `--workspace <FILE>` 指定其他 workspace；`-r/--recipient` 可临时覆盖接收者。

默认情况下，当前进程已经存在的环境变量优先于 workspace。设置
`env.override_process_env = true` 后改由 workspace 值覆盖；显式 `--with` 始终具有最高
优先级。

配置了可用的 GPG recipient 时，`env run` 会在系统缓存目录按 mode 保存 GPG 加密缓存。
workspace、源文件内容或文件顺序变化后缓存会自动重建；无需手工编译或删除缓存。

个人覆盖文件应加入 `.gitignore`：

```gitignore
.env.local.shine.toml
.env.*.local.shine.toml
```

不要提交含有尚未封存字符串的环境文件。可在提交前搜索 `[secret]` 项并确认它们都已变为
`true`。

环境文件结构和覆盖顺序见[配置参考](../reference/configuration.md)。
