---
title: 终端代理误拦截 ZeroTier 私有域名的排查与修复
sidebar_position: 4
---

# 终端代理误拦截 ZeroTier 私有域名的排查与修复

当 `curl`、`wget` 或其他命令行工具访问 ZeroTier 私有域名时，如果请求被本地代理接管、拦截或拒绝，先不要急着怀疑 ZeroTier、CoreDNS 或目标服务本身。很多时候，问题出在当前 shell 的 `NO_PROXY` / `no_proxy` 没有排除私有域名后缀和局域网地址段。

本文适用于已经在终端中设置了 `HTTP_PROXY` / `HTTPS_PROXY`，同时又需要访问 ZeroTier 私有域名或 `192.168.x.x` 一类局域网目标的场景。

## 症状：访问私有域名时反而走了本地代理

你可能会看到下面这些现象：

- `curl http://<PRIVATE_HOST>` 没有直连私网目标，而是进入本地 HTTP 代理链路；
- `curl http://192.168.0.10:8080` 也被同一套代理接管；
- 浏览器或其他客户端能够访问，但同一台机器上的 CLI 工具失败；
- 代理软件日志中出现本不该经过代理的内网请求。

这类问题经常和私有 DNS 配置混在一起出现。若你使用的是 ZeroTier + CoreDNS + Shine 的组合，可先了解其原理，再回到本文排查：

- [使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络](./zerotier-coredns-split-dns.md)

## 可能原因

最常见的原因有四类：

1. 当前 shell 已设置 `HTTP_PROXY` 或 `HTTPS_PROXY`。
2. `NO_PROXY` / `no_proxy` 没有覆盖私有域名后缀，例如 `.home.example.internal`。
3. `NO_PROXY` / `no_proxy` 没有覆盖局域网地址段，例如 `192.168.0.0/16`。
4. Shine 中保存的 `PROXY_NO_PROXY` 已修改，但当前 shell 仍在使用旧的 `proxy` 预设内容，或终端还没有重新加载。

关键点在于：

- ZeroTier 决定网络是否可达；
- 私有 DNS 决定域名解析到哪里；
- `NO_PROXY` / `no_proxy` 决定请求是否绕过终端代理。

前两项都正确时，请求依然可能卡在第三项。

## 处理方法

先从无损检查开始，再决定是否修改配置。

### 1. 检查当前 shell 的代理变量

```bash
env | rg '^(HTTP_PROXY|HTTPS_PROXY|NO_PROXY|http_proxy|https_proxy|no_proxy)='
```

如果输出中已经设置了 `HTTP_PROXY` / `HTTPS_PROXY`，但 `NO_PROXY` / `no_proxy` 里没有你的私有域名后缀或局域网地址段，就能基本确认问题方向。

### 2. 检查 Shine 中维护的代理排除列表

如果你使用 Shine 的 `proxy` shell 预设，再执行：

```bash
shine env list
shine info shell/proxy
```

现有手册中，`PROXY_NO_PROXY` 控制 `NO_PROXY` 和 `no_proxy`，默认值为：

```text
localhost,127.0.0.1,::1
```

当你开始访问私有网络时，这个默认值通常还不够。

### 3. 补充私有域名和局域网地址段

推荐把默认值和你的私有目标一起维护在 `PROXY_NO_PROXY` 中。下面全部使用占位值：

```bash
shine env set PROXY_NO_PROXY \
  'localhost,127.0.0.1,::1,.home.example.internal,192.168.0.0/16'
```

至少建议覆盖这些类型：

- 本机回环地址：`localhost,127.0.0.1,::1`
- 私有域名后缀：例如 `.home.example.internal`
- 局域网地址段：例如 `192.168.0.0/16`

如果你有多个私有后缀或多个地址段，可以继续追加到同一串逗号分隔值中。

### 4. 更新已安装的 Shine `proxy` 预设

仅执行 `shine env set` 还不够。修改 `PROXY_NO_PROXY` 后，需要让 Shine 重新生成并应用已安装的 `proxy` 预设：

```bash
shine update shell/proxy
shine upgrade shell/proxy
```

若当前终端没有自动拿到新值，重新打开一个终端，或按你的 shell 方式重新加载 profile。

### 5. 不使用 Shine 时的通用处理

如果你不是通过 Shine 管理代理，本质处理方式不变：确保当前 shell 中实际生效的 `NO_PROXY` / `no_proxy` 已经包含私有域名后缀和局域网地址段。

换句话说，Shine 只是帮你维护这些值；真正决定请求是否绕过代理的，仍然是当前进程环境里的 `NO_PROXY` / `no_proxy`。

## 验证

修改后，先再次检查当前环境：

```bash
shine info shell/proxy
env | rg '^(HTTP_PROXY|HTTPS_PROXY|NO_PROXY|http_proxy|https_proxy|no_proxy)='
```

再分别测试私有域名和局域网地址：

```bash
curl http://<PRIVATE_HOST>
curl http://192.168.0.10:8080
```

成功信号应是：

- 请求直接访问目标，而不是再次进入本地代理；
- 私有域名与局域网地址都符合预期；
- 若目标仍失败，错误类型已经从“代理拦截”转变为更具体的连通性或服务错误。

## 仍未解决

如果问题还在，建议按下面顺序继续收集信息：

```bash
shine --version
shine env list
shine info shell/proxy
env | rg '^(HTTP_PROXY|HTTPS_PROXY|NO_PROXY|http_proxy|https_proxy|no_proxy)='
```

重点区分两类问题：

- 如果域名本身无法解析，优先检查私有 DNS、Split-DNS 或 ZeroTier 网络配置；
- 如果域名能解析，但请求仍进入本地代理，继续检查 `NO_PROXY` / `no_proxy` 是否真的包含了目标后缀或地址段，以及当前 shell 是否已经重新加载。

若你是在阅读一篇踩坑记录后找到这里，也可以回看对应博客，了解这个问题在真实使用中的表现方式：

- [终端代理没有排除 ZeroTier 私有域名，结果请求被本地代理拦截](/blog/terminal-proxy-no-proxy-zerotier)
