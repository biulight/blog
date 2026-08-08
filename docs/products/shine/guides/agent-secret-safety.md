---
title: 在 AI Agent 参与开发时保护环境密钥
sidebar_position: 7
---

# 在 AI Agent 参与开发时保护环境密钥

Claude Code、Codex 等 AI Agent 参与开发后，密钥安全不再只是“不要提交 `.env`”这么简单。Agent 可能能读取工作区文件、运行命令、查看命令输出；如果把长期有效的明文 secret 放在项目里，它们很容易被复制到日志、补丁、上下文或远端服务中。

Shine 的 `env secret seal`、`env run` 和 `age` 后端用于降低这种扩散风险：把仓库中的 secret 保存为密文，只在需要运行命令时解密并注入子进程。但它们不是沙箱，也不能替代系统权限隔离。使用前应先明确密钥身份文件、硬件授权和 Agent 权限之间的边界。

## Shine env 保护什么

`shine env secret seal` 把 workspace 环境文件中的待处理 secret 封存到加密 payload 中。封存后，团队仓库里保留的是密文，不再是明文 token、密码或 API key。

```bash
shine env secret seal
```

`shine env run` 在启动目标命令前合并环境文件、解密 secret，并只把结果提供给这个子进程：

```bash
shine env run --mode development -- bun run build
```

这种方式主要减少三类风险：

- 明文 secret 长期留在项目文件中。
- 开发者为了运行任务，把 secret 导出到整个 shell 会话。
- AI Agent 修改代码时顺手读到、复制或提交 `.env` 明文。

但只要某个 Agent 被允许运行会读取环境变量的命令，它仍可能看到目标命令可见的 secret。`env run` 的安全边界是“按需注入”，不是“让不可信命令无法读取变量”。

## age identity 是解密能力

使用 `age` 后端时，`age_recipients = ["age1..."]` 表示密文要加密给谁。recipient 类似公钥地址：个人默认值可写入 `~/.shine/config.toml`，项目团队共享的名单应写入 `shine.workspace.toml` 的 `[env.encryption]`，后者可以提交到仓库。

```toml
secret_backend = "age"
age_recipients = ["age1se1qexample...", "age1qteammate..."]
age_identity = "~/.shine/age/identity.txt"
```

`~/.shine/age/identity.txt` 则是解密 identity，等同于私钥身份，不能提交、不能共享，也不应放进 Agent 可随意读取的工作区。

```bash
shine env secret identity init
shine env secret identity list
```

Shine 在 Unix/macOS 上会把自己生成的 identity 文件权限设置为 `0600`，也就是仅当前用户可读写。这可以避免其他本机用户直接读取 identity 文件。

这个权限限制仍然挡不住已经以当前用户身份运行、并被授权读取该路径的 Agent、脚本或进程。普通 age identity 保护的是仓库和传输中的密文，不是完整保护本机运行环境。

## Touch ID 改善什么

macOS 上可以生成 Secure Enclave / Touch ID identity：

```bash
shine env secret identity init --touch-id
```

这种身份由 `age-plugin-se` 生成。解密时需要本机 Secure Enclave，并触发 Touch ID 或系统 PIN 授权。即使 identity 文件被复制到另一台机器，通常也不能直接解密。

它带来的主要改进是：

- identity 不容易被复制后离线滥用。
- 解密需要用户在本机授权。
- Agent 即使能读到 identity 文件，也不能仅靠文件在别处解密。

它不是绝对隔离。若 Agent 能在本机运行解密命令，仍可能触发系统授权提示。看到意外的 Touch ID/PIN 提示时，应取消授权并检查刚才运行的命令。

## Windows 成员如何协作

Windows 成员可以使用普通 age identity 参与多 recipient 协作：

```bash
shine env secret identity init
shine env secret identity list
```

把输出中的 `age1...` recipient 加入 `age_recipients` 后，同一份密文可以同时加密给 macOS Touch ID recipient 和 Windows 普通 age recipient。

Windows 笔记本的指纹、Windows Hello、TPM 理论上可以通过 age plugin、Windows CNG/NCrypt 等机制实现类似体验。但目前没有像 macOS `age-plugin-se` 那样成熟通用的 age 社区方案，Shine 不把它写成当前稳定能力。

高安全 Windows 用户建议使用 YubiKey/PIV 或 GPG + YubiKey。普通团队开发协作可以使用普通 age identity，但要保护好 identity 文件和用户目录权限。

## 如何选择密钥后端

可以按下面的粗略顺序理解安全强度：

1. GPG + YubiKey / 硬件智能卡
2. age + Secure Enclave / Touch ID
3. 普通 age identity 文件
4. 明文 secret

`age + Touch ID` 通常比 `GPG + YubiKey` 更顺手，适合团队开发和预发环境。生产高价值 secret、长期凭据或需要强硬件隔离的场景，仍建议使用 GPG + YubiKey 或组织认可的硬件密钥方案。

## 给 AI Agent 的权限建议

把 Agent 当作一个有能力的本机协作者，而不是一个天然可信的安全边界。为它准备权限时，优先遵守这些规则：

- 不把 `~/.shine/age/identity.txt`、GPG 私钥、云厂商 credential 文件加入工作区。
- 不让 Agent 长时间运行带有高权限 secret 的交互式 shell。
- 需要 secret 时，优先让 Agent 修改代码，由用户在可信终端中执行 `shine env run`。
- 对低风险开发任务使用普通 age identity；对高敏感任务使用 Touch ID 或 YubiKey。
- 看到非预期的 Touch ID、PIN、YubiKey 触摸提示时取消授权。

如果 identity 文件泄露、设备不再可信，或成员离开团队，仅从 `age_recipients` 删除 recipient 不会撤销它对历史密文的访问。需要重新封存或重新加密，并在必要时轮换上游服务中的真实 token。

```bash
shine env secret seal
```

不要提交含有尚未封存字符串的环境文件。个人覆盖文件应加入 `.gitignore`，团队共享文件中只保留已封存的密文。
