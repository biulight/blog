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

## 新建类别元数据

在 app 或 shell 类别目录中生成 `shine.toml` 模板：

```bash
shine app init
shine shell init
```

已有文件时只有加上 `--force` 才会覆盖。类别格式属于预设作者接口，修改后应先使用对应的 `list`、`info` 和安装 `--dry-run` 验证。

