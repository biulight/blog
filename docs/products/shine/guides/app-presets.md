---
title: 管理应用配置
sidebar_position: 2
---

# 管理应用配置

应用预设把配置文件安装到目标应用使用的位置，并通过 `~/.shine/app-manifest.toml` 记录受管文件。安装前遇到已有的非受管文件时，Shine 会先创建 `*.shine.bak` 备份。

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
shine install starship
shine update
shine upgrade
```

`shine update` 比较当前安装结果与预设，只报告状态；`shine upgrade` 将受管 shell 和应用配置更新到当前预设内容。

如果只需覆盖一个类别的受管文件：

```bash
shine app reinstall starship
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

