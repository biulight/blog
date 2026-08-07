---
title: 内置预设
sidebar_position: 3
---

# 内置预设

Shine 将这些预设编译进 CLI。它们用于安装或管理**配置和开发环境项目**，不会自动安装对应的桌面应用。执行前先查看详情与预览，确认目标路径、备份和权限范围：

```bash
shine shell list
shine app list
shine app info ghostty
shine app install ghostty --dry-run
shine sys list --all
shine sys info split-dns
```

本文依据 Shine 1.2.0 源码中的内置 `presets/` 目录编写。使用其它版本时请以 `shine list --available` 和 `--help` 的输出为准。

## Shell 预设

安装 shell 类别会把命令入口放入 `~/.shine/bin/`，并在受支持的 Bash、Zsh 或 PowerShell profile 中创建 wrapper。下表标有“当前会话”的命令实际会由 wrapper `source`，因此可以修改当前终端的环境；不要绕过 wrapper 直接执行脚本。

<div className="built-in-presets-shell-table" aria-hidden="true" />

| 类别 | 命令 | 用途与前提 |
| --- | --- | --- |
| `agent` | `ccenv` | 通过 Bun 在 macOS、Linux 或 Windows 选择 Codex（默认）、DeepSeek 或 Qwen，并启动 Claude Code。provider 变量只进入该子进程；需要已安装 `bun`、`shine` 和 Claude Code。 |
| `proxy` | `setproxy` | 为当前会话设置 HTTP/HTTPS/SOCKS5、npm 和 pnpm 代理。使用 `HTTP_PROXY_PORT`、`SOCKS5_PROXY_PORT`、`PROXY_HOST`、`PROXY_NO_PROXY`；`auto` 优先 SOCKS5。若安装了 Yarn，它会修改 Yarn 的持久代理配置。 |
| `proxy` | `usetproxy` | 清除当前会话的代理变量，并清除 `setproxy` 写入的 Yarn 代理配置。 |
| `utils` | `copyfile` | 通过 OSC52 把一个文件内容复制到本地剪贴板；仅 Unix，终端或终端复用器必须允许 OSC52。 |
| `utils` | `shine-env-export` | 将一个 Shine env 值导入当前会话；可读取同名明文值，或解密 `<KEY>_SECRET`。 |
| `utils` | `shine-theme-sync` | 输出并导入终端明暗主题对应的 `SHINE_TERMINAL_THEME` 与 `BAT_THEME`。 |

`ccenv` 的 Codex provider 通过本机 CLIProxyAPI 使用 `CLIPROXYAPI_AUTH_TOKEN`；DeepSeek 和 Qwen 分别使用对应的 `*_API_KEY`。凭据按 `_SECRET`、旧版 `_GPG_SECRET`、明文值的顺序解析；一旦选中的密文解密失败就会停止，不会回退。CLIProxyAPI 应只绑定回环地址，并配置与客户端相同的 token。

更多安装、重装与卸载说明见[管理 Shell 预设](../guides/shell-presets.md)，环境变量格式见[管理环境变量](../guides/environment.md)。

## App 预设

<div className="built-in-presets-app-table" aria-hidden="true" />

| 类别 | 平台与目标 | 管理内容与注意事项 |
| --- | --- | --- |
| `archey4` | Unix；`~/.config/archey4/` | Archey4 系统信息配置。 |
| `clash-verge` | macOS、Linux、Windows；`~/.shine/clash-verge/` | Clash Verge Rev 的订阅增强示例。构建与清理需要 Bun；实际订阅编辑器绑定与完整流程见[应用配置指南](../guides/app-presets.md#clash-verge-rev)。 |
| `docker-desktop` | Windows；`~/AppData/Roaming/Docker/settings-store.json` | 仅 JSON 合并管理 `proxy` 与 `containersProxy` 键；使用模板渲染，完成后重启 Docker Desktop。 |
| `docker-engine` | Unix：`/etc/docker/daemon.json`；Windows：`~/.docker/daemon.json` | Docker daemon 配置，使用模板和 JSONC 转 JSON；Unix 目标需要管理员权限，完成后重启 Docker Engine。 |
| `fastfetch` | `~/.config/fastfetch/` | Fastfetch 系统信息配置。 |
| `ghostty` | Unix；`~/.config/ghostty/` | Ghostty 主配置与内置明暗主题；主题背景可使用 `GHOSTTY_BG_LIGHT`、`GHOSTTY_BG_DARK` 模板变量。 |
| `git` | `~/.gitconfig` | Git 常用别名和默认配置。安装前会按普通 app 预设规则备份不受管文件。 |
| `JetBrains` | `~/.ideavimrc` | JetBrains 的 IdeaVim 配置；需要已在 IDE 中启用 IdeaVim 插件。 |
| `starship` | `~/.config/starship.toml` | Starship prompt 配置；需要另行安装并在 shell 中启用 Starship。 |
| `surge` | macOS；`~/Library/Application Support/Surge/Profiles/` | 本地代理、策略组和规则文件，以及可选的 URI 订阅生成文件。需已安装 Surge；生成、刷新和 `app artifact apply/remove` 的 profile `#!include` 流程见[应用配置指南](../guides/app-presets.md#生成式文件与-surge-uri-订阅)。 |
| `vim` | `~/.vim/` | Vim 基础配置和机器本地覆盖文件。 |

`docker-desktop` 的 JSON 合并保留其它 Docker Desktop 设置；所有其它 app 预设只管理其各自声明的文件。安装应用预设不会下载、安装或启动 Ghostty、Docker、Surge、Starship 等应用。

## 系统预设

系统预设通过 `shine sys bootstrap` 安装开发环境项目。交互模式可逐项选择；非交互模式使用该平台的默认 profile。先运行 `shine sys bootstrap --dry-run`，因为包管理器、网络下载或 profile 合并可能需要权限或改变本机环境。

<div className="built-in-presets-system-table" aria-hidden="true" />

| 平台 | Profile | 包含项目 |
| --- | --- | --- |
| macOS | `required` | Homebrew、Yazi、Starship。 |
| macOS | `recommended`（默认） | `required` 加 Rust、Neovim、AstroNvim、ZeroTier、Zsh 插件、zoxide、Atuin、fzf、bat、eza。 |
| macOS | `all` | `recommended` 加 nvm、Bun、pnpm、mise、Fastfetch。 |
| Ubuntu | `recommended`（默认） | Neovim、AstroNvim、Atuin、Yazi、Starship、zoxide、zsh-vi-mode、fzf、bat、eza。 |
| Ubuntu | `all` | `recommended` 加 ZeroTier、pnpm、mise、Homebrew。 |
| Ubuntu | `minimal` | Neovim、fzf、bat、eza、zoxide；适合不需要 shell 历史、prompt 与 JavaScript 工具链的服务器。 |
| Windows | `required` | Rust、Yazi、Starship。 |
| Windows | `recommended`（默认） | `required` 加 zoxide、Atuin、fzf、bat、eza、ZeroTier。 |
| Windows | `all` | `recommended` 加 Bun、pnpm、mise。 |

### Private split DNS

三个平台都内置独立的受管 `split-dns` 项目，不属于上述默认 profile。它把一个私有域名后缀定向到可经 ZeroTier 访问的 DNS 服务器；需要管理员权限和以下生效的 env 值：

```toml
PRIVATE_DNS_DOMAIN = "home.example.internal"
PRIVATE_DNS_SERVERS = "10.0.0.53"
```

先预览，再应用或移除：

```bash
shine sys info split-dns
shine sys apply split-dns --dry-run
shine sys apply split-dns
shine sys uninstall split-dns --dry-run
```

它不会安装 ZeroTier、CoreDNS 或创建 DNS 区域；应先确保私有网络和 DNS 服务可用。完整的跨平台网络与排错步骤见[使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络](/knowledge/zerotier-coredns-split-dns)。

系统初始化、受管项目和代理使用方式见[初始化与管理系统](../guides/system-init.md)。
