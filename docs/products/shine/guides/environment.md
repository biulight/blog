---
title: 管理环境变量与密钥
sidebar_position: 5
---

# 管理环境变量与密钥

Shine 可以保存预设模板变量，也可以使用 GPG 封存项目环境中的敏感值。不要把真实密钥写进公开仓库或文档示例。

## 查看和设置变量

```bash
shine env show
shine env get HTTP_PROXY_PORT
shine env set HTTP_PROXY_PORT 6152
shine env delete HTTP_PROXY_PORT
```

`shine env show` 默认隐藏敏感值；`--reveal` 会显示完整值，应只在安全终端中使用。变量通常保存到当前配置的 `[env]` 表。

修改用于模板渲染的值后，运行：

```bash
shine upgrade
```

## 使用 GPG 加密值

先在配置中指定默认接收者：

```toml
gpg_key_id = "user@example.com"
```

将已有明文变量加密并保存为另一个 key：

```bash
shine env encrypt --from MY_TOKEN --set MY_TOKEN_SECRET
shine env decrypt MY_TOKEN_SECRET
```

需要导出到当前 shell 时：

```bash
eval "$(shine env export MY_TOKEN)"
eval "$(shine env export MY_TOKEN --as API_TOKEN)"
```

安装 `utils` shell 预设后，也可以使用 `shine-env-export MY_TOKEN --as API_TOKEN`。

## 在项目中运行命令

项目可通过 `shine.workspace.toml` 声明环境文件、mode 和 GPG recipient。封存待处理 secret 后，以合并环境运行命令：

```bash
shine env seal
shine env run --mode production -- bun run build
```

个人覆盖文件应加入 `.gitignore`：

```gitignore
.env.local.shine.toml
.env.*.local.shine.toml
```

环境文件的完整结构和覆盖顺序见[配置参考](../reference/configuration.md)。

