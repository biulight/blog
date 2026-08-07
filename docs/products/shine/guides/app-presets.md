---
title: 管理应用配置
sidebar_position: 2
---

# 管理应用配置

应用预设把配置文件安装到目标应用使用的位置，并通过 `~/.shine/app-manifest.toml` 记录受管文件。安装前遇到已有的非受管文件时，Shine 会先创建 `*.shine.bak` 备份。

它们只管理配置文件，不安装、下载或启动对应应用。所有内置类别的目标路径、平台限制、权限与重启要求见[内置预设](../reference/built-in-presets.md#app-预设)。

## 查看与预览

```bash
shine app list
shine app info starship
shine app install starship --dry-run
```

涉及系统目录的预设可能需要额外权限。先使用 `--dry-run` 确认目标路径和变更范围。

## 安装与更新

```bash
shine app install starship
shine install app/starship
shine update
shine upgrade
```

`shine update` 比较当前安装结果与预设，只报告状态；`shine upgrade` 将受管 shell 和应用配置更新到当前预设内容。

如果只需覆盖一个类别的受管文件：

```bash
shine app install starship --replace-managed
```

## 卸载与恢复

```bash
shine app uninstall starship --dry-run
shine app uninstall starship
shine app uninstall starship --purge
```

默认情况下，安装后被用户修改过的文件会保留并标记为用户修改。若安装时创建过备份，安全卸载会恢复原文件。`--purge` 还会删除相应预设目录；卸载全部类别时也会删除 manifest。

## 配置变换

部分预设会在安装前处理源文件，例如：

- `jsonc-to-json`：移除 JSONC 注释和尾随逗号，再写入标准 JSON。
- `template`：用当前 `[env]` 值替换 `@@VAR_NAME@@`。
- `json-merge` 安装模式：只维护目标 JSON 中声明的顶层键，保留其它用户设置。

`shine update` 比较的是变换后的最终结果，而不是原始预设文件。

## 生成式文件与 Surge URI 订阅

App 预设可以为 `[[files]]` 声明 generator，把命令的 UTF-8 stdout 作为该受管文件的预期内容。生成结果仍经过正常的变换、hash、manifest、用户修改保护和卸载流程，不应由脚本绕过 Shine 直接改写目标文件。

生成器可分为自动和手动两类。自动生成器可参与安装、只读状态检查和升级；`auto = false` 的手动生成器不会在 `list`、`info`、`update` 或 `upgrade` 中运行，需显式刷新已经安装的生成式文件：

```bash
shine app refresh <CATEGORY>
shine app refresh <CATEGORY> <SOURCE_FILE>
```

指定文件时，`SOURCE_FILE` 是预设 `[[files]].source` 的相对路径。刷新失败会保留上次成功内容；目标已被用户修改时也会保留，只有确认要覆盖时才添加 `--force`。安装和带 `--replace-managed` 的修复安装会运行已由 `when_env` 启用的生成器，不受 `auto` 设置影响。

外部预设或 overlay 提供的 generator 属于可执行代码，需要设置 `allow_app_hooks = true`。Shine 只向它传入预设显式声明的 env 值及固定的 `SHINE_APP_*` 路径变量，并限制执行时间和输出大小；仍应只运行自己审阅和信任的预设。

### Surge URI 订阅

内置 `surge` 预设可把 HTTPS Base64 URI 订阅转换为受管的 `subscription-proxies.conf`。此功能需要 Bun，支持兼容的 `ss://` 和 `vmess://` 记录；VLESS、不支持的 transport、插件、坏记录与重复项会被跳过，并只输出不含凭据的摘要。用户维护的 `local-proxies.conf` 不会被改写。

要定制 Surge 的本地代理、策略组或规则文件，先将完整内置预设复制到自己的局部 overlay：

```bash
mkdir -p ~/dotfiles/shine-overlay
cd ~/dotfiles/shine-overlay
shine preset copy app/surge
shine preset overlay link .
```

编辑复制出的 `app/surge/local-proxies.conf`、`local-proxy-groups.conf` 或 `local-rules.conf`，再安装预设。只打算定制其中部分文件时，可以删除其余复制出的文件：overlay 按相对路径覆盖，缺失的文件会继续使用内置版本并随 Shine 更新。不要直接修改 Surge Profiles 目录中的受管副本。

先配置 URL 并安装：

```bash
shine env set SURGE_SUBSCRIPTION_URL 'https://provider.example/subscription?...'
shine app install surge
```

该生成器为手动模式，日常 `shine update` 和 `shine upgrade` 不会访问订阅。需要刷新时，先打开 provider 的访问窗口，再运行：

```bash
shine app refresh surge subscription-proxies.conf
```

刷新成功且内容变化后会通过现有 `post_upgrade` 钩子 reload Surge；失败时保留上次成功文件。`local-proxy-groups.conf` 中的 `Subscription` 组通过 `policy-path=subscription-proxies.conf` 读取节点，其它策略组可用 `include-other-group=Subscription` 纳入这些节点。

## 构建辅助资源

部分 app 预设会在 `shine.toml` 的 `[artifact]` 中声明脚本。需要生成或刷新这类资源时，手动运行：

```bash
shine app artifact apply surge
```

Shine 不会隐式运行 artifact；预设可通过生命周期钩子在安装或升级实际改动文件后调用 `app artifact apply`。手动应用失败会让命令直接失败。脚本可读取当前 `[env]` 值和 `SHINE_APP_HTTP_DIR`、`SHINE_CACHE_DIR`、`SHINE_STATE_DIR` 等路径变量，适合生成放在 `~/.shine/http/app/<APP_ID>/` 下的本地资源。完整变量说明见[任务与本地服务](./tasks-and-serve.md)。

内置 `surge` app 预设会把 `local-proxies.conf`、`local-proxy-groups.conf`、`local-rules.conf` 和可选的订阅生成文件安装到 Surge Profiles 目录。设置 `[env]` 中的 `SURGE_PROFILE` 后，`shine app artifact apply surge` 使用内置 Bun artifact 幂等修补活动配置文件的 `[Proxy]`、`[Proxy Group]` 与 `[Rule]` `#!include` 行。Overlay 只需覆盖自己的策略文件，无需提供构建脚本。

预设还安装默认注释、不立即生效的 `LAN Network`、`LAN PROXY` 和 `Other Direct` 规则示例。每类规则在 `local-rules.conf` 中提供三种互斥来源：随 Profile 安装的相对 `rules/*.list`、同设备 loopback HTTP 地址，或自行替换域名的远程 HTTPS 地址。每类只启用一种；相对文件通常最简单。`localhost` 始终指运行 Surge 的设备，在 iOS 上不会指向另一台局域网主机。

需要撤销这项修补时运行：

```bash
shine app artifact remove surge
```

`artifact remove` 只运行预设声明的 `teardown` 脚本。卸载带有 teardown 的 app 时，Shine 也会尽力执行清理；清理失败只会警告，仍会继续安全卸载受管文件。

### Clash Verge Rev

内置 `clash-verge` 预设提供一个默认无效果的 `merge.yaml` 示例。要叠加自己的代理、策略组、rule-provider 和前置规则，先将完整内置预设复制到自己的局部 overlay：

```bash
mkdir -p ~/dotfiles/shine-overlay
cd ~/dotfiles/shine-overlay
shine preset copy app/clash-verge
shine preset overlay link .
```

这会创建 `app/clash-verge/`，其中包含当前 Shine 版本附带的 `merge.yaml`、元数据和构建脚本。编辑其中的 `app/clash-verge/merge.yaml`，填入实际配置；不要直接修改 `~/.shine/clash-verge/`，该目录是 Shine 安装后的受管副本。只打算定制 `merge.yaml` 时，可以删除复制出的其它文件：overlay 按相对路径覆盖，缺失的文件会继续使用内置版本并随 Shine 更新。

确认内容后安装预设：

```bash
shine app install clash-verge
```

首次使用时，在 Clash Verge Rev 当前订阅中依次打开并保存 **Extend Config**、**Edit Rules**、**Edit Proxies**、**Edit Groups** 四个订阅级编辑器，然后运行：

```bash
shine app artifact apply clash-verge
```

Shine 只读取 `profiles.yaml` 定位这些绑定文件，不会修改订阅、创建绑定或写入远端订阅 YAML。构建写入新内容后，在 Clash Verge Rev 中重新选择一次订阅，再运行构建即可请求立即刷新 rule-provider。

示例沿用上述三类流量，并为 rule-provider 提供三套互斥布局：mihomo `HomeDir` 内的 `type: file`、同设备的 loopback HTTP 服务，或远程 HTTPS 服务。选择一整套 provider 后，还需同步启用对应策略组与 `prepend-rules`。mihomo 默认限制 file provider 路径，Shine 不会把规则偷偷复制进 Clash Verge Rev 的私有目录；loopback 或私有服务的 `proxy: DIRECT` 只控制 provider 下载，如服务器只能经代理访问，应删除或调整它。私有域名依赖系统 split DNS 时，还需配置 mihomo 自己的 `dns.nameserver-policy`。

该 artifact 使用 Bun，运行机器必须已安装 Bun。预设的安装和升级钩子会在 `merge.yaml` 发生变化后自动再次调用构建；外部预设需要启用 `allow_app_hooks`。即时刷新还可使用 `[env]` 中的 `CLASH_CONTROLLER_URL` 和 `CLASH_CONTROLLER_TOKEN`；未配置 URL 时只跳过立即刷新，provider 仍按自身 interval 更新。控制器令牌不要写入 overlay 或文档。

`shine app artifact remove clash-verge` 不会清除 Clash Verge Rev 自己保存的订阅绑定；完全移除时还需在应用中手动清空上述四个编辑器。

## 生命周期钩子

预设作者可以声明 `post_install` 和 `post_upgrade` 钩子：前者在安装实际写入文件后运行，后者只在 `shine upgrade` 实际更新该类别至少一个文件后运行；未变化的类别不会触发。

外部预设中的钩子和 generator 需要在配置中显式允许：

```toml
allow_app_hooks = true
```

钩子默认不显示 stdout；只有预设将 `show_output` 设为 `true` 时，成功输出才会作为提示显示。钩子失败会显示警告，但不会中断其它类别的安装或升级。
