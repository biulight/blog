---
title: 在 WSL 中让 GitHub Actions self-hosted runner 随 Windows 登录启动
sidebar_position: 6
---

# 在 WSL 中让 GitHub Actions self-hosted runner 随 Windows 登录启动

本指南让已经注册到 GitHub 的 Linux self-hosted runner 在 Windows 登录后自动恢复运行。完成后，Windows 计划任务负责唤醒 WSL；WSL 中的 systemd 再启动 runner 服务。

适用于 WSL 2、支持 systemd 的 Linux 发行版，以及已完成 `config.sh` 注册、并在 runner 安装目录中包含 `svc.sh` 的 GitHub Actions runner。

## 启动关系

```text
Windows 登录
    ↓
任务计划程序启动 WSL 发行版
    ↓
systemd（PID 1）
    ↓
actions.runner.*.service
    ↓
GitHub Actions self-hosted runner
```

`svc.sh` 只能在 WSL 已启动后管理 runner；它不能自行唤醒 WSL。因此，Windows 计划任务与 runner 服务缺一不可。

## 前置条件

- Windows 上的目标发行版必须是 WSL 2；可用 `wsl -l -v` 查看。
- 发行版需要启用 systemd。旧版 WSL 需要 `0.67.6` 或更高版本；先运行 `wsl --version`，必要时运行 `wsl --update`。
- runner 已通过 `config.sh` 添加到 GitHub，且当前目录有 `svc.sh`。
- Windows 登录账户有创建计划任务的权限。本文使用“登录时”触发器；若改用“开机时”，须自行确认任务使用的 Windows 账户与 WSL 用户映射符合预期。

> 修改 `/etc/wsl.conf` 后必须重启所有 WSL 实例；`wsl --shutdown` 会立即停止其中正在运行的服务与任务。

## 1. 启用并验证 systemd

在 WSL 发行版中检查 `/etc/wsl.conf`：

```ini
[boot]
systemd=true
```

若文件中没有这一段，使用具有管理员权限的编辑器补充后，在 Windows PowerShell 中执行：

```powershell
wsl --shutdown
wsl -d <DISTRO> -- systemctl is-system-running
```

将 `<DISTRO>` 替换为 `wsl -l -v` 显示的发行版名称，例如 `Ubuntu-24.04`。`running` 或 `degraded` 都表示 systemd 已成为 PID 1；后者还应继续查看失败的单元：

```powershell
wsl -d <DISTRO> -- systemctl --failed
```

## 2. 将 runner 安装为 systemd 服务

先进入 runner 的安装目录。以下路径只是示例：

```bash
cd ~/services/<OWNER>-actions-runners/<RUNNER_NAME>
ls -l ./svc.sh
```

如果当前正在前台执行 `./run.sh`，先按 `Ctrl+C` 停止它，再安装服务：

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

`install` 会创建并启用相应的 `actions.runner.*.service`。如需明确指定运行该服务的 Linux 用户，可使用 GitHub runner 提供的可选参数：

```bash
sudo ./svc.sh install <LINUX_USER>
```

不要同时保留前台 `./run.sh` 与 systemd 服务，否则同一个 runner 可能发生重复连接或状态混乱。

Ubuntu/Debian 如果启用了 `needrestart`，建议按 GitHub 的说明排除 runner 服务，避免软件更新期间中断正在运行的工作流：

```bash
echo '$nrconf{override_rc}{qr(^actions\.runner\..+\.service$)} = 0;' \
  | sudo tee /etc/needrestart/conf.d/actions_runner_services.conf
```

## 3. 创建 Windows 登录任务

在 Windows 中打开“任务计划程序”，选择“创建任务”（不要选择“创建基本任务”），使用下列设置：

| 项目 | 建议值 |
| --- | --- |
| 名称 | `Start WSL <DISTRO>` |
| 触发器 | 登录时 |
| 程序或脚本 | `C:\Windows\System32\wsl.exe` |
| 添加参数 | `-d <DISTRO> --exec /bin/true` |
| 条件 | 笔记本电脑建议取消“仅在使用交流电源时启动” |
| 设置 | 可选：失败后每分钟重试一次，最多 3 次 |

`/bin/true` 的作用是启动指定发行版并让 systemd 接管后续服务；它本身不会让 WSL 常驻。runner 是长期运行的 systemd 服务时，无需为此额外启动 `sleep infinity`。若你的发行版没有任何需要常驻的服务，才考虑把参数改为 `-d <DISTRO> --exec sleep infinity`。

也可以在 Windows PowerShell 中创建等价的登录任务。该命令会覆盖同名任务，因此请先确认名称没有被其他工作流使用：

```powershell
schtasks /create /f `
  /tn "Start WSL <DISTRO>" `
  /sc onlogon `
  /tr "C:\Windows\System32\wsl.exe -d <DISTRO> --exec /bin/true"
```

## 4. 验证整条启动链路

先手动运行计划任务：

```powershell
schtasks /run /tn "Start WSL <DISTRO>"
wsl -l -v
```

目标发行版应显示为 `Running`。然后检查 runner 服务：

```powershell
wsl -d <DISTRO> -- bash -lc 'cd ~/services/<OWNER>-actions-runners/<RUNNER_NAME> && sudo ./svc.sh status'
```

成功信号包括：

- `svc.sh status` 显示 runner 正在运行；
- `systemctl` 中存在并启用了 `actions.runner.*.service`；
- GitHub 仓库或组织的 **Settings → Actions → Runners** 中，runner 状态为 `Idle`，而非 `Offline`。

最后重启 Windows 或退出再登录一次，确认该状态能自动恢复。

## 日常管理与排查

在 runner 目录中可使用：

```bash
sudo ./svc.sh status
sudo ./svc.sh stop
sudo ./svc.sh start
sudo ./svc.sh uninstall
```

`uninstall` 仅卸载本机 systemd 服务；不要把它当作从 GitHub 删除 runner 注册的操作。

如果登录后 runner 仍是 `Offline`，按以下顺序检查：

1. 在 Windows 中运行 `schtasks /query /tn "Start WSL <DISTRO>" /v /fo list`，确认任务存在且最近运行结果正常。
2. 运行 `wsl -l -v`，确认指定发行版确实启动。
3. 在 WSL 中运行 `systemctl --failed`，再运行 `sudo ./svc.sh status`。
4. 先通过 `systemctl list-units --type=service 'actions.runner*'` 找到实际单元名称，再查看日志：`journalctl -u <UNIT> -b --no-pager`。
5. 确认 runner 目录归属、服务运行用户和安装 runner 时使用的 Linux 用户一致。

### 服务已是 `active`，GitHub 仍显示 `Offline`

这通常不是 runner 未启动。一次实际排查中，`actions.runner.*.service` 与 `Runner.Listener` 都在运行，但日志中的 `Location.GetConnectionData` 请求持续超时；在交互式 shell 执行 `setproxy http` 后运行 `./run.sh` 又能立刻上线。

根因是交互式 shell 的代理函数只修改当前 shell 环境。systemd 不会读取 `~/.bashrc`、`~/.zshrc`，也不会继承已经退出的 shell 的 `HTTP_PROXY` / `HTTPS_PROXY`。因此，服务必须通过 systemd 配置显式获得代理变量。

先找出实际单元名并查看服务环境：

```bash
systemctl list-units --type=service --all 'actions.runner*'
sudo systemctl show <UNIT> -p Environment
sudo journalctl -u <UNIT> -b --no-pager
```

如果日志显示连接 Actions 端点超时，而服务环境中没有代理变量，请为该单元创建 drop-in。将 `<PROXY_URL>` 替换为 **WSL 中可访问** 的代理地址；只有代理在 WSL 内本机监听时，才使用 `http://127.0.0.1:<PORT>`。

```bash
sudo install -d -m 0755 /etc/systemd/system/<UNIT>.d
sudo tee /etc/systemd/system/<UNIT>.d/proxy.conf >/dev/null <<'EOF'
[Service]
Environment="HTTP_PROXY=<PROXY_URL>"
Environment="HTTPS_PROXY=<PROXY_URL>"
Environment="http_proxy=<PROXY_URL>"
Environment="https_proxy=<PROXY_URL>"
Environment="NO_PROXY=localhost,127.0.0.1,::1,.local"
Environment="no_proxy=localhost,127.0.0.1,::1,.local"
EOF

sudo systemctl daemon-reload
sudo systemctl restart <UNIT>
```

随后再次执行：

```bash
sudo systemctl is-active <UNIT>
sudo systemctl show <UNIT> -p Environment
```

服务应为 `active`，且环境中包含代理变量；GitHub 中的 runner 通常会在数秒内变为 `Idle`。不要将某次解析到的 Actions IP 写死到防火墙或文档中，优先允许 GitHub 官方公布的 Actions 域名和网络范围。

## 相关内容

- [Microsoft Learn：在 WSL 中使用 systemd](https://learn.microsoft.com/windows/wsl/systemd)
- [Microsoft Learn：WSL 基本命令](https://learn.microsoft.com/windows/wsl/basic-commands)
- [GitHub Docs：将 self-hosted runner 配置为服务](https://docs.github.com/actions/how-tos/manage-runners/self-hosted-runners/configure-the-application?platform=linux)
- [GitHub Docs：self-hosted runner 的网络通信要求](https://docs.github.com/actions/reference/runners/self-hosted-runners#communication)
- [Microsoft Learn：schtasks 命令](https://learn.microsoft.com/windows-server/administration/windows-commands/schtasks)
