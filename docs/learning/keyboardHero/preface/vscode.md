---
title: VS Code 中使用 Vim
sidebar_position: 2
---

# VS Code 中使用 Vim

在 VS Code 中安装 VSCodeVim 扩展后，可以保留 VS Code 的补全、调试和 Git 功能，同时用 Vim 的 Normal、Insert、Visual 模式编辑代码。

## 适用范围

- 已安装 Visual Studio Code 的 macOS、Windows 或 Linux 用户。
- 希望先学习 Vim 编辑动作、暂时不想切换到纯终端编辑器的用户。

## 前置条件

准备好 VS Code，并能访问扩展市场。VSCodeVim 的扩展标识是 `vscodevim.vim`。

## 操作

1. 打开扩展视图：macOS 使用 `⇧⌘X`，Windows/Linux 使用 `Ctrl+Shift+X`。
2. 搜索 **Vim**，安装发布者为 **VSCodeVim** 的扩展，然后重新加载 VS Code 窗口。

也可以在已安装 `code` 命令行工具时执行：

```bash
code --install-extension vscodevim.vim
```

打开命令面板，选择 **Preferences: Open User Settings (JSON)**，加入下面的最小配置。若文件已有内容，只添加这些属性，不要重复最外层的 `{}`。

```json
{
  "vim.useSystemClipboard": true,
  "vim.leader": "<space>",
  "vim.insertModeKeyBindings": [
    {
      "before": ["j", "j"],
      "after": ["<Esc>"]
    }
  ]
}
```

- `vim.useSystemClipboard` 让复制和粘贴默认使用系统剪贴板。
- `vim.leader` 将 `<leader>` 设为空格，方便后续学习自定义映射。
- 插入模式连续输入 `jj` 会回到 Normal 模式；仍可随时使用 `Esc`。

### 处理快捷键冲突

VSCodeVim 默认会接管部分 `Ctrl`/`Cmd` 组合键。若希望某个快捷键继续由 VS Code 处理，在用户设置中加入 `vim.handleKeys`。例如保留 VS Code 的查找快捷键：

```json
{
  "vim.handleKeys": {
    "<C-f>": false
  }
}
```

`false` 表示把该组合键交还给 VS Code；其他按键仍由 Vim 模式处理。

## 验证

打开任意文本文件后：

1. 按 `Esc`，光标应显示为块状；此时按 `j`、`k`、`w` 只移动光标，不会输入文字。
2. 按 `i` 进入 Insert 模式并输入文字，再输入 `jj` 或按 `Esc` 返回 Normal 模式。
3. 选中一段文字后按 `y`，在其他应用中粘贴，确认系统剪贴板已生效。

## 相关内容

- [VSCodeVim 扩展说明与完整配置](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim)
- [VS Code 扩展市场使用说明](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)
- [Vim 起步](../vim/起步.md)
