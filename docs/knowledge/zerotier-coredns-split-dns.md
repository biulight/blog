---
title: 使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络
sidebar_position: 3
---

# 使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络

本指南把不同地点的设备加入一张自建 ZeroTier 网络，并让 macOS、Ubuntu 和 Windows
只把私有域名交给 CoreDNS。完成后，可以使用
`nas.home.example.internal` 访问异地服务，同时继续使用原来的 DNS 解析互联网域名。

本文使用自建 `zerotier-planet`，而不是 ZeroTier 官方托管的根服务器。示例中的网络 ID、
地址和路径都是占位值，执行前必须替换。

这里有一个关键限制：本文使用的自建 ZeroTier 控制器不能为网络成员配置和下发 DNS。
控制器可以授权成员、分配 ZeroTier 地址，但部署 CoreDNS 后，客户端并不会自动使用它。
因此还需要在每台客户端执行 `shine sys apply split-dns`，把私有域名后缀定向到 CoreDNS；
这正是本文引入 Shine 的原因。

## 方案如何工作

一次私有域名访问经过以下链路：

1. Shine 在客户端创建的 Split-DNS 规则匹配 `home.example.internal`。
2. 系统把查询发给 ZeroTier 地址 `<DNS_ZEROTIER_IP>`，其他域名仍使用原 DNS。
3. CoreDNS 返回目标设备的 ZeroTier 地址，例如 `<NAS_ZEROTIER_IP>`。
4. 客户端通过 ZeroTier 加密网络访问目标服务。

各组件的职责彼此独立：

- `zerotier-planet` 提供自建 Planet 和网络控制器，但不向成员下发 DNS；
- ZeroTier 给跨地点设备建立三层可达的私网；
- CoreDNS 保存私有域名记录；
- Shine 补上控制器缺失的 DNS 配置能力，在客户端安全地创建、重应用和移除
  Split-DNS 规则。

Split-DNS 匹配的是域名后缀。`nas` 不会自动匹配
`home.example.internal`，后续测试和应用配置都应使用完整域名
`nas.home.example.internal`。

## 前置条件和示例值

- 一台具有固定公网 IP 的 Linux 服务器，用于运行 `zerotier-planet`；
- 已安装 Docker、Docker Compose 插件和 Git；
- 一台已加入 ZeroTier 网络的 Linux 主机，用于运行 CoreDNS；
- 客户端已安装 Shine 0.36.0 或更高版本；
- 可以控制 Planet 服务器和 DNS 主机的防火墙。

先规划并记录这些值：

| 占位符 | 含义 | 示例 |
| --- | --- | --- |
| `<PLANET_SERVER_IP>` | Planet 服务器的公网 IP | `203.0.113.10` |
| `<ZEROTIER_NETWORK_ID>` | 控制台创建的 16 位网络 ID | `0123456789abcdef` |
| `<ZEROTIER_CIDR>` | 分配给成员的 ZeroTier 网段 | `10.147.0.0/16` |
| `<DNS_ZEROTIER_IP>` | CoreDNS 主机的 ZeroTier 地址 | `10.147.0.10` |
| `<NAS_ZEROTIER_IP>` | 示例 NAS 的 ZeroTier 地址 | `10.147.0.20` |

不要直接复制示例网络 ID。私有域统一使用 `home.example.internal`；如果改成自己的域名，
必须同步修改 CoreDNS 区域文件和 Shine 环境变量。

## 部署自建 zerotier-planet

以下流程来自
[Jonnyan404/zerotier-planet](https://github.com/Jonnyan404/zerotier-planet)。该项目当前要求
开放 TCP `4000`、`9993`、`3180` 和 UDP `9993`。`9993/udp` 是 ZeroTier 数据通道；
控制台和文件下载端口不应长期暴露给任意来源，优先通过防火墙限制管理 IP，或放在带认证的
HTTPS 反向代理后。

```bash
git clone https://github.com/Jonnyan404/zerotier-planet.git
cd zerotier-planet
```

按项目 README 修改 `docker-compose.yml` 中的公网 IP 为 `<PLANET_SERVER_IP>`，然后启动：

```bash
docker compose up -d
docker cp mkmoonworld-x86_64 ztncui:/tmp
docker cp patch.sh ztncui:/tmp
docker exec -it ztncui bash /tmp/patch.sh
docker restart ztncui
docker compose ps
```

打开 `http://<PLANET_SERVER_IP>:4000` 进入控制台。使用上游 README 标明的初始凭据首次
登录后，立即修改管理员密码。再打开 `http://<PLANET_SERVER_IP>:3180` 下载生成的
`planet` 文件；也可以从项目的 `ztncui/etc/myfs/` 目录取得。

在控制台新建网络，规划 `<ZEROTIER_CIDR>` 地址池，并记下
`<ZEROTIER_NETWORK_ID>`。成员加入后还需要在控制台勾选 `Authorized`，否则客户端即使
显示已加入，也不会获得可用地址。

这个控制台没有可供网络成员使用的 DNS 下发配置。不要预期成员授权后会自动解析
`home.example.internal`；控制台只完成组网，DNS 服务和客户端 Split-DNS 将在后续步骤
分别配置。

自建 Planet 会替换客户端信任的根服务器集合。升级 ZeroTier 或这个第三方项目之前，应先
备份控制器数据和当前 `planet` 文件，并阅读双方的兼容性说明。商业使用还应核对 ZeroTier
当前许可要求。

## 让设备加入自建网络

先从 [ZeroTier 下载页](https://www.zerotier.com/download/)安装适合当前平台的客户端，
再把刚下载的 `planet` 文件复制到各平台的数据目录。覆盖前保留原文件，以便回退。

### Ubuntu

```bash
sudo cp /var/lib/zerotier-one/planet /var/lib/zerotier-one/planet.backup
sudo cp <DOWNLOADED_PLANET_PATH> /var/lib/zerotier-one/planet
sudo systemctl restart zerotier-one
sudo zerotier-cli join <ZEROTIER_NETWORK_ID>
```

### macOS

```bash
sudo cp "/Library/Application Support/ZeroTier/One/planet" \
  "/Library/Application Support/ZeroTier/One/planet.backup"
sudo cp <DOWNLOADED_PLANET_PATH> \
  "/Library/Application Support/ZeroTier/One/planet"
sudo kill "$(cat '/Library/Application Support/ZeroTier/One/zerotier-one.pid')"
sudo zerotier-cli join <ZEROTIER_NETWORK_ID>
```

ZeroTier 的 macOS 服务会重新拉起。若安装包没有把 `zerotier-cli` 加入当前 `PATH`，请从
ZeroTier 菜单栏应用执行加入操作，或使用安装包提供的命令路径。

### Windows

以管理员身份打开 PowerShell。先在“服务”中停止 `ZeroTier One`，备份并替换
`C:\ProgramData\ZeroTier\One\planet`，再启动该服务，然后运行：

```powershell
zerotier-cli.bat join <ZEROTIER_NETWORK_ID>
```

三种平台都加入后，在自建控制台授权成员并分配地址。随后检查：

```bash
zerotier-cli peers
zerotier-cli listnetworks
```

Windows 使用 `zerotier-cli.bat`。`peers` 应出现角色为 `PLANET` 的自建节点；
`listnetworks` 中目标网络应为 `OK`，并显示分配到的 ZeroTier 地址。最后从客户端测试 DNS
主机的地址：

```bash
ping <DNS_ZEROTIER_IP>
```

部分主机禁用 ICMP；此时 ping 失败不能单独证明网络不可用，还要继续测试 DNS 的 TCP 和
UDP 53 端口。

## 使用 Docker Compose 部署 CoreDNS

CoreDNS 可以和 Planet 位于同一台主机，也可以位于任意已加入该 ZeroTier 网络的 Linux
主机。以下示例把宿主机端口 53 只绑定到 `<DNS_ZEROTIER_IP>`。

创建目录并准备三个文件：

```text
coredns/
├── .env
├── config/
│   ├── Corefile
│   └── db.home.example.internal
└── docker-compose.yml
```

`.env`：

```dotenv title=".env"
DNS_ZEROTIER_IP=<DNS_ZEROTIER_IP>
```

`docker-compose.yml`：

```yaml title="docker-compose.yml"
services:
  coredns:
    image: coredns/coredns:1.14.4
    container_name: coredns
    command: -conf /etc/coredns/Corefile
    restart: unless-stopped
    ports:
      - "${DNS_ZEROTIER_IP}:53:53/udp"
      - "${DNS_ZEROTIER_IP}:53:53/tcp"
    volumes:
      - ./config:/etc/coredns:ro
```

固定镜像版本可以避免一次普通重启意外拉取不兼容版本。`container_name` 让后续查看日志时更
直观，但不是功能必需项；如果同一台 Docker 主机要运行多套此配置，可以删除它，让 Compose
自动生成不冲突的名称。端口映射中的 `${DNS_ZEROTIER_IP}` 不要省略：写成 `53:53` 会绑定
宿主机所有网络接口，可能把递归 DNS 暴露到公网或物理局域网。

`Corefile`：

```text title="Corefile"
home.example.internal:53 {
    errors
    log
    file /etc/coredns/db.home.example.internal home.example.internal {
        reload 30s
    }
}

.:53 {
    errors
    log
    cache 30
    forward . 1.1.1.1 1.0.0.1
}
```

第一个区块权威解析私有区域。第二个区块定义有人直接向 CoreDNS 查询非私有域名时的处理
方式；Split-DNS 客户端通常不会把这类查询发送到这里。若不需要递归解析，可以删除第二个
区块，让非私有查询直接失败。

`db.home.example.internal`：

```dns-zone title="db.home.example.internal"
$ORIGIN home.example.internal.
$TTL 60
@ IN SOA dns.home.example.internal. admin.home.example.internal. (
    2026070501 3600 600 86400 60
)
  IN NS dns.home.example.internal.

dns IN A <DNS_ZEROTIER_IP>
nas IN A <NAS_ZEROTIER_IP>
```

修改记录时递增 SOA 序列号。启动前检查宿主机的 53 端口没有被其他容器或服务占用：

```bash
sudo ss -lntup | grep ':53 '
docker compose config
docker compose up -d
docker compose logs --tail=50 coredns
```

容器日志不应出现区域文件解析或端口绑定错误。直接查询私有记录：

```bash
dig @<DNS_ZEROTIER_IP> nas.home.example.internal A
dig +tcp @<DNS_ZEROTIER_IP> nas.home.example.internal A
```

UDP 和 TCP 查询都应返回 `<NAS_ZEROTIER_IP>`。

### 限制 DNS 的访问范围

端口绑定只控制监听地址，仍应使用云防火墙和宿主机防火墙限制来源。以 UFW 为例，替换
占位符后执行：

```bash
sudo ufw allow from <ZEROTIER_CIDR> to <DNS_ZEROTIER_IP> port 53 proto udp
sudo ufw allow from <ZEROTIER_CIDR> to <DNS_ZEROTIER_IP> port 53 proto tcp
```

不要为 53 端口添加任意公网来源规则。若 CoreDNS 主机同时有公网地址，还应从公网侧验证
该地址的 53 端口不可达，避免成为开放递归 DNS。

## 使用 Shine 应用 Split-DNS

CoreDNS 此时已经能回答私有域名，但自建 ZeroTier 控制器不会把它下发给客户端。下面的
Shine 命令会在当前操作系统创建按域名后缀路由的 DNS 规则：只有
`home.example.internal` 交给 `<DNS_ZEROTIER_IP>`，其他域名仍沿用系统原来的 DNS。

### 通过私有 Overlay 同步配置

多台设备共用同一张 ZeroTier 网络时，推荐把域名和 DNS 地址放在一个私有 Git overlay
仓库。它们通常不是认证凭据，但会暴露内部域名和网络拓扑，因此不应提交到公开仓库。

在 overlay 仓库根目录创建不带 `[env]` 表头的 `shine.env.toml`：

```toml title="shine.env.toml"
PRIVATE_DNS_DOMAIN = { value = "home.example.internal", description = "ZeroTier 私有 DNS 后缀" }
PRIVATE_DNS_SERVERS = { value = "<DNS_ZEROTIER_IP>", description = "ZeroTier 网络中的 CoreDNS 地址" }
```

在每台客户端克隆这个私有仓库并链接 overlay：

```bash
git clone <PRIVATE_OVERLAY_REPOSITORY> <LOCAL_OVERLAY_PATH>
shine preset overlay link <LOCAL_OVERLAY_PATH>
shine preset overlay info
shine env get PRIVATE_DNS_DOMAIN
shine sys info split-dns
shine sys apply split-dns --dry-run
shine sys apply split-dns
shine sys status
```

以后在一台设备修改并推送 `shine.env.toml`，其他设备执行以下命令即可同步并重新应用：

```bash
shine preset pull
shine sys apply split-dns --dry-run
shine sys apply split-dns
```

Shine 会在每次新命令启动时重新读取 overlay 的 `shine.env.toml`，因此 `shine preset pull` 后不需要
再执行 `shine env set`。如果 overlay 仓库还有其他预设，`shine preset pull` 会一起进行安全的
fast-forward 更新；仓库存在本地改动时会拒绝拉取，避免覆盖未提交内容。

### 只配置当前设备

不需要跨设备同步时，也可以把值写入当前设备的 Shine 全局配置：

```bash
shine env set PRIVATE_DNS_DOMAIN home.example.internal
shine env set PRIVATE_DNS_SERVERS <DNS_ZEROTIER_IP>
shine sys info split-dns
shine sys apply split-dns --dry-run
shine sys apply split-dns
shine sys status
```

`PRIVATE_DNS_SERVERS` 支持用逗号、空格或换行分隔多个 IP，可以部署第二台 CoreDNS 后增加
冗余。Shine 不接受主机名作为 DNS 服务器地址。已链接 overlay 时，同名 overlay 值的
优先级高于 `shine env set` 保存的全局值；要做单机覆盖，应使用更高优先级的项目
`shine.env.toml`，或为该设备链接单独的 overlay。

Shine 在不同平台创建的资源不同：

- macOS：写入 `/etc/resolver/home.example.internal`；
- Ubuntu：写入 `/etc/systemd/resolved.conf.d/shine-split-dns-split-dns.conf`，设置
  `DNS=` 和路由域 `Domains=~home.example.internal`，然后重启 `systemd-resolved`；
- Windows：创建命名空间 `.home.example.internal` 的 NRPT 规则。

这些操作需要管理员权限。Shine 会给资源加入所有权标记；如果目标文件已经存在但不是
Shine 创建的，它会拒绝覆盖。修改域名或 DNS 地址后，重新运行
`shine sys apply split-dns` 即可更新。

不再需要这条规则时先预览，再安全移除：

```bash
shine sys uninstall split-dns --dry-run
shine sys uninstall split-dns
```

卸载只删除 Shine 记录且仍带有所有权标记的 Split-DNS 资源，不会删除 CoreDNS 数据或
退出 ZeroTier 网络。

## 分层验证

按层排查可以避免把 DNS 问题误判成 ZeroTier 问题。

### 1. ZeroTier 网络

```bash
zerotier-cli peers
zerotier-cli listnetworks
ping <DNS_ZEROTIER_IP>
```

确认自建 Planet、网络状态和成员地址都正确。

### 2. 直接查询 CoreDNS

```bash
dig @<DNS_ZEROTIER_IP> nas.home.example.internal A
dig +tcp @<DNS_ZEROTIER_IP> nas.home.example.internal A
```

Windows 没有 `dig` 时可运行：

```powershell
Resolve-DnsName nas.home.example.internal -Server <DNS_ZEROTIER_IP>
```

### 3. 通过系统解析器

不要再指定 DNS 服务器：

```bash
dig nas.home.example.internal A
```

Windows：

```powershell
Resolve-DnsName nas.home.example.internal
Get-DnsClientNrptPolicy -Effective
```

macOS 可用 `scutil --dns` 检查对应域名的 resolver；Ubuntu 可用
`resolvectl status` 和 `resolvectl query nas.home.example.internal` 检查路由域。

### 4. 访问实际服务

```bash
curl -I http://nas.home.example.internal:<SERVICE_PORT>/
```

DNS 成功但应用失败时，检查目标主机是否监听 ZeroTier 地址、服务端口防火墙以及 URL 的
协议和端口，不要继续修改 DNS。

## 故障排查

### `peers` 中没有自建 `PLANET`

- 确认替换的是当前 ZeroTier 实例实际使用的数据目录；
- 比较客户端上的 `planet` 与下载文件，随后重启 ZeroTier 服务；
- 检查 Planet 公网服务器的 UDP `9993` 和 TCP `9993`；
- 检查生成 Planet 后是否执行了容器重启。

### 已加入网络但没有地址或无法互通

- 在自建控制台确认成员已勾选 `Authorized`；
- 检查地址池包含可分配地址，且不同地点的物理局域网没有使用相同网段；
- 使用 `zerotier-cli listnetworks` 确认状态为 `OK`。

### 直接查询 CoreDNS 超时

- 检查 `docker compose ps` 和 `docker compose logs coredns`；
- 确认 `.env` 中绑定的是 DNS 主机自己的 ZeroTier 地址；
- 同时检查 UDP 和 TCP 53，防火墙需要允许两者；
- 检查云防火墙没有错误地把 DNS 暴露到公网。

### 直接查询成功，系统查询失败

- 确认 `PRIVATE_DNS_DOMAIN` 不包含协议、端口或通配符；
- 重新运行 `shine sys apply split-dns --dry-run` 和正式应用；
- macOS 检查 `scutil --dns`，Ubuntu 检查 `resolvectl status`，Windows 检查有效 NRPT；
- 清理系统 DNS 缓存，或断开并重新连接网络后再试。

### 浏览器或代理软件仍然解析失败

部分浏览器的安全 DNS、代理客户端和 VPN 会绕过或接管系统解析器。先用系统命令确认
Split-DNS 正常，再让代理软件对 `home.example.internal` 使用系统 DNS 或配置同等的私有域
规则。不要把私有记录发布到公共 DNS 来规避客户端配置。

## 参考资料

- [Jonnyan404/zerotier-planet](https://github.com/Jonnyan404/zerotier-planet)
- [zerotier-planet 客户端配置说明](https://github.com/Jonnyan404/zerotier-planet/blob/main/%E5%AE%A2%E6%88%B7%E7%AB%AF%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95.md)
- [CoreDNS file 插件](https://coredns.io/plugins/file/)
- [CoreDNS forward 插件](https://coredns.io/plugins/forward/)
- [Shine 初始化与管理系统](/products/shine/guides/system-init)
