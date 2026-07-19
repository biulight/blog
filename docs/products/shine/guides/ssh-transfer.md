---
title: SSH 会话文件传输
sidebar_position: 6
---

# SSH 会话文件传输

`shine ssh` 会打开一个普通 SSH 会话，并为这次会话附带本机与远端之间的文件传输通道。适合临时把构建产物、日志或配置目录在两端移动，不需要另外开 `scp` 命令。

## 开启会话

```bash
shine ssh user@example.com
shine ssh -p 2222 user@example.com
shine ssh user@example.com uname -a
```

`shine ssh` 会把你提供的 SSH 参数传给系统 `ssh`。进入远端 shell 后，Shine 会设置本次会话需要的环境变量；传输命令必须在这个远端 shell 中运行。

远端主机需要能运行同版本兼容的 `shine local`。当前实现假定远端是 Unix/macOS/Linux shell；Windows 可作为本机端发起 `shine ssh`。

## 转发选定的环境变量

只在本次远端会话或命令中提供本机 Shine 环境值时，把选项写在 SSH 目标之前：

```bash
shine ssh --with API_URL dev
shine ssh --with LOCAL_NAME=REMOTE_NAME dev 'printenv REMOTE_NAME'
shine ssh --with-secret API_TOKEN dev
```

`--with` 只读取完全同名的明文 `[env]` 键，不会自动解密 `KEY_SECRET`；需要解密时必须显式使用 `--with-secret KEY[=ALIAS]`。值只写入远端进程环境，不写远端配置文件，但远端 shell 启动文件仍可能再次覆盖同名变量。

转发密钥意味着远端主机可以读取明文；本机或远端具有足够权限、或同一用户的其它进程也可能从进程参数或环境中看到它。只向可信主机转发必要的键，不要把令牌直接写在命令行中。

## 从远端下载到本机

在 `shine ssh` 打开的远端 shell 中运行：

```bash
shine local download ./logs/app.log
shine local download ./logs/app.log ./downloaded/app.log --dry-run
shine local download ./logs/app.log ./downloaded/app.log --force
shine local download ./dist ./dist-copy
```

`download` 的来源路径由远端解析，目标路径由本机解析。未指定目标时，Shine 会把文件或目录放到本机启动 `shine ssh` 时所在目录，并沿用来源名称。

Shine 会在本机端重新发起系统 `rsync` 或 `scp` 传输；优先使用 `rsync`，不可用时回退到 `scp`。两端都需要可用的 `ssh`，目录传输还需要两端具有同一种可用工具（优先 `rsync`，否则 `scp`）。目标文件已存在时默认拒绝覆盖；目录已存在时加 `--force` 表示合并写入。

## 从本机上传到远端

仍然在远端 shell 中运行：

```bash
shine local upload ./release.tar.gz /tmp/release.tar.gz --dry-run
shine local upload ./release.tar.gz /tmp/release.tar.gz --force
shine local upload ./site /tmp/site
```

`upload` 的来源路径由本机解析，目标路径由远端解析。未指定目标时，Shine 会把文件或目录放到远端当前目录，并沿用来源名称。

上传目录时，Shine 会拒绝把文件覆盖成目录或把目录覆盖成文件。先运行 `--dry-run` 可以确认解析后的两端路径和覆盖结果。

## 查看连接状态

```bash
shine local status
```

状态输出会显示会话 ID、连接是否可达、协议版本，以及本机端的默认目录。若当前 shell 不是通过 `shine ssh` 进入的，`shine local` 会提示缺少会话环境变量。
