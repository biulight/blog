---
title: 知识库
slug: /knowledge
sidebar_position: 1
---

# 知识库

这里整理跨产品也适用的实践指南，适合查找网络、证书、终端环境和安全配置等问题的处理方法。

<!--
维护提示：知识库不复制产品内部架构文档，也不充当开发任务记录。
内容只有在满足以下条件时才进入这里：

- 不依赖某个产品的具体界面或命令也仍然成立；
- 能帮助读者完成真实任务、理解关键概念或定位常见问题；
- 经过实际项目或权威资料验证，而不是来自待实现计划。
-->

如果问题只和某个 Biulight 产品有关，可以从[产品手册](/products)开始查找。

## 指南

- [使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络](./zerotier-coredns-split-dns.md)
- [终端代理误拦截 ZeroTier 私有域名的排查与修复](./terminal-proxy-no-proxy-zerotier.md)
- [在 macOS 和 Windows 使用 YubiKey OpenPGP](./yubikey-openpgp.md)
- [使用 acme.sh 为 Nginx UI 管理的站点配置 HTTPS](./nginx-ui-https-certificate.md)
- [使用 step-ca 为内网域名签发和自动续期证书](./step-ca-internal-certificate.md)
- [在 WSL 中让 GitHub Actions self-hosted runner 随 Windows 登录启动](./wsl-github-actions-runner-autostart.md)
- [通过 CLIProxyAPI 让 Claude Code 使用 GPT](./claude-code-cliproxyapi-codex-login.md)
