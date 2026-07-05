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

如果源脚本存在但命令入口缺失，`shine list` 不会把它显示为可用。可使用 `shine shell reinstall <CATEGORY>` 重建受管文件和入口。

## 应用配置显示为用户修改

Shine 默认保留安装后被修改过的文件。先查看差异：

```bash
shine info app/starship --diff
```

需要采用预设版本时运行 `shine app reinstall starship`。卸载时，只有明确要删除这些本地修改才使用 `shine app uninstall starship --force`；先运行相同命令并加上 `--dry-run`。

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

## `shine pull` 拒绝更新来源

`shine pull` 只对干净、已设置 upstream 的普通分支执行快进更新。先进入错误信息显示的仓库并检查：

```bash
git status
git branch --show-current
git branch -vv
git pull --ff-only
```

请自行提交、stash 或处理本地改动和分支分歧，再重新运行 `shine pull`。Shine 不会自动丢弃改动或解决冲突。若提示找不到 Git，请先安装 Git 并确认 `git` 在 `PATH` 中；非 Git 预设目录被跳过属于正常行为。

## 系统初始化前想确认影响

```bash
shine sys info <ITEM>
shine sys init --dry-run
shine sys uninstall <ITEM> --dry-run
```

不要依赖计划文档推断可用项目；以当前版本 `shine sys list` 和 `shine sys info` 为准。

## 自动更新检查失败

网络或 GitHub API 不可用时，Shine 会跳过版本检查并继续执行原命令。恢复网络后可绕过 24 小时缓存重新检查：

```bash
shine update --refresh
```
