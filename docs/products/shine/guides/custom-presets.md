---
title: 自定义预设
sidebar_position: 4
---

# 自定义预设

少量个性化优先使用 overlay；需要完全维护一套预设时，再使用外部 `presets_dir`。

## 使用 Overlay 覆盖少量文件

Overlay 按相同相对路径覆盖基础预设，也可以增加新类别：

```bash
shine overlay link ~/dotfiles/shine-overlay --create
shine overlay show
shine overlay unlink
```

例如 `app/starship/starship.toml` 会覆盖基础来源中的同路径文件，其它预设继续沿用基础来源。

## 导出完整预设

```bash
shine link ~/dotfiles/shine-presets --create
shine export
```

配置外部目录后，`install`、`list` 和 `update` 都从该目录读取。命令输出会显示当前激活的预设来源。

也可以直接设置环境变量：

```bash
SHINE_PRESETS=~/dotfiles/shine-presets shine export
```

## 建立可提交的预设仓库

```bash
cd ~/dotfiles/shine-presets
shine init
```

该命令创建 `shine.config.toml`，将 `presets_dir` 设为当前目录。Shine 会从工作目录向上查找最近的项目配置，因此可在其子目录运行命令。非交互脚本可使用 `shine init --yes`。

## 拉取 Git 管理的来源

外部预设目录或 overlay 是 Git 工作区时，可以只拉取来源，或在检查、应用配置前拉取：

```bash
shine pull
shine update --pull
shine upgrade --pull
```

Shine 会定位基础预设和当前 overlay 所在的 Git 仓库；两个来源属于同一仓库时只拉取一次，非 Git 来源会跳过。`update --pull` 和 `upgrade --pull` 会在拉取后重新加载配置，因此仓库中更新的 `shine.config.toml` 也会在后续步骤生效。

拉取前，所有待处理仓库都必须满足以下条件：

- 工作区没有已跟踪或未跟踪的改动；
- 当前处于分支上，而不是 detached HEAD；
- 当前分支已经设置 upstream。

实际更新使用 `git pull --ff-only`。Shine 不会自动 stash、rebase、reset 或解决分支冲突；验证失败时会在修改任何仓库前停止。Git 不在 `PATH` 中时也无法使用这些命令。

## 新建类别元数据

在 app 或 shell 类别目录中生成 `shine.toml` 模板：

```bash
shine app init
shine shell init
```

已有文件时只有加上 `--force` 才会覆盖。类别格式属于预设作者接口，修改后应先使用对应的 `list`、`info` 和安装 `--dry-run` 验证。
