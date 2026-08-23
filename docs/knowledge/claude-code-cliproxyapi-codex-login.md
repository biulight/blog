---
title: 通过 CLIProxyAPI 让 Claude Code 使用 GPT
sidebar_position: 7
---

# 通过 CLIProxyAPI 让 Claude Code 使用 GPT

如果希望保留 Claude Code 的交互方式，但把模型请求交给 GPT，可以让 Claude Code
连接本机 CLIProxyAPI，再由 CLIProxyAPI 使用 Codex OAuth 凭据访问上游。

这里有两层不同的认证：

- `cliproxyapi --codex-login` 登录 OpenAI/Codex 上游，并把 OAuth 凭据保存到
  CLIProxyAPI 的 `auth-dir`；
- `ANTHROPIC_AUTH_TOKEN` 是 Claude Code 访问本地 CLIProxyAPI 时使用的 API key，
  必须和 CLIProxyAPI 配置中的 `api-keys` 一致。

因此，这个场景不需要在 Claude Code 中执行 `claude auth login`。Claude Code 不会直接读取
Codex OAuth 凭据，而是通过本地代理间接使用它。

## 前置条件

- 已安装 Claude Code 和 CLIProxyAPI；
- 用于登录的 OpenAI 账号可以使用 Codex；
- 浏览器能够访问 OpenAI 登录页面；
- 本机 OAuth 回调端口 `1455` 没有被占用；
- 已准备一个仅供本地客户端访问 CLIProxyAPI 的随机 API key。

先确认当前 CLIProxyAPI 版本支持 Codex OAuth：

```bash
cliproxyapi --help
```

输出中应包含 `codex-login`。本文已使用 CLIProxyAPI `7.2.110` 和 Claude Code
`2.1.220` 核对相关命令。

## 1. 登录 OpenAI/Codex 上游

在运行 CLIProxyAPI 的同一用户下执行：

```bash
cliproxyapi --codex-login
```

CLIProxyAPI 会打开浏览器并等待 OAuth 回调。在浏览器中完成 OpenAI 登录和授权后，
回到终端确认认证成功。登录过程中不要提前关闭这个终端。

如果当前环境不能自动打开浏览器，使用：

```bash
cliproxyapi --codex-login --no-browser
```

复制终端输出的登录地址到浏览器中完成授权。CLIProxyAPI 的 Codex OAuth 回调默认使用
`1455` 端口；在远程主机或容器中运行时，还需要保证浏览器回调能够到达该端口，并按终端
提示粘贴回调地址。

OAuth 凭据会保存到 CLIProxyAPI 配置的 `auth-dir`。默认配置通常是：

```yaml
auth-dir: "~/.cli-proxy-api"
```

不要读取、提交或分享该目录中的凭据文件。若 CLIProxyAPI 由 Homebrew、systemd 或容器
运行，登录命令与服务必须使用同一个持久化的 `auth-dir`。

## 2. 配置本地代理认证

打开 CLIProxyAPI 的配置文件，确认 `api-keys` 只包含你实际使用的 key：

```yaml
api-keys:
  - "<LOCAL_PROXY_API_KEY>"
```

不要保留 `your-api-key-1`、`your-api-key-2` 等示例值。部分 CLIProxyAPI 版本会把它们
视为不安全的模板 key，并禁用 `/v1/*` 端点，返回：

```text
403 unsafe_example_api_key
```

修改配置或完成 OAuth 登录后，重启正在运行的 CLIProxyAPI。使用 Homebrew 服务时执行：

```bash
brew services restart cliproxyapi
brew services info cliproxyapi
```

如果 CLIProxyAPI 访问 OpenAI 时还需要经过本机网络代理，应在 CLIProxyAPI 配置中设置
`proxy-url`，而不是只在当前终端临时设置 `HTTP_PROXY`。后台服务通常不会继承当前 shell
的环境变量。

## 3. 验证 CLIProxyAPI

先确认本地端点接受配置的 API key，并查看实际可用的模型：

```bash
curl -fsS \
  -H 'Authorization: Bearer <LOCAL_PROXY_API_KEY>' \
  http://127.0.0.1:8317/v1/models |
  jq -r '.data[].id'
```

成功时会输出模型名称。后续填写 Claude Code 的默认模型前，应以这里的结果为准。

如果返回 `401` 或 `403`，先检查：

- 请求中的 `<LOCAL_PROXY_API_KEY>` 是否与 `api-keys` 完全一致；
- `api-keys` 中是否还残留模板值；
- OAuth 登录使用的 `auth-dir` 是否和服务实际读取的目录相同；
- CLIProxyAPI 是否已在 `8317` 端口重新启动并监听。

## 4. 让 Claude Code 使用本地代理

在准备启动 Claude Code 的同一个终端中设置：

```bash
export ANTHROPIC_BASE_URL=http://127.0.0.1:8317
export ANTHROPIC_AUTH_TOKEN=<LOCAL_PROXY_API_KEY>

export ANTHROPIC_DEFAULT_OPUS_MODEL=gpt-5.6-sol
export ANTHROPIC_DEFAULT_SONNET_MODEL=gpt-5.6-terra
export ANTHROPIC_DEFAULT_HAIKU_MODEL=gpt-5.6-luna
export CLAUDE_CODE_EFFORT_LEVEL=high
```

上面的 GPT 模型名是一个已验证环境中的映射示例。只有当 `/v1/models` 确实返回这些名称时
才应照搬；否则，请换成代理当前列出的可用模型。

`CLAUDE_CODE_EFFORT_LEVEL=high` 将 Claude Code 的推理强度设为 `high`。

`ANTHROPIC_AUTH_TOKEN` 会作为 `Authorization` 请求头发送给 LLM 网关。它不是 OpenAI
OAuth token，也不应填写 `auth-dir` 中保存的任何凭据内容。

执行一个最小测试：

```bash
claude -p '只回复 OK' --model sonnet
```

正常返回 `OK`，并且 CLIProxyAPI 日志中出现对应请求，就说明链路已经打通：

```text
Claude Code -> CLIProxyAPI -> Codex OAuth -> GPT
```

## Claude Code 仍要求登录

先确认变量确实存在于启动 Claude Code 的当前 shell：

```bash
env |
  rg '^(ANTHROPIC_BASE_URL|ANTHROPIC_AUTH_TOKEN|ANTHROPIC_DEFAULT_(OPUS|SONNET|HAIKU)_MODEL)='
```

然后直接使用前面的 `claude -p` 命令测试，不要执行 `claude auth login`。如果变量在另一个
终端、脚本或 shell 配置中设置，当前 Claude Code 进程不会自动继承。

还应把下面两类问题分开判断：

- Claude Code 在启动界面要求登录：重点检查 `ANTHROPIC_BASE_URL` 和
  `ANTHROPIC_AUTH_TOKEN` 是否传入当前进程；
- Claude Code 已发出请求，但收到 `401`、`403` 或模型不存在：重点检查 CLIProxyAPI
  的本地 API key、Codex OAuth 凭据、上游网络和模型列表。

## 相关内容

- [CLIProxyAPI：Codex（OpenAI via OAuth）](https://help.router-for.me/configuration/provider/codex)
- [Anthropic：LLM gateway configuration](https://docs.anthropic.com/en/docs/claude-code/llm-gateway)
