---
title: 故障排查
sidebar_position: 6
---

# 故障排查

先运行 `shine --version` 记录版本，再使用 `shine list`、`shine info <TARGET>` 或对应命令的 `--dry-run` 收集状态。

## 安装后找不到命令

Shell 预设的命令入口位于 `~/.shine/bin/`。安装完成后需要打开新终端，或重新加载 shell profile：

```bash
source ~/.zshrc
# 或 source ~/.bashrc
```

然后检查：

```bash
shine list
shine info proxy
```

如果源脚本存在但命令入口缺失，`shine list` 不会把它显示为可用。可使用 `shine shell install <CATEGORY> --replace-managed` 重建受管文件和入口。

## 应用配置显示为用户修改

Shine 默认保留安装后被修改过的文件。先查看差异：

```bash
shine info app/starship --diff
```

需要采用预设版本时运行 `shine app install starship --replace-managed`。卸载时，只有明确要删除这些本地修改才使用 `shine app uninstall starship --force`；先运行相同命令并加上 `--dry-run`。

## 使用的不是预期预设

外部目录、项目配置和环境变量可能改变当前来源。检查命令输出显示的 active source，并按[配置参考](./reference/configuration.md)核对优先级。

临时排除配置干扰时，可使用独立目录：

```bash
SHINE_CONFIG_DIR=/tmp/shine-check shine app list
```

该目录会被 Shine 用于配置和运行时状态，不会读取原来的 `~/.shine/`。

## 修改 env 后配置没有变化

`shine env set` 更新变量，但已安装模板不会自动重写。运行：

```bash
shine update --verbose
shine upgrade --verbose
```

如果使用项目 `shine.config.toml`、项目 `shine.env.toml` 或 overlay，请确认当前工作目录和覆盖优先级。

如果问题表现为私有域名或 `192.168.x.x` 地址仍然被终端代理接管，可继续参考知识库中的
[终端代理误拦截 ZeroTier 私有域名的排查与修复](../../knowledge/terminal-proxy-no-proxy-zerotier.md)。

## 升级到 0.40 后提示旧配置文件

项目中的 `config.toml` 和 `.env.toml` 已不再作为 Shine 配置读取，请分别改名为 `shine.config.toml` 和 `shine.env.toml`。

若提示检测到全局 `~/.shine/env.toml`，不要直接删除仍在使用的值。将它移动为 `~/.shine/shine.env.toml`；若新文件已经存在，先手动合并并检查重复键。也可以在升级前先用 v0.39 运行一次配置加载，让旧版本完成自动迁移。

## 生成式 App 文件刷新失败

先确认类别已经安装、选择器使用 `[[files]].source` 的相对路径，并满足 generator 的 env 前提：

```bash
shine app info surge
shine env list
shine app refresh surge subscription-proxies.conf
```

内置 Surge generator 要求 `SURGE_SUBSCRIPTION_URL` 使用 HTTPS，运行时还需要 Bun。失败不会删除上次成功生成的文件。若提示目标被用户修改，先检查差异；只有确定要以新生成内容覆盖时才使用 `--force`。日常 `shine update` 和 `shine upgrade` 不会访问这个手动订阅 generator。

## `shine preset pull` 拒绝更新来源

`shine preset pull` 只对干净、已设置 upstream 的普通分支执行快进更新。先进入错误信息显示的仓库并检查：

```bash
git status
git branch --show-current
git branch -vv
git pull --ff-only
```

请自行提交、stash 或处理本地改动和分支分歧，再重新运行 `shine preset pull`。Shine 不会自动丢弃改动或解决冲突。若提示找不到 Git，请先安装 Git 并确认 `git` 在 `PATH` 中；非 Git 预设目录被跳过属于正常行为。

## 系统初始化前想确认影响

```bash
shine sys info <ITEM>
shine sys bootstrap --dry-run
shine sys uninstall <ITEM> --dry-run
```

不要依赖计划文档推断可用项目；以当前版本 `shine sys list` 和 `shine sys info` 为准。

Windows 或其它工具改写过的 PowerShell、bash 或 zsh profile 可能使用 CRLF 换行。系统 profile 合并会按内容匹配受管区块，不会仅因 CRLF/LF 差异反复重写文件。若旧版本已留下冲突标记，先手工处理冲突，再重新运行 `shine sys bootstrap --dry-run` 或对应 `upgrade`。

## 本地 HTTP 服务无法访问资源

先确认服务和 URL：

```bash
shine serve status
shine serve url app/surge/custom-rules.sgmodule
```

`shine serve install` 当前只支持 macOS 用户服务；其它环境可用 `shine serve start` 在前台运行。服务只发布 `~/.shine/http/` 下的文件，资源不存在时应先运行对应的 `shine app artifact apply <APP_ID>`。

请不要把敏感文件放入 `~/.shine/http/`。服务绑定在 `127.0.0.1`，但没有额外认证。

## 任务运行结果和手动执行不同

`shine task` 不经过 shell，而是直接按保存的参数数组启动程序。包含管道、重定向、变量展开或通配符的命令需要显式保存 shell：

```bash
shine task save kill-port -- sh -c 'lsof -ti :3000 | xargs kill'
```

额外参数会追加到已保存命令末尾：

```bash
shine task run my-task -- --verbose
```

## SSH 文件传输不可用

`shine local` 只能在 `shine ssh` 打开的远端 shell 中使用。若提示缺少 `SHINE_SSH_SESSION`、`SHINE_SSH_TOKEN` 或 `SHINE_SSH_REMOTE_SOCK`，请退出后重新用 `shine ssh <HOST>` 进入。

远端也需要能运行兼容的 `shine local`。先检查：

```bash
shine local status
which shine
shine --version
```

传输前优先预览路径和覆盖行为：

```bash
shine local download ./remote.log ./remote.log --dry-run
shine local upload ./local.log /tmp/local.log --dry-run
```

目标文件已存在时默认拒绝覆盖；确认无误后加 `--force`。目录目标已存在时，`--force` 表示合并写入。

## 自动更新检查失败

网络或 GitHub API 不可用时，Shine 会跳过版本检查并继续执行原命令。恢复网络后可绕过 24 小时缓存重新检查：

```bash
shine update --refresh-release
```
