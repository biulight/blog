---
title: 在 macOS 和 Windows 使用 YubiKey OpenPGP
sidebar_position: 2
---

# 在 macOS 和 Windows 使用 YubiKey OpenPGP

本指南帮助你把一枚**已经写入 OpenPGP 私钥**的 YubiKey 接入新电脑，并验证 GPG 和
Shine 可以调用它。完成后，公钥保存在电脑上，私钥运算仍在 YubiKey 内完成。

本文不生成密钥、不把私钥迁移到设备，也不重置 OpenPGP 应用。如果还没有制作好
YubiKey，请先在隔离环境中规划主密钥、子密钥和离线备份。

## 前置条件

- 支持 OpenPGP 的 YubiKey，且设备中已有用于加密的子密钥。
- 与设备中私钥匹配的公钥文件，例如 `public-key.asc`。
- 知道设备的用户 PIN；启用触摸策略时，可在操作期间触摸设备。
- 已安装 Shine，且准备使用 GPG 封存或解密环境变量。

PIN 连续输错会消耗重试次数。不要尝试猜测 PIN，也不要执行 `ykman openpgp reset` 或
`gpg --card-edit` 中的 `factory-reset`：这些操作会删除 OpenPGP 数据。

## macOS 安装

通过 Homebrew 安装 GnuPG 和独立的 YubiKey Manager CLI：

```bash
brew install gnupg ykman
```

也可以分别使用 [GnuPG 官方列出的 macOS 安装包](https://gnupg.org/download/)和
[Yubico 官方 ykman 安装包](https://docs.yubico.com/software/yubikey/tools/ykman/Install_ykman.html)。

```bash
gpg --version
ykman --version
```

## Windows 安装

1. 从 [GnuPG 官方下载页](https://gnupg.org/download/)进入 Gpg4win 下载页并安装
   Gpg4win。安装包应来自官方来源，并显示有效的发布者签名。
2. 从 [Yubico 官方安装说明](https://docs.yubico.com/software/yubikey/tools/ykman/Install_ykman.html)
   下载并安装独立的 `ykman` CLI。文件名不应包含 `-qt`。
3. 打开新的 PowerShell，确认命令可用：

```powershell
gpg --version
ykman --version
```

OpenPGP 工作流不需要额外安装 Windows 智能卡 Minidriver；该驱动面向 PIV/Windows
智能卡功能，不是 GPG 访问 YubiKey OpenPGP 应用的前置条件。

## 检查设备和 OpenPGP 应用

插入一枚 YubiKey，然后运行：

```bash
ykman list
ykman openpgp info
gpg --card-status
```

Windows PowerShell 使用相同命令。`gpg --card-status` 应显示设备序列号、PIN 重试次数和
签名、加密、认证密钥槽的信息。先确认序列号和密钥指纹属于预期设备。

若 PIN 重试次数已经很低，停止操作，使用预先设置的 Reset Code 或 Admin PIN 按组织的
恢复流程解锁；不要继续试错。

## 导入公钥并建立卡片关联

私钥槽本身不能替代电脑上的 OpenPGP 公钥。导入与 YubiKey 匹配的公钥：

```bash
gpg --import public-key.asc
gpg --list-keys --keyid-format long
gpg --list-secret-keys --keyid-format long
```

最后一条命令显示 `sec#` 或 `ssb>` 并不表示私钥被复制到了电脑；它通常表示本地保存了
指向智能卡的 stub。核对公钥指纹与 `gpg --card-status` 显示的密钥一致。

如果公钥来自文件以外的渠道，必须通过可信渠道核对完整指纹后再使用。

## 验证加密和解密

先创建一个不含真实机密的测试文件。

macOS：

```bash
printf 'yubikey test\n' > yubikey-test.txt
gpg --output yubikey-test.txt.gpg --encrypt --recipient <完整指纹> yubikey-test.txt
gpg --output yubikey-test.out.txt --decrypt yubikey-test.txt.gpg
diff yubikey-test.txt yubikey-test.out.txt
```

Windows PowerShell：

```powershell
Set-Content -Path yubikey-test.txt -Value 'yubikey test' -NoNewline
gpg --output yubikey-test.txt.gpg --encrypt --recipient <完整指纹> yubikey-test.txt
gpg --output yubikey-test.out.txt --decrypt yubikey-test.txt.gpg
if ((Get-FileHash yubikey-test.txt).Hash -ne (Get-FileHash yubikey-test.out.txt).Hash) { throw '文件不一致' }
```

加密只使用公钥，因此可以在未连接 YubiKey 时完成。解密需要连接设备，并可能要求输入
PIN 和触摸 YubiKey。验证后删除这些测试文件。

## 在 Shine 中使用

把接收者的完整指纹写入 `~/.shine/config.toml`：

```toml
gpg_key_id = "<完整指纹>"
```

先用无关紧要的测试值验证全局环境加解密：

```bash
shine env set YUBIKEY_TEST "not-a-real-secret"
shine env secret encrypt --from YUBIKEY_TEST --set YUBIKEY_TEST_SECRET
shine env secret decrypt YUBIKEY_TEST_SECRET
shine env delete YUBIKEY_TEST
shine env delete YUBIKEY_TEST_SECRET
```

输出应为 `not-a-real-secret`。加密阶段不要求插入 YubiKey；解密阶段需要设备。

对于含 `shine.workspace.toml` 的项目，可继续验证封存和子进程注入：

```bash
shine env secret seal
shine env run --mode development -- <你的命令>
```

也可以不使用 workspace，只把已保存的值提供给单个命令：

```bash
shine env run --with MY_TOKEN -- <你的命令>
shine env run --with MY_TOKEN=API_TOKEN -- <你的命令>
```

## 故障排查

### `ykman` 或 GPG 找不到设备

- 一次只连接一枚 YubiKey，重新插拔后再次运行 `ykman list` 和 `gpg --card-status`。
- 检查设备是否支持 OpenPGP，以及 OpenPGP 应用是否被禁用。
- 关闭可能独占智能卡的程序后重试。

### GPG 仍引用旧卡或代理状态异常

先关闭 GPG 后台组件，再重新插入设备：

```bash
gpgconf --kill all
gpg --card-status
```

Windows PowerShell 使用相同命令。该操作重启 `gpg-agent` 和 `scdaemon`，不会删除密钥。

### 能看到卡片但无法解密

- 确认已导入正确公钥，并核对完整指纹和加密子密钥指纹。
- 用 `gpg --list-packets yubikey-test.txt.gpg` 检查密文接收者是否对应设备中的加密子密钥。
- 查看 `gpg --card-status` 的 PIN 重试次数；次数减少时立即停止猜测。
- 如果 `gpg --list-secret-keys` 没有智能卡 stub，保持设备连接并重新执行
  `gpg --card-status`，然后再次检查。

### Shine 报告找不到 recipient

确认 `gpg_key_id` 使用 `gpg --list-keys --with-colons` 可找到的完整指纹；也可以用
`shine env secret encrypt -r <完整指纹>` 临时覆盖配置。Shine 调用的是当前终端 PATH 中的
`gpg`，因此应先在同一个终端完成上述 GPG 测试。

YubiKey OpenPGP 的 PIN、触摸策略和管理命令以
[Yubico 官方 OpenPGP 命令参考](https://docs.yubico.com/software/yubikey/tools/ykman/OpenPGP_Commands.html)
为准。
