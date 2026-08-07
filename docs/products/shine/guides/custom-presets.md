---
title: 自定义预设
sidebar_position: 4
---

# 自定义预设

少量个性化优先使用 overlay；需要完全维护一套预设时，再使用外部 `presets_dir`。

## 使用 Overlay 覆盖少量文件

Overlay 按相同相对路径覆盖基础预设，也可以增加新类别：

```bash
shine preset overlay link ~/dotfiles/shine-overlay --create
shine preset overlay info
shine preset overlay unlink
```

例如 `app/starship/starship.toml` 会覆盖基础来源中的同路径文件，其它预设继续沿用基础来源。

### 使用 Git 镜像 Overlay

要让多台设备使用同一个只读 overlay 仓库，可由 Shine 管理其本地镜像：

```bash
shine preset overlay link --git https://example.com/team/shine-overlay.git --branch main
shine preset pull
shine preset overlay info
```

首次 `shine preset pull` 会在 `~/.shine/overlay/` 浅克隆仓库；以后会把该目录镜像到远端分支的最新状态。此目录是缓存，任何本地修改都会在下次拉取时丢失。请在仓库上游修改并推送，再在设备上运行 `shine preset pull`、`shine update --pull` 或 `shine upgrade --pull` 同步。

如果只想定制一个内置类别，可在 overlay 根目录复制该预设，无需导出整套内容。例如，Surge 的本地代理、策略组和规则文件应从内置预设复制后再修改：

```bash
cd ~/dotfiles/shine-overlay
shine preset copy app/surge
```

命令按 `app/<name>`、`shell/<name>` 或 `sys/<name>` 复制完整类别；已有文件时只有加 `--force` 才会覆盖。复制出的 overlay 仅覆盖保留的相对路径，因此可删除不需要定制的文件，让它们继续使用内置版本；Surge 的后续配置和安装步骤见[管理应用配置](./app-presets.md#surge-uri-订阅)。

## 导出完整预设

```bash
shine preset link ~/dotfiles/shine-presets --create
shine preset export
```

配置外部目录后，`install`、`list` 和 `update` 都从该目录读取。命令输出会显示当前激活的预设来源。

### 选择外部 Shell 的部署方式

外部 Shell 预设默认采用 **snapshot** 模式：安装时，Shine 会把有效类别复制到
`~/.shine/installed/shell/`，之后运行受管副本。编辑来源后先运行 `shine update` 检查，再运行
`shine upgrade` 应用；这让 Shell 脚本与 app 配置一样可以先审阅、再更新。旧版的直接链接安装会在
`update` 中报告，并在 `upgrade` 时迁移。

编写预设、希望反复测试源文件内容时，可在关联来源时显式启用 **live** 模式：

```bash
shine preset link ~/dotfiles/shine-presets --live
```

live 模式下，普通 Shell/Bun 源文件内容在下一次调用时直接生效。声明了 `transforms` 的文件会在每次
调用前原子渲染；渲染失败时该次调用会中止，不会继续运行旧输出。变更 `target`、`runtime`、
`transforms` 或 `env` 等入口元数据时，仍必须执行 `shine upgrade` 重建受管入口。要恢复默认行为，
重新执行不带 `--live` 的 `shine preset link <PATH>`，或执行 `shine preset unlink`。

也可以直接设置环境变量：

```bash
SHINE_PRESETS=~/dotfiles/shine-presets shine preset export
```

## 建立可提交的预设仓库

```bash
cd ~/dotfiles/shine-presets
shine init
```

该命令创建 `shine.config.toml`，将 `presets_dir` 设为当前目录。Shine 会从工作目录向上查找最近的项目配置，因此可在其子目录运行命令。非交互脚本可使用 `shine init --yes`。

## 拉取 Git 管理的来源

外部预设目录或手动链接的 overlay 是 Git 工作区时，可以只拉取来源，或在检查、应用配置前拉取：

```bash
shine preset pull
shine update --pull
shine upgrade --pull
```

Shine 会定位基础预设和当前 overlay 所在的 Git 仓库；两个来源属于同一仓库时只拉取一次，非 Git 来源会跳过。`update --pull` 和 `upgrade --pull` 会在拉取后重新加载配置，因此仓库中更新的 `shine.config.toml` 也会在后续步骤生效。

拉取前，所有待处理仓库都必须满足以下条件：

- 工作区没有已跟踪或未跟踪的改动；
- 当前处于分支上，而不是 detached HEAD；
- 当前分支已经设置 upstream。

这些来源实际使用 `git pull --ff-only`。Shine 不会自动 stash、rebase、reset 或解决分支冲突；验证失败时会在修改任何仓库前停止。上述限制不适用于 `--git` 管理的 overlay：它设计为可丢弃的远端镜像。Git 不在 `PATH` 中时也无法使用这些命令。

## 新建类别元数据

在 app 或 shell 类别目录中生成 `shine.toml` 模板：

```bash
shine preset new app
shine preset new shell
```

已有文件时只有加上 `--force` 才会覆盖。类别格式属于预设作者接口，修改后应先使用对应的 `list`、`info` 和安装 `--dry-run` 验证。

## 可选运行时的 Shell 入口

`runtime` 用于选择 Shell 预设命令入口的运行时，而不是新增交互式 shell。未声明时使用原生 `.sh` 或 `.ps1` 入口；当前唯一可选值是 `bun`。请在类别的 `shine.toml` 中显式声明：

```toml
[[files]]
source = "my-tool.ts"
target = "my-tool"
runtime = "bun"
platforms = ["unix", "windows"]
env = ["API_URL", "SERVICE_TOKEN=API_TOKEN"]
```

支持 `.ts`、`.js`、`.mts` 和 `.mjs`。安装后，Shine 会创建无扩展名的受管入口，用户仍以 `my-tool` 调用它；现有 `.sh` 和 `.ps1` 原生入口保持兼容。

运行这类命令的每台设备都必须已在 `PATH` 中安装 Bun。Shine 不会安装 Bun、下载依赖或解析 `node_modules`；`runtime = "bun"` 也不能与 `needs_source = true` 组合使用。

可选的 `env` 只适用于 Bun 入口。每项写成 `KEY` 或 `SOURCE=TARGET`；入口启动时会通过 `shine env run --no-workspace --with ...` 注入值，因此优先解密 `SOURCE_SECRET`，不存在时读取明文 `SOURCE`。声明 `env` 后，运行机器的 `PATH` 中还必须有 `shine`。不要在元数据中填写值或密文，只声明键名。

后续支持的运行时会在本节逐项记录其支持值、文件类型、前提条件和限制。Python、Node 与 Deno 目前均不可配置为 `runtime`。

## App 构建脚本运行时

App 类别的 `[artifact]` 也可选择 Bun，使 `build` 与 `unbuild` 脚本跨平台运行：

```toml
[artifact]
script = "build.ts"
teardown = "unbuild.ts"
runtime = "bun"
```

`runtime` 省略时为 `native`，直接执行脚本；`bun` 仅接受 `.ts`、`.js`、`.mts` 或 `.mjs`，并要求运行机器已安装 Bun。构建脚本会收到当前 Shine `[env]` 和 app 路径变量。若希望安装或升级实际改动文件后自动构建，可另外声明 `post_install`、`post_upgrade` 钩子；外部预设仍需用户设置 `allow_app_hooks = true`。
