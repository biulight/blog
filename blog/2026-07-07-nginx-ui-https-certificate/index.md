---
title: 给 Nginx UI 配置 HTTPS：从界面申请失败到拆开证书签发链路
slug: /nginx-ui-https-certificate
authors: biulight
tags: [Nginx UI, HTTPS, ACME, Troubleshooting]
---

这次原本只想给一个已经由 Nginx UI 管理的站点加上 HTTPS，最后却依次排查了
Nginx UI 启动、ACME CA、域名验证、DNS API 权限、证书文件和 Nginx 重载。

<!--truncate-->

最有价值的结论不是某一条“万能命令”，而是要把问题拆成四段：管理界面能否工作、CA
能否创建订单、域名控制权能否验证、Nginx 最终是否加载了正确的证书。把这四件事混在
Nginx UI 的一个申请按钮里看，很容易在错误方向上反复尝试。

本文保留这次排查的时间线，但域名、凭据和服务器信息均已替换为占位符。可直接执行的
完整流程放在[使用 acme.sh 为 Nginx UI 管理的站点配置 HTTPS](/knowledge/nginx-ui-https-certificate)。

## 起点：先遇到的不是证书，而是 Nginx UI 启动

最初看到 Nginx UI 无法正常启动时，我先把它和证书问题联系到了一起。后来才意识到，
Nginx UI 进程、Nginx 进程和 ACME 签发是三条相互关联但可以独立验证的链路。

排查顺序应该先回到最基础的状态：

```bash
systemctl status nginx-ui --no-pager
journalctl -u nginx-ui -n 100 --no-pager
nginx -t
systemctl status nginx --no-pager
```

只有 Nginx UI 和 Nginx 本身都稳定后，证书申请日志才有解释价值。否则一次界面上的失败，
可能只是服务未启动、配置未加载或 Nginx 测试未通过，并不代表 CA 拒绝签发。

## 第一次弯路：在 Nginx UI 里直接配置证书

服务恢复后，我尝试直接通过 Nginx UI 申请和配置证书。这条路径本身是受支持的，但在这次
环境里，它同时引入了太多变量：

- 使用 Let’s Encrypt 还是 ZeroSSL；
- 选择 HTTP-01 还是 DNS-01；
- 域名的权威 DNS 到底由 DNSPod 还是阿里云管理；
- DNS API 凭据是否有权创建和删除 `_acme-challenge` TXT 记录；
- 系统递归 DNS 是否已经看到新记录；
- 证书与私钥是否以 Nginx UI 能识别的方式落盘。

这次对话中的日志先后指向不同环节。切换 CA 后错误表现会变化，但这并不能修复域名验证；
DNS 页面能登录也不代表 API 凭据有修改记录的权限；浏览器能打开域名，也不代表 ACME
验证节点能获得期望的 TXT 或 HTTP 响应。

### 容易误读的端口

Nginx UI 的 `HTTPChallengePort` 是其后端在 HTTP-01 流程中使用的监听端口，当前文档中的
默认值是 `9180`。但 Let’s Encrypt 的 HTTP-01 验证仍然只会从公网访问 80 端口。也就是说，
仅确认 `9180` 在本机监听并不能证明验证链路成立，公网 80 端口还必须把
`/.well-known/acme-challenge/` 请求正确交给挑战处理程序。

这也是直接配置时最容易出现的错觉：界面和后端都在运行，CA 却仍然无法验证域名。

### 容易误读的“证书已存在”

另一个坑是文件形态。Nginx UI 的自动发现会扫描配置的 Nginx `ssl` 目录，并识别分别保存的
证书链和私钥，例如 `fullchain.pem` 与 `privkey.pem`。把证书链和私钥拼成单个 PEM 文件，
并不属于它的自动发现范围。

因此，“服务器上已经有一个 PEM 文件”并不等于 Nginx UI 已经发现它，更不等于站点配置
已经引用它。

## 改变策略：把签发和部署拆开

继续在界面里同时调整 CA、挑战方式和 DNS 凭据只会让日志越来越难比较。我最后改用
`acme.sh` 单独完成 DNS-01 签发，再把稳定的证书文件交给 Nginx UI 和 Nginx 使用。

选择 DNS-01 的原因不是它天然优于 HTTP-01，而是这次环境中的公网 80 端口和转发链路并不
适合作为唯一验证入口。DNS-01 直接通过 `_acme-challenge.<DOMAIN>` TXT 记录证明域名控制权，
也支持通配符证书。

在执行前，先确认权威 DNS，而不是根据域名注册商或曾经使用过的控制台猜测：

```bash
dig NS example.com +short
dig TXT _acme-challenge.app.example.com +short
```

然后只为实际的权威 DNS 提供商创建最小权限凭据。本次最终可工作的链路是：

1. `acme.sh` 向选定的 ACME CA 创建订单；
2. DNS API 临时创建 `_acme-challenge` TXT 记录；
3. CA 查询权威 DNS 并完成验证；
4. `acme.sh --install-cert` 把证书链和私钥复制到 Nginx 的稳定目录；
5. `nginx -t` 通过后重载 Nginx。

CA 从 ZeroSSL 切换到 Let’s Encrypt 时，我明确写出了 `--server letsencrypt`。这一步只是
选择 CA，不应被当成修复 DNS 权限或网络问题的方法。

## 为什么没有直接引用 acme.sh 的内部文件

`acme.sh` 会在 `~/.acme.sh/` 下保存自己的状态和证书材料，但其官方说明明确不建议服务器
直接引用这些内部文件。正确做法是使用 `--install-cert` 复制到生产路径，并配置重载命令：

```bash
~/.acme.sh/acme.sh --install-cert -d app.example.com --ecc \
  --key-file /etc/nginx/ssl/app.example.com/privkey.pem \
  --fullchain-file /etc/nginx/ssl/app.example.com/fullchain.pem \
  --reloadcmd "nginx -t && systemctl reload nginx"
```

这样续期后会再次更新稳定路径，并在配置检查通过后重载 Nginx。若只复制一次文件，证书虽然
会续期，线上服务却可能一直展示旧证书。

## 最后如何确认真的成功

浏览器出现锁形图标只是最后一个信号。我把验证拆成了四层：

```bash
dig A app.example.com +short
ss -lntp | rg ':(80|443)\b'
nginx -t
openssl s_client -connect app.example.com:443 \
  -servername app.example.com -showcerts </dev/null
```

还要核对证书和私钥是否匹配。下面的公钥摘要应相同：

```bash
openssl x509 -in /etc/nginx/ssl/app.example.com/fullchain.pem \
  -pubkey -noout | openssl sha256
openssl pkey -in /etc/nginx/ssl/app.example.com/privkey.pem \
  -pubout | openssl sha256
```

最后执行一次不强制续期的定时任务检查，并查看下一次续期时间：

```bash
~/.acme.sh/acme.sh --cron --home ~/.acme.sh
~/.acme.sh/acme.sh --info -d app.example.com --ecc
```

## 这次踩坑留下的判断顺序

以后再遇到同类问题，我会按这个顺序处理：

1. 先确认 Nginx UI 与 Nginx 服务健康，避免把启动问题当成证书问题。
2. 查权威 DNS，再选择 DNS API，不能根据注册商或控制台印象猜。
3. 一次只改变一个变量；切换 CA 不会修复挑战验证。
4. 区分“签发成功”“文件已部署”和“Nginx 已加载”三个状态。
5. 使用稳定部署路径和可靠的 `reloadcmd`，把自动续期真正闭环。

完整的无敏感信息操作清单和回滚方法见：

- [使用 acme.sh 为 Nginx UI 管理的站点配置 HTTPS](/knowledge/nginx-ui-https-certificate)

