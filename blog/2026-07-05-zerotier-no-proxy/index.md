---
title: 终端代理没有排除 ZeroTier 私有域名，结果请求被本地代理拦截
slug: /terminal-proxy-no-proxy-zerotier
authors: biulight
tags: [Shine, ZeroTier, Proxy, Troubleshooting]
---

最近在一台已经接入 ZeroTier 的设备上排查服务连通性，本来只是想用 `curl` 直接访问私有域名，结果请求却被本地 HTTP 代理接管了。

<!--truncate-->

如果你也在终端里设置了 `HTTP_PROXY`、`HTTPS_PROXY`，同时又依赖 ZeroTier 私有域名或 `192.168.x.x` 这一类局域网地址，最好顺手检查一下 `NO_PROXY` / `no_proxy`。否则 DNS 虽然能解析到内网目标，请求仍可能先进入本地代理链路。

这类场景在结合 Shine 的 `proxy` shell 预设时尤其容易忽略，因为我们平时更关注“代理有没有打开”，不一定会第一时间想到“哪些地址本来就不该走代理”。

## 背景

目标很简单：通过 ZeroTier 提供的私有网络和私有 DNS，直接访问一台内网服务。

按预期，这条链路应该是：

1. 终端解析 `<PRIVATE_HOST>` 之类的私有域名。
2. 系统把该域名交给私有 DNS。
3. DNS 返回 ZeroTier 地址或局域网地址。
4. `curl` 直接连向目标服务。

但实际现象不是这样。

## 现象

在已经启用终端代理的 shell 中执行：

```bash
curl http://<PRIVATE_HOST>
curl http://192.168.0.10:8080
```

请求没有直接访问目标，而是进入了本地 HTTP 代理。对某些代理软件来说，这会表现为请求被拦截、拒绝，或者在日志里出现一条本不该经过代理的内网访问记录。

这时最容易误判成下面几类问题：

- ZeroTier 没连通；
- CoreDNS 没解析对；
- 目标服务没启动；
- 私有域名配置有误。

但如果浏览器、其他客户端，或者关闭代理后的同一条命令能够访问成功，就该反过来检查当前 shell 的代理环境。

## 原因

`curl` 这类命令行工具会读取当前终端中的代理变量，例如：

```bash
env | rg '^(HTTP_PROXY|HTTPS_PROXY|NO_PROXY|http_proxy|https_proxy|no_proxy)='
```

只要 `HTTP_PROXY` / `HTTPS_PROXY` 已设置，而 `NO_PROXY` / `no_proxy` 没有覆盖私有域名后缀和局域网地址段，这些请求仍会走代理。

这也是 ZeroTier 场景里很容易忽略的一点：

- ZeroTier 解决的是“设备之间是否可达”；
- 私有 DNS 解决的是“私有域名解析到哪里”；
- `NO_PROXY` 解决的是“这个请求该不该绕过终端代理”。

这三个环节缺一不可。前两项都正确时，最后仍可能卡在代理变量这一层。

## 修复

如果你用 Shine 管理终端代理，推荐直接维护 `PROXY_NO_PROXY`，让 Shine 统一生成 `NO_PROXY` 和 `no_proxy`。

先查看当前配置：

```bash
shine env list
shine info shell/proxy
```

然后把默认值和私有网络需要的排除项一起写进去。下面示例全部使用占位值：

```bash
shine env set PROXY_NO_PROXY \
  'localhost,127.0.0.1,::1,.home.example.internal,192.168.0.0/16'
```

这里至少建议覆盖：

- `localhost,127.0.0.1,::1`
- 私有域名后缀，例如 `.home.example.internal`
- 局域网地址段，例如 `192.168.0.0/16`

修改后不要只停留在 `env set`。Shine 会先把已安装的 `proxy` 预设标记为可更新，还需要执行：

```bash
shine update shell/proxy
shine upgrade shell/proxy
```

如果你不是用 Shine 管理终端代理，本质上也一样：最终要确认当前 shell 里的 `NO_PROXY` / `no_proxy` 已经包含这些私有目标。

## 验证

先确认当前 shell 中的代理变量已经变成预期值：

```bash
shine info shell/proxy
env | rg '^(HTTP_PROXY|HTTPS_PROXY|NO_PROXY|http_proxy|https_proxy|no_proxy)='
```

再分别验证私有域名和局域网地址：

```bash
curl http://<PRIVATE_HOST>
curl http://192.168.0.10:8080
```

如果修复生效，这两类请求应该直接访问目标，而不是继续进入本地代理。

若你使用的是基于私有域名的 ZeroTier 解析链路，也可以顺手对照这篇原理说明：

- [使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络](/knowledge/zerotier-coredns-split-dns)

## 延伸建议

这个坑本质上不是 ZeroTier 独有问题，而是“终端代理”和“私有网络”叠在一起时的常见遗漏。

如果你希望以后少踩一次，最简单的做法有两个：

1. 把私有域名后缀和常用内网地址段纳入 `PROXY_NO_PROXY` 的默认维护范围。
2. 每次怀疑 ZeroTier 或私有 DNS 之前，先检查一眼当前 shell 的代理变量。

如果你只想快速排查同类问题，可以直接看这篇排障文：

- [终端代理误拦截 ZeroTier 私有域名的排查与修复](/knowledge/terminal-proxy-no-proxy-zerotier)
