---
title: 在 macOS 中使用 Karabiner-Elements
sidebar_position: 5
---

# 在 macOS 中使用 Karabiner-Elements

[Karabiner-Elements](https://karabiner-elements.pqrs.org/) 是 macOS 的系统级键盘定制工具。它可以把按键映射为其他按键或组合键，也可以根据应用、键盘设备和按键状态应用不同规则。

## 是否需要安装

Karabiner-Elements 不是所有 Mac 用户都必须安装的软件。

以下场景建议安装：

- 把 `Caps Lock` 改成 `Escape`、`Control` 或 Hyper Key。
- 在多个应用中统一使用一套快捷键。
- 使用复杂组合键、按键连击或按键长按规则。
- 针对内置键盘和外接键盘分别设置键位行为。

如果你只是在 VS Code、JetBrains、Obsidian 等应用中使用 Vim 模式，或者暂时使用 macOS 默认键位，可以先跳过本页。

### 如果你使用 HHKB

如果你使用的是支持键位自定义的 HHKB，例如 HHKB Studio、Professional HYBRID 或 HYBRID Type-S，可以优先使用 HHKB 官方的 Keymap Tool，在键盘侧完成常用键位调整，不一定需要安装 Karabiner-Elements。需要注意的是，HHKB Professional Classic 系列不支持通过 Keymap Tool 自定义键位，具体能力请以你的型号和官方说明为准。

可以在 [HHKB 官方下载页面](https://happyhackingkb.com/download/) 获取对应型号的 Keymap Tool 和说明文档。使用 HHKB 时，优先通过键盘自身的 Keymap Tool 完成常用改键，可以减少对 Karabiner-Elements 的依赖。

## 安装与权限

请从 [Karabiner-Elements 官方网站](https://karabiner-elements.pqrs.org/) 下载适合当前 macOS 版本的安装包。安装完成后打开 Karabiner-Elements Settings，按照页面提示在系统设置中启用所需权限。

根据 macOS 版本和 Karabiner-Elements 版本，可能需要允许以下项目：

- 后台服务持续运行。
- 辅助功能权限，用于读取当前应用并处理键盘事件。
- 输入监控权限。
- Karabiner DriverKit 虚拟键盘和鼠标的系统扩展。

这些权限是系统级修改键盘输入所需的能力。若不希望授予这类权限，可以继续使用应用内的 Vim 模式，而不安装 Karabiner-Elements。

## 基础验证

安装并完成权限设置后，可以先使用下面这组适合 Vim 工作流的映射验证是否正常工作：

1. 打开 Karabiner-Elements Settings 的 **Simple Modifications**。
2. 为当前使用的键盘添加一个简单映射：将 `Caps Lock` 映射为 `Control`。
3. 在 **Complex Modifications** 中添加规则，将 `Control + [` 映射为 `Escape`。这样可以用左手小指附近的组合键退出 Vim 的 Insert 模式，也不必频繁移动到键盘左上角。
4. 打开文本编辑器，先确认 `Caps Lock` 能作为 `Control` 使用，再确认 `Control + [` 能产生 `Escape` 的效果。
5. 如果映射没有生效，打开 Karabiner-EventViewer，确认系统能够识别当前键盘和按键事件。

先验证简单映射，再逐步添加复杂规则。复杂规则可能会改变系统范围内的输入行为，启用前应确认规则的适用设备和应用范围。

## 相关内容

- [Karabiner-Elements 官方功能说明](https://karabiner-elements.pqrs.org/docs/getting-started/features/)
- [Karabiner-Elements 官方安装说明](https://karabiner-elements.pqrs.org/docs/getting-started/installation/)
- [Vim 起步](../vim/起步.md)
- [VS Code 中使用 Vim](vscode.md)
- [JetBrains IDE 中使用 Vim](jetbrains.md)
