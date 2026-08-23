---
title: 新增了一条 CoreDNS 记录却解析不出来：从怀疑 Surge、Proxifier 到重启 mDNSResponder
slug: /coredns-new-record-mdnsresponder-cache
authors: biulight
tags: [macOS, CoreDNS, DNS, Troubleshooting]
---

给自建的私有域名新增了一条 CoreDNS 记录，`ping` 却始终报"无法解析主机"，而同一个域名后缀下
其他早就存在的记录一切正常。这次排查依次怀疑了 Surge、Proxifier，最后才发现是 macOS
`mDNSResponder` 的陈旧缓存在作怪。

<!--truncate-->

本文保留这次排查的时间线，域名、内网地址和服务器信息均已替换为占位符。

## 背景

设备已经通过 `shine sys apply split-dns` 把私有域名后缀交给自建 CoreDNS 解析,具体原理见
[使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络](/knowledge/zerotier-coredns-split-dns)。
这次是往 CoreDNS 的 `Corefile` 里新增了一条 `hosts` 记录：

```text
hosts {
    10.20.30.10 nginx-ui.example.internal
    10.20.30.10 blog.example.internal   # 新加的
    ...
    fallthrough
}
```

`reload` 插件会自动感知 `Corefile` 变化，理论上不需要重启容器。

## 现象

```bash
❯ ping blog.example.internal
ping: cannot resolve blog.example.internal: Unknown host

❯ ping nginx-ui.example.internal
PING nginx-ui.example.internal (10.20.30.10): 56 data bytes
64 bytes from 10.20.30.10: icmp_seq=0 ttl=64 time=11.383 ms
```

同一个域名后缀、同一台 CoreDNS、同一个目标 IP，新记录解析不出来，旧记录完全正常。这种"只有
新东西不行"的现象,比单纯的"DNS 全部失效"更容易让人误判方向。

## 先排除服务端

在下结论之前，先直接绕过本机的解析路径，对 CoreDNS 发一次权威查询：

```bash
dig @10.20.30.10 blog.example.internal
```

拿到的是正确、带 `aa`（authoritative answer）标志的应答。这一步很关键：它证明 CoreDNS 本身
配置正确、`hosts` 记录也确实生效了，问题出在客户端到 CoreDNS 之间的某个环节，而不是服务端。

## 第一个怀疑对象：Surge

`scutil --dns` 显示 split-dns 的域名专属 resolver 配置完全正确，指向 CoreDNS 地址；但
`dscacheutil -q host -a name blog.example.internal`（真正走系统解析路径的检查方式）却什么
都拿不到。同时 `route -n get 10.20.30.10` 显示去 CoreDNS 的路由走的是一个 `feth` 虚拟网卡，
而这台机器上 Surge 的 Network Extension 处于 `activated enabled` 状态，很自然地怀疑是 Surge
的 Enhanced Mode（TUN 模式）把 DNS 流量整体接管了。

但这个方向被用户当场否掉：Surge 既没开系统代理，也没开 TUN 模式，只是用来暴露一个代理接口。
后面证实这个怀疑确实是误判——`feth` 网卡另有来源，和 Surge 是否处于 Enhanced Mode 无关。

## 第二个怀疑对象：Proxifier

同一台机器上还装了 Proxifier，它的系统扩展同样是 `activated enabled`。检查它当前生效的
profile，发现关键设置：

```xml
<Resolve>
    <ViaProxy enabled="true">
        <TryLocalDnsFirst enabled="false"/>
    </ViaProxy>
    <ExclusionList ...>localhost;%SimpleHostnames%;%ComputerName%;*.local;</ExclusionList>
</Resolve>
```

`ViaProxy enabled="true"` 加 `TryLocalDnsFirst enabled="false"` 意味着：只要域名没有命中
排除列表，Proxifier 就不会走本地 DNS，而是尝试通过代理解析——代理服务器当然不认识私有域名。
排除列表里只有 `*.local`，没有内网域名后缀，这个方向看起来很有说服力。

第一次修改却改错了地方：把内网域名后缀加进了 `RuleList` 里某条规则的 `Targets`（那是连接
路由规则，Direct/Proxy 二选一），而不是 `Options → Resolve` 里控制"域名解析是否走代理"的
`ExclusionList`——域名解析在连接路由匹配之前就已经失败，规则改了也没用。

修正到正确的位置后仍然不行；干脆完全退出 Proxifier 应用再测试，问题依旧存在。到这一步，
Proxifier 也被排除了。

## 真正的原因：mDNSResponder 的陈旧缓存

排除了两个代理工具之后，回到最基础的怀疑对象——本机 DNS 解析进程自身的缓存。

```bash
dscacheutil -flushcache
```

在近几个版本的 macOS 上，这条命令并不总能可靠地清掉 `mDNSResponder` 内部持有的解析结果，
必须直接让守护进程重新加载：

```bash
sudo killall -HUP mDNSResponder
```

执行后立刻复测：

```bash
❯ ping blog.example.internal
PING blog.example.internal (10.20.30.10): 56 data bytes
64 bytes from 10.20.30.10: icmp_seq=0 ttl=64 time=19.909 ms
64 bytes from 10.20.30.10: icmp_seq=1 ttl=64 time=11.723 ms

❯ dscacheutil -q host -a name blog.example.internal
name: blog.example.internal
ip_address: 10.20.30.10
```

问题解决，和 Surge、Proxifier、CoreDNS 配置都没有关系。

真正的原因是：`blog.example.internal` 是后加进 CoreDNS 的新记录，而 `nginx-ui.example.internal`
这类记录加入的时间更早。大概率是在这条新记录刚加入、split-dns 还没有完全生效的窗口期内，
`mDNSResponder` 已经对新名字做过一次失败查询并缓存了负面结果；而老记录当时早已缓存了正确
结果，所以一直"看起来没问题"，制造了"只有新东西解析不出来"的假象，把排查方向一路带偏到了
两个代理工具身上。

## 这次排查留下的判断顺序

以后再遇到"某个内网域名解析不出来，其他域名都正常"，会按这个顺序处理：

1. 先用 `dig @<DNS服务器IP> <域名>` 直接查权威 DNS，确认是服务端问题还是客户端问题，
   不要一上来就怀疑代理软件。
2. 拿同一个域名后缀下"早就存在、一直正常"的记录和"新加的、解析不出来"的记录做对比。如果
   真的是代理或路由层面的问题，两者应该同时失效；只有新记录失效，更可能是客户端缓存问题。
3. `dscacheutil -flushcache` 不一定够用，`sudo killall -HUP mDNSResponder` 才是更可靠的
   强制刷新方式。
4. 用 Proxifier 一类工具时，分清"域名解析是否走代理"（Resolve/ExclusionList）和"连接走
   Direct 还是走代理"（RuleList/Targets）是两个独立的配置面，改错地方不会生效，也不会报错，
   容易误以为"这个方向也不对"。
5. 新增内网 DNS 记录后，如果客户端之前已经查询过这个域名并失败过，最好主动做一次
   `sudo killall -HUP mDNSResponder`，而不是假设 `reload` 插件生效后客户端会自动更新。
