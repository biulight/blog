---
title: 使用 step-ca 为内网域名签发和自动续期证书
sidebar_position: 5
---

# 使用 step-ca 为内网域名签发和自动续期证书

本指南在 ZeroTier 私网中部署 `step-ca`，通过 ACME 为 `biulight.internal` 域名签发证书，
再由 Certbot 自动续期并安全重载 Nginx。完成后，受信任的客户端可以使用
`https://nginx-ui.biulight.internal` 访问 Nginx UI，不需要把私有服务暴露到公网。

完整链路如下：

```text
CoreDNS → step-ca → ACME → Certbot → Nginx → 自动续期与重载
```

`.internal` 不能依赖公网 CA 签发证书。本文的根 CA 只适合受控内网；根证书一旦安装到
客户端，持有对应 CA 私钥的人就能为该客户端信任的任意名称签发证书。因此必须限制 CA
访问范围，妥善保存密码并备份 CA 数据。

## 前置条件和示例值

- 一台已加入 ZeroTier 网络的 Ubuntu 主机；
- 已安装 Docker、Docker Compose、Nginx 和 Certbot；
- CoreDNS 能解析私有域名并把公网查询转发给上游 DNS；
- 可以管理服务端防火墙和客户端信任存储。

先用自己的值替换以下占位符：

| 占位符 | 含义 | 示例 |
| --- | --- | --- |
| `<ZEROTIER_CIDR>` | 允许访问服务的 ZeroTier 网段 | `10.147.0.0/16` |
| `<CA_ZEROTIER_IP>` | 运行 CoreDNS、step-ca 和 Nginx 的私网地址 | `10.147.0.10` |
| `<CA_DOMAIN>` | step-ca 服务域名 | `ca.biulight.internal` |
| `<SERVICE_DOMAIN>` | 需要证书的 Nginx UI 域名 | `nginx-ui.biulight.internal` |
| `<ROOT_FINGERPRINT>` | 根证书 SHA-256 指纹 | 从 CA 主机读取 |

本文让 step-ca 仅绑定 `<CA_ZEROTIER_IP>:9443`。容器内部仍监听 `9000`，不会与宿主机上
常用 `9000` 端口的 Nginx UI 或其他服务冲突。防火墙还应只允许 `<ZEROTIER_CIDR>` 访问
TCP `9443`、`80` 和 `443`。

## 配置私有域名解析

在 CoreDNS 的 `hosts` 块中加入 CA 和服务域名：

```coredns
hosts {
    <CA_ZEROTIER_IP> <CA_DOMAIN>
    <CA_ZEROTIER_IP> <SERVICE_DOMAIN>

    ttl 60
    fallthrough
}
```

保存后等待 `reload` 插件自动加载，或重启 CoreDNS，再直接查询它：

```bash
dig @<CA_ZEROTIER_IP> <CA_DOMAIN> +short
dig @<CA_ZEROTIER_IP> <SERVICE_DOMAIN> +short
```

两条命令都应返回 `<CA_ZEROTIER_IP>`。Ubuntu 主机还必须实际使用这个 CoreDNS；仅用
`dig @...` 查询成功，并不代表 `curl`、Certbot 或 Docker 容器能够解析私有域名。

使用 `systemd-resolved` 时，可以创建 `/etc/systemd/resolved.conf.d/internal-dns.conf`：

```ini
[Resolve]
DNS=<CA_ZEROTIER_IP>
Domains=~biulight.internal
```

然后应用并验证：

```bash
sudo systemctl restart systemd-resolved
sudo resolvectl flush-caches
resolvectl query <CA_DOMAIN>
```

如果选择关闭 `DNSStubListener`，还要确认 `/etc/resolv.conf` 没有继续指向
`127.0.0.53`。DNS 的更多部署方式参见
[使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络](./zerotier-coredns-split-dns.md)。

## 部署 step-ca

在服务端创建目录和 CA 密码：

```bash
sudo mkdir -p /opt/step-ca/secrets
cd /opt/step-ca
openssl rand -base64 48 | sudo tee secrets/ca-password >/dev/null
sudo chmod 700 secrets
sudo chmod 644 secrets/ca-password
```

密码文件需要能被 Compose 挂载后的容器用户读取。本配置让目录只有 root 可以进入，但文件
在容器内可读。不要把密码提交到 Git；如果运行环境支持设置正确 UID/GID 的只读挂载，也可
使用更严格的文件权限。

创建 `compose.yaml`：

```yaml
services:
  step-ca:
    image: smallstep/step-ca:latest
    container_name: step-ca
    restart: unless-stopped

    environment:
      DOCKER_STEPCA_INIT_NAME: "Biulight Internal CA"
      DOCKER_STEPCA_INIT_DNS_NAMES: >-
        <CA_DOMAIN>,
        <CA_ZEROTIER_IP>,
        localhost
      DOCKER_STEPCA_INIT_PROVISIONER_NAME: "admin"
      DOCKER_STEPCA_INIT_PASSWORD_FILE: "/run/secrets/ca_password"
      DOCKER_STEPCA_INIT_ACME: "true"
      DOCKER_STEPCA_INIT_REMOTE_MANAGEMENT: "true"

    ports:
      - "<CA_ZEROTIER_IP>:9443:9000"

    dns:
      - <CA_ZEROTIER_IP>

    volumes:
      - step_ca_data:/home/step

    secrets:
      - ca_password

    healthcheck:
      test:
        [
          "CMD",
          "step",
          "ca",
          "health",
          "--ca-url",
          "https://localhost:9000",
          "--root",
          "/home/step/certs/root_ca.crt"
        ]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 30s

secrets:
  ca_password:
    file: ./secrets/ca-password

volumes:
  step_ca_data:
```

`dns` 配置十分关键：ACME 的 HTTP-01 校验由 step-ca 发起，因此 CA 容器自己也必须能够
解析并访问 `<SERVICE_DOMAIN>`。

启动并检查服务：

```bash
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail=100 step-ca
```

初始化环境变量只在数据卷为空时生效。CA 建立后不要使用
`docker compose down -v`，也不要为了修改初始化参数删除数据卷，否则客户端已经信任的根
CA 会失效。

从容器导出根证书并验证服务：

```bash
sudo docker compose cp step-ca:/home/step/certs/root_ca.crt ./root_ca.crt

curl --noproxy '*' \
  --cacert ./root_ca.crt \
  https://<CA_DOMAIN>:9443/health

curl --noproxy '*' \
  --cacert ./root_ca.crt \
  https://<CA_DOMAIN>:9443/acme/acme/directory
```

第一个请求应返回 `{"status":"ok"}`；第二个请求应包含 `newNonce`、`newAccount` 和
`newOrder`。

读取根证书指纹：

```bash
sudo docker compose exec step-ca \
  step certificate fingerprint /home/step/certs/root_ca.crt
```

通过独立的可信渠道保存并核对该指纹，不要仅从待引导的 CA 连接中获取它。

## 让 Ubuntu 信任根 CA

将根证书安装到 Ubuntu 系统信任存储：

```bash
sudo docker compose cp \
  step-ca:/home/step/certs/root_ca.crt \
  /usr/local/share/ca-certificates/biulight-internal-ca.crt
sudo update-ca-certificates
```

随后不再指定 `--cacert` 也应成功：

```bash
curl --noproxy '*' https://<CA_DOMAIN>:9443/health
```

## 配置 Nginx UI 和 HTTP-01 校验

证书由 Certbot 管理，Nginx 直接引用 Certbot 的稳定路径。不要把证书再复制或手工导入
Nginx UI，否则续期后的文件可能与界面中保存的副本不同步。

本次迁移中曾把 Nginx UI 临时改为监听 `0.0.0.0:9000`，目的是在站点反向代理尚未恢复时，
能够直接访问 Nginx UI 继续修改配置：

```ini
[server]
Host = 0.0.0.0
Port = 9000
```

修改后重启 Nginx UI，并用防火墙把 `9000` 限制在可信管理地址，不能直接开放到公网。
若使用 systemd 环境变量，对应配置为 `NGINX_UI_SERVER_HOST=0.0.0.0`。

这只是临时恢复入口，不是最终方案。此前删除站点中的
`proxy_pass http://127.0.0.1:9000` 后，`nginx-ui.biulight.internal` 已没有后端可转发，因而
无法访问。完成证书和站点调整时必须补回下文的 `location /` 反向代理。确认域名访问正常后，
如果 Nginx 与 Nginx UI 位于同一主机，应把 Nginx UI 恢复为仅监听 `127.0.0.1:9000`；
只有反向代理位于另一容器或主机时，才长期保留 `0.0.0.0` 并依靠防火墙限制来源。

先创建 ACME 挑战目录：

```bash
sudo mkdir -p /var/www/acme/.well-known/acme-challenge
```

在签发证书前配置 HTTP 站点：

```nginx
server {
    listen <CA_ZEROTIER_IP>:80;
    server_name <SERVICE_DOMAIN>;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/acme;
        allow all;
    }

    location / {
        allow <ZEROTIER_CIDR>;
        deny all;
        return 301 https://$host$request_uri;
    }
}
```

HTTP-01 路径必须能被 step-ca 容器访问。先验证宿主机和容器两条路径：

```bash
echo acme-ok | sudo tee \
  /var/www/acme/.well-known/acme-challenge/test >/dev/null

curl http://<SERVICE_DOMAIN>/.well-known/acme-challenge/test

sudo docker exec step-ca wget -qO- \
  http://<SERVICE_DOMAIN>/.well-known/acme-challenge/test
```

两次都应输出 `acme-ok`。如果容器提示 `bad address`，回到 Compose 检查 `dns`，然后使用
`sudo docker compose up -d --force-recreate` 重新创建容器；持久化 CA 数据不会丢失。

## 使用 Certbot 签发证书

检查并重载 Nginx 后，向私有 ACME 服务申请证书：

```bash
sudo nginx -t
sudo systemctl reload nginx

sudo certbot certonly \
  --webroot \
  --webroot-path /var/www/acme \
  --server https://<CA_DOMAIN>:9443/acme/acme/directory \
  --domain <SERVICE_DOMAIN> \
  --agree-tos \
  --register-unsafely-without-email
```

签发成功后，增加 HTTPS 站点。保留前面的 HTTP 站点供续期使用：

```nginx
server {
    listen <CA_ZEROTIER_IP>:443 ssl http2;
    server_name <SERVICE_DOMAIN>;

    ssl_certificate
        /etc/letsencrypt/live/<SERVICE_DOMAIN>/fullchain.pem;
    ssl_certificate_key
        /etc/letsencrypt/live/<SERVICE_DOMAIN>/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        allow <ZEROTIER_CIDR>;
        deny all;

        # 迁移时如果删除了这一行，域名将无法访问 Nginx UI。
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

如果 Nginx UI 不在本机，把 `proxy_pass` 改为它的受限私网地址。应用并检查线上证书：

```bash
sudo nginx -t
sudo systemctl reload nginx

openssl s_client \
  -connect <CA_ZEROTIER_IP>:443 \
  -servername <SERVICE_DOMAIN> </dev/null 2>/dev/null |
openssl x509 -noout -subject -issuer -dates
```

再确认反向代理已经恢复：

```bash
curl --noproxy '*' -I https://<SERVICE_DOMAIN>
```

如果请求仍返回 `502 Bad Gateway`，检查 Nginx UI 是否监听 `127.0.0.1:9000`，并从 Nginx
所在主机执行 `curl -I http://127.0.0.1:9000`。如果域名站点没有响应或显示了错误页面，
检查当前生效的站点配置中是否保留了 `location /` 和 `proxy_pass`。

## 配置自动续期

step-ca 的叶证书通常有效期较短，不应沿用公网 90 天证书的检查频率。创建部署钩子
`/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`：

```sh
#!/bin/sh
nginx -t >/dev/null 2>&1 && systemctl reload nginx
```

设置权限：

```bash
sudo chmod 755 \
  /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

创建 `/etc/systemd/system/certbot.timer.d/override.conf`，每 6 小时检查一次并加入随机延迟：

```ini
[Timer]
OnCalendar=
OnCalendar=*-*-* 00,06,12,18:00:00
RandomizedDelaySec=30m
Persistent=true
```

应用并检查定时器：

```bash
sudo systemctl daemon-reload
sudo systemctl restart certbot.timer
sudo systemctl enable certbot.timer
systemctl list-timers certbot.timer
```

Certbot 的普通续期会读取证书配置中保存的私有 ACME 地址。进行模拟续期时则应显式指定
私有 CA，避免 Certbot 切换到 Let’s Encrypt 测试环境：

```bash
sudo certbot renew \
  --dry-run \
  --run-deploy-hooks \
  --server https://<CA_DOMAIN>:9443/acme/acme/directory
```

确认续期配置中的 `server` 也指向 step-ca：

```bash
sudo grep '^server' \
  /etc/letsencrypt/renewal/<SERVICE_DOMAIN>.conf
```

## 让 macOS 信任根 CA

先确认 macOS 已将 `biulight.internal` 的查询发给内网 CoreDNS。使用系统 Split-DNS 时，
`/etc/resolver/biulight.internal` 内容可以是：

```text
nameserver <CA_ZEROTIER_IP>
```

刷新并检查解析：

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
dig <CA_DOMAIN>
dig <SERVICE_DOMAIN>
```

安装 `step` CLI，并使用已经独立核对过的指纹引导：

```bash
brew install step

env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  step ca bootstrap \
  --ca-url https://<CA_DOMAIN>:9443 \
  --fingerprint <ROOT_FINGERPRINT> \
  --install
```

按提示输入管理员密码，完全退出并重新打开浏览器，再验证：

```bash
curl --noproxy '*' https://<SERVICE_DOMAIN>

security find-certificate \
  -c "Biulight Internal CA" \
  /Library/Keychains/System.keychain
```

Safari 和 Chrome 使用 macOS 系统钥匙串。Firefox 若仍提示不信任，需要在其证书设置中
单独导入 `root_ca.crt`。

## 常见问题

### step-ca 无法读取 CA 密码

日志出现 `/run/secrets/ca_password: Permission denied` 时，先检查宿主机目录和文件权限：

```bash
sudo chmod 700 /opt/step-ca/secrets
sudo chmod 644 /opt/step-ca/secrets/ca-password
sudo docker compose up -d
```

不要使用 `docker compose down -v` 处理权限问题，它会删除已初始化的 CA 数据。

### ACME 授权一直无法完成

宿主机能访问挑战文件而 step-ca 容器提示无法解析时，问题在容器 DNS。确认 Compose 中有：

```yaml
dns:
  - <CA_ZEROTIER_IP>
```

重新创建容器，再从容器内部读取挑战文件。不要用 `-k` 或关闭 TLS 校验掩盖问题。

### `.internal` 被 CA 拒绝

如果模拟续期出现 `Domain name does not end with a valid public suffix`，Certbot 实际连接了
Let’s Encrypt，而不是 step-ca。为 `certbot renew --dry-run` 显式传入本文的私有
`--server`，并检查续期配置中的 `server` 值。

### macOS 引导时报 `unexpected EOF`

终端中设置的 `HTTP_PROXY`、`HTTPS_PROXY` 或 `ALL_PROXY` 可能把内网 CA 请求发给代理。
使用前面的 `env -u ...` 命令临时绕过代理，或把私有域名和 ZeroTier 地址加入大小写两套
`NO_PROXY` / `no_proxy`。详细排查参见
[终端代理误拦截 ZeroTier 私有域名的排查与修复](./terminal-proxy-no-proxy-zerotier.md)。

## 备份和恢复边界

至少备份 step-ca 数据卷和 `/opt/step-ca/secrets/ca-password`，包括 CA 的 `certs`、
`config`、`db` 和 `secrets`。备份应加密并限制访问，恢复演练也应在隔离环境中进行。

丢失 CA 私钥后，不能只重新签发一张服务器证书来恢复：必须建立新 CA、重新为服务签发
证书，并在所有客户端替换受信任的根证书。仅回滚 Nginx 配置时，则可以恢复原证书路径，
执行 `nginx -t` 后重载 Nginx。

## 可选：使用 `*.biulight.internal` 通配符证书

前面的做法为 `nginx-ui.biulight.internal` 单独签发证书，适合服务较少、希望每个服务使用
独立私钥的情况。随着 `nas.biulight.internal`、`s3.biulight.internal` 等内网服务增多，
逐个申请证书、配置续期和维护路径会变得重复。如果这些域名都由同一台受控的 Nginx 终止
TLS，可以改用一张 `*.biulight.internal` 通配符证书，让所有下一层子域共享同一套证书和
续期任务。

通配符证书解决的是“每个域名都要单独签发和续期”的问题，不能替代客户端的 CA 信任。
由于证书仍由私有 step-ca 签发，每台 macOS、Windows、Linux 或移动设备仍需至少一次把
`Biulight Internal CA` 根证书加入操作系统信任存储。根 CA 信任完成后，该设备会信任这个
CA 签发的单域名证书和通配符证书，新增子域时不需要再次导入根证书。

是否使用通配符证书取决于私钥边界：

- 多个域名由同一台 Nginx 提供 HTTPS 时，通配符证书可以明显减少重复配置；
- 服务分散在不同主机或由不同人员管理时，优先为每个服务签发独立证书，避免一台主机泄露
  通配符私钥后影响所有子域；
- `*.biulight.internal` 只覆盖一层子域，不覆盖裸域 `biulight.internal`，也不覆盖
  `api.dev.biulight.internal`。

还有一个验证方式的差异：通配符证书不能使用前文的 HTTP-01。ACME 客户端申请
`*.biulight.internal` 时必须使用
[DNS-01](https://smallstep.com/docs/step-ca/acme-basics/)，并在
`_acme-challenge.biulight.internal` 下动态创建 TXT 记录。当前 CoreDNS `hosts` 插件只能
维护主机地址，不提供 Certbot 所需的 TXT 记录自动更新接口，因此不能只把前文的
`--domain` 改成通配符后继续申请。

在当前完全受控的私有网络里，最小改动方案是直接使用 step-ca 容器自带的 `step` CLI 和
初始化时创建的 `admin` JWK provisioner。宿主机不需要再安装或引导一套 `step`；把 Nginx
证书目录挂进容器后，签发和续期都在容器内完成。这样无需先改造 CoreDNS 的动态 DNS 能力，
但 `admin` 的签发权限较高，以下操作只能在受控的 CA 主机上执行。

先创建证书目录，并查看 step-ca 容器用户的 UID 和 GID：

```bash
sudo install -d -m 700 /etc/nginx/ssl/biulight.internal

cd /opt/step-ca
sudo docker compose exec -T step-ca id
```

记下输出中的 `<STEP_UID>` 和 `<STEP_GID>`，让容器用户能够写入证书目录：

```bash
sudo chown <STEP_UID>:<STEP_GID> \
  /etc/nginx/ssl/biulight.internal
```

在 `compose.yaml` 的 `step-ca` 服务中增加一个读写挂载：

```yaml
services:
  step-ca:
    volumes:
      - step_ca_data:/home/step
      - /etc/nginx/ssl/biulight.internal:/var/local/step-wildcard
```

保留原有的 `step_ca_data`，然后重新创建容器。这个操作不会重新初始化或删除 CA：

```bash
cd /opt/step-ca
sudo docker compose up -d --force-recreate
sudo docker compose ps
```

直接在 step-ca 容器内签发同时包含根域和通配符 SAN 的证书：

```bash
sudo docker compose exec -T step-ca \
  step ca certificate "*.biulight.internal" \
  /var/local/step-wildcard/fullchain.pem \
  /var/local/step-wildcard/privkey.pem \
  --san biulight.internal \
  --san "*.biulight.internal" \
  --provisioner admin \
  --provisioner-password-file /run/secrets/ca_password \
  --ca-url https://localhost:9000 \
  --root /home/step/certs/root_ca.crt

sudo chmod 600 /etc/nginx/ssl/biulight.internal/privkey.pem
```

命令额外加入 `biulight.internal` SAN，使同一张证书也能用于裸域；通配符 SAN 仍然只匹配
下一层主机名。

需要共享证书的 HTTPS 站点统一引用：

```nginx
ssl_certificate     /etc/nginx/ssl/biulight.internal/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/biulight.internal/privkey.pem;
```

不要把私钥复制到不需要终止 TLS 的主机。服务分散在多台机器时，优先让一台受控的 Nginx
承担 TLS 终止；如果必须分发证书，应使用受限的部署通道和独立权限，而不是开放共享目录。

检查 SAN、证书链和 Nginx 配置：

```bash
sudo docker compose exec -T step-ca \
  step certificate inspect \
  /var/local/step-wildcard/fullchain.pem --short

sudo nginx -t
sudo systemctl reload nginx
```

### 自动续期通配符证书

复用容器里的 `step ca renew`，由宿主机 systemd 定时触发。创建
`/etc/systemd/system/step-wildcard-renewer.service`：

```ini
[Unit]
Description=Renew *.biulight.internal certificate
After=network-online.target docker.service
Wants=network-online.target
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/opt/step-ca
ExecStart=/usr/bin/docker compose exec -T step-ca \
  step ca renew --force --expires-in 8h \
  --ca-url https://localhost:9000 \
  --root /home/step/certs/root_ca.crt \
  /var/local/step-wildcard/fullchain.pem \
  /var/local/step-wildcard/privkey.pem
ExecStartPost=/bin/sh -c '/usr/sbin/nginx -t >/dev/null 2>&1 && /usr/bin/systemctl reload nginx'
```

如果 `command -v docker` 返回的不是 `/usr/bin/docker`，应把 `ExecStart` 中的路径改成实际
路径。再创建 `/etc/systemd/system/step-wildcard-renewer.timer`：

```ini
[Unit]
Description=Check *.biulight.internal certificate renewal every 6 hours

[Timer]
OnCalendar=*-*-* 00,06,12,18:00:00
RandomizedDelaySec=30m
Persistent=true

[Install]
WantedBy=timers.target
```

[`step ca renew`](https://smallstep.com/docs/step-cli/reference/ca/renew/) 会在证书剩余有效期不足
8 小时时续期；`--force` 允许非交互覆盖原文件。服务完成后会检查并重载 Nginx。启用定时器
并先手工运行一次服务：

```bash
sudo systemctl daemon-reload
sudo systemctl start step-wildcard-renewer.service
sudo systemctl enable --now step-wildcard-renewer.timer
systemctl status step-wildcard-renewer.service
systemctl list-timers step-wildcard-renewer.timer
journalctl -u step-wildcard-renewer.service -n 50 --no-pager
```

最后确认线上站点实际返回通配符证书：

```bash
openssl s_client \
  -connect <CA_ZEROTIER_IP>:443 \
  -servername nginx-ui.biulight.internal </dev/null 2>/dev/null |
openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

如果以后希望继续统一使用 Certbot 管理通配符证书，需要先为 `biulight.internal` 部署支持
动态 TXT 更新的权威 DNS，再配置对应的 Certbot DNS 插件或安全的认证钩子。不要使用
`certbot --manual` 作为自动续期方案；没有认证钩子时，每次续期都需要人工更新 TXT 记录。
