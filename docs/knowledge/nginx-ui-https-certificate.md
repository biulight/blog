---
title: 使用 acme.sh 为 Nginx UI 管理的站点配置 HTTPS
sidebar_position: 5
---

# 使用 acme.sh 为 Nginx UI 管理的站点配置 HTTPS

本指南使用 `acme.sh` 的 DNS-01 模式签发证书，把证书链和私钥安装到稳定的 Nginx 路径，
再由 Nginx UI 管理站点配置。完成后，证书能够自动续期，并在 `nginx -t` 通过后重载 Nginx。

本文适合公网 80 端口不可用、需要通配符证书，或希望把“签发证书”和“Nginx UI 管理站点”
分开排查的场景。如果 HTTP-01 链路简单且公网 80 端口可达，使用 Nginx UI 内置申请功能也
是有效选择。

## 前置条件

- 一台运行 Nginx 和 Nginx UI 的 Linux 主机；
- 域名已经解析到目标服务，且你能修改其权威 DNS；
- DNS 提供商支持 API，例如阿里云或 DNSPod；
- API 凭据只能修改所需 DNS 区域，避免使用账号级全权限密钥；
- 主机可以出站访问 ACME CA 和 DNS API；
- 已备份当前 Nginx 配置和证书目录。

本文使用以下占位值：

| 占位符 | 含义 |
| --- | --- |
| `app.example.com` | 申请证书的站点域名 |
| `/etc/nginx/ssl/app.example.com` | 稳定的生产证书目录 |
| `<DNS_API_KEY>` | DNS API AccessKey 或 ID |
| `<DNS_API_SECRET>` | DNS API Secret 或 Token |

不要把真实 API 密钥写入 shell 历史、Nginx 配置、Git 仓库或问题截图。

## 1. 先确认基础服务和域名

检查 Nginx UI、Nginx 配置以及 80/443 端口：

```bash
systemctl status nginx-ui --no-pager
journalctl -u nginx-ui -n 100 --no-pager
nginx -t
systemctl status nginx --no-pager
ss -lntp | rg ':(80|443)\b'
```

再确认站点解析和权威 DNS：

```bash
dig A app.example.com +short
dig AAAA app.example.com +short
dig NS example.com +short
```

AAAA 记录存在时，必须确认 IPv6 也能到达正确主机；否则 ACME 验证和浏览器访问可能出现
IPv4 成功、IPv6 失败的分裂现象。DNS-01 不要求站点开放 80 端口，但 DNS API 必须操作
`dig NS` 返回的权威 DNS 区域。

## 2. 理解 Nginx UI 直接申请证书的边界

Nginx UI 支持 ACME 证书申请和续期，但应注意：

- `HTTPChallengePort` 是 Nginx UI 后端的 HTTP-01 挑战监听端口，文档默认值为 `9180`；
- Let’s Encrypt 的 HTTP-01 验证仍只从公网 80 端口发起，请求必须被正确转发到挑战处理程序；
- DNS-01 使用系统 DNS，或 Nginx UI `RecursiveNameservers` 中配置的递归服务器；
- 自动发现只识别分离的证书和私钥文件，例如 `fullchain.pem` 与 `privkey.pem`；
- 合并了证书和私钥的单个 PEM 文件不会被自动发现。

因此，Nginx UI 中申请失败时，不要连续切换 CA、挑战方式和 DNS 凭据。先从日志确认失败发生
在服务启动、订单创建、域名验证、文件保存还是 Nginx 重载阶段。

## 3. 安装 acme.sh

先阅读安装脚本，再决定是否执行。官方安装命令会把程序放到 `~/.acme.sh/`，创建 shell
别名，并添加定时任务：

```bash
curl -fsSL https://get.acme.sh -o /tmp/get-acme.sh
less /tmp/get-acme.sh
sh /tmp/get-acme.sh email=<ACME_ACCOUNT_EMAIL>
```

重新打开 shell，或直接使用完整路径检查版本和帮助：

```bash
~/.acme.sh/acme.sh --version
~/.acme.sh/acme.sh --help
```

## 4. 配置 DNS API 并签发证书

以下示例以阿里云 DNS 为例。变量名和 `dns_ali` 必须与 `acme.sh` 的 DNS API 实现一致：

```bash
export Ali_Key='<DNS_API_KEY>'
export Ali_Secret='<DNS_API_SECRET>'

~/.acme.sh/acme.sh --issue \
  --server letsencrypt \
  --dns dns_ali \
  -d app.example.com
```

如果权威 DNS 实际由 DNSPod 管理，应改用 DNSPod 对应的 `dns_dp` 和官方文档列出的凭据
变量；不要把阿里云凭据用于 DNSPod 区域，反之亦然。不同提供商的密钥格式和权限模型不可
互换。

需要同时覆盖根域和通配符域名时：

```bash
~/.acme.sh/acme.sh --issue \
  --server letsencrypt \
  --dns dns_ali \
  -d example.com \
  -d '*.example.com'
```

`acme.sh` 当前默认签发 ECC 证书。后续安装和查询命令应保留 `--ecc`。不要频繁使用
`--force` 重试生产 CA；排障时先检查日志、API 权限和 TXT 传播，必要时使用 CA 的 staging
环境，避免触发签发频率限制。

当验证卡在 DNS 时，从多个递归服务器查询：

```bash
dig TXT _acme-challenge.app.example.com +short
dig @1.1.1.1 TXT _acme-challenge.app.example.com +short
dig @8.8.8.8 TXT _acme-challenge.app.example.com +short
```

DNS-01 适合自动续期的前提是使用 DNS API。手工添加 TXT 的模式需要每次续期重新操作，
不应当被当成无人值守方案。

## 5. 安装证书到稳定路径

不要让 Nginx 直接引用 `~/.acme.sh/` 中的内部文件。先创建目标目录，并限制私钥目录权限：

```bash
sudo install -d -m 700 /etc/nginx/ssl/app.example.com
```

使用 `--install-cert` 复制证书链和私钥，并配置安全的重载命令：

```bash
sudo ~/.acme.sh/acme.sh --install-cert \
  -d app.example.com \
  --ecc \
  --key-file /etc/nginx/ssl/app.example.com/privkey.pem \
  --fullchain-file /etc/nginx/ssl/app.example.com/fullchain.pem \
  --reloadcmd "nginx -t && systemctl reload nginx"
```

确认文件权限。私钥只应对需要读取它的特权进程开放：

```bash
sudo ls -l /etc/nginx/ssl/app.example.com
```

## 6. 在 Nginx UI 中配置站点

在 Nginx UI 中编辑目标站点，让 TLS 配置分别引用：

```nginx
ssl_certificate     /etc/nginx/ssl/app.example.com/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/app.example.com/privkey.pem;
```

保存前先使用 Nginx UI 的配置测试；也可以在服务器执行：

```bash
sudo nginx -t
```

只有测试通过后才重载：

```bash
sudo systemctl reload nginx
```

若希望使用 Nginx UI 的证书自动发现，确认它配置的 Nginx `ssl` 目录覆盖上述路径，并保留
证书链与私钥两个独立文件。自动发现不是启用 TLS 的必要条件；站点明确引用正确路径即可。

## 7. 验证证书、私钥和线上服务

查看证书主题、签发者和有效期：

```bash
sudo openssl x509 \
  -in /etc/nginx/ssl/app.example.com/fullchain.pem \
  -noout -subject -issuer -dates
```

比较证书与私钥的公钥摘要，两条输出必须相同：

```bash
sudo openssl x509 \
  -in /etc/nginx/ssl/app.example.com/fullchain.pem \
  -pubkey -noout | openssl sha256
sudo openssl pkey \
  -in /etc/nginx/ssl/app.example.com/privkey.pem \
  -pubout | openssl sha256
```

从客户端使用 SNI 检查线上实际返回的证书链：

```bash
openssl s_client \
  -connect app.example.com:443 \
  -servername app.example.com \
  -showcerts </dev/null
```

如果磁盘证书正确但线上仍展示旧证书，重点检查：

- 请求是否到达另一台代理、CDN 或 IPv6 主机；
- Nginx 站点是否引用了另一个证书路径；
- `nginx -t` 和 reload 是否真正成功；
- 443 端口是否由其他进程监听。

## 8. 验证自动续期

查看证书记录和下一次续期时间：

```bash
~/.acme.sh/acme.sh --info -d app.example.com --ecc
```

运行一次正常的 cron 检查；它不会无条件强制签发：

```bash
~/.acme.sh/acme.sh --cron --home ~/.acme.sh
```

再检查定时任务、证书时间和 Nginx 日志：

```bash
crontab -l
sudo openssl x509 \
  -in /etc/nginx/ssl/app.example.com/fullchain.pem \
  -noout -dates
sudo journalctl -u nginx -n 50 --no-pager
```

不要为了“测试续期”反复对生产 CA 使用 `--renew --force`。若确实需要端到端演练，应先备份
证书目录，并在 ACME staging 环境完成。

## 回滚

改动站点前，先备份当前配置和证书目录：

```bash
sudo cp -a /etc/nginx/nginx.conf /etc/nginx/nginx.conf.before-https
sudo cp -a /etc/nginx/ssl /etc/nginx/ssl.before-https
```

如果新配置导致 Nginx 测试失败，恢复原站点配置或原证书路径，然后执行：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

不要在未确认其他站点依赖关系时删除整个 `ssl` 目录，也不要用空文件覆盖私钥。

## 参考资料

- [Nginx UI Cert 配置](https://nginxui.com/guide/config-cert)
- [acme.sh 官方仓库与用法](https://github.com/acmesh-official/acme.sh)
- [Let’s Encrypt Challenge Types](https://letsencrypt.org/docs/challenge-types/)
- [本次 HTTPS 配置与 Nginx UI 踩坑复盘](/blog/nginx-ui-https-certificate)

