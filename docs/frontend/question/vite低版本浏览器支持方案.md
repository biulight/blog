---
sidebar_position: 20
id: 20
---

# Vite 兼容低版本浏览器

## 问题

Vue 3 项目使用 Vite 构建后，在较旧的浏览器中可能出现白屏，或在控制台看到如下报错：

- `Unexpected token`，例如无法解析 `?.`、`??` 等较新的语法；
- 不支持 `<script type="module">`、`import()` 或 `import.meta`；
- 首屏脚本没有加载，应用没有挂载。

本文适用于使用 Vite 构建的 Vue 3 Web 应用。目标是兼容仍满足 Vue 3 运行条件的旧版现代浏览器，而不是让 Vue 3 支持 IE11。

## 原因分析

兼容性问题通常来自三个层面，不能只靠一个构建选项解决：

1. **Vite 默认产物面向现代浏览器。**生产构建默认要求浏览器支持原生 ES Module、动态 `import()` 和 `import.meta`；开发服务器为了速度使用更高的语法目标，因此开发环境能打开不代表生产产物能在目标浏览器运行。
2. **语法降级与运行时能力是两回事。**将可选链等语法转换成旧语法，并不会自动补齐 `Promise`、`Array.prototype.flat`、`URL` 等浏览器 API。业务代码和第三方依赖使用的运行时 API 仍要按需评估并补充 polyfill。
3. **Vue 3 有自己的最低运行要求。**Vue 3 仅支持原生 ES2016 的浏览器，其中不包括 IE11；其使用的部分能力不能通过 polyfill 完整补齐。因此 `@vitejs/plugin-legacy` 可以为旧版现代浏览器生成兼容产物，但不能让 Vue 3 在 IE11 上可靠运行。

## 解决方案

### 1. 先确定支持矩阵

先与业务、数据和测试团队确认要覆盖的浏览器及最低版本，再写入构建配置。下面的示例使用 Browserslist 的默认覆盖范围并排除 IE11：

```ts
['defaults', 'not IE 11']
```

这只是通用起点，不应替代项目自己的兼容性承诺。`targets` 只定义 legacy bundle 的 Babel 转译目标和自动收集 ES 语言特性 polyfill 的范围；单独写这一行既不会启用插件，也不能补齐所有运行时能力。如果需要覆盖指定的企业浏览器版本，请将它们明确写进 `targets`，并用对应设备或云测平台验证。

### 2. 安装 Vite 官方 legacy 插件

安装与项目 Vite 主版本兼容的 `@vitejs/plugin-legacy`：

```bash
pnpm add -D @vitejs/plugin-legacy
```

### 3. 配置构建产物

在 `vite.config.ts` 中注册插件。插件会生成现代产物和供不支持原生 ES Module 的浏览器条件加载的 legacy 产物，并根据最终 bundle 的实际使用情况处理对应的 ES 语言特性 polyfill。

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
})
```

不要只设置 `build.target` 来尝试覆盖没有原生 ES Module 的浏览器：Vite 的最低运行假设仍然存在。需要这类兼容产物时，应使用 `@vitejs/plugin-legacy`。

### 4. 按需补充运行时 polyfill

legacy 插件不会替业务选择所有 Web API polyfill。排查白屏时，先确认报错的 API 来自业务代码、依赖还是浏览器平台：

- 对只在 legacy 浏览器缺失的 DOM API，可通过 `additionalLegacyPolyfills` 显式加入对应 polyfill；
- 对仍会执行现代 bundle 的浏览器，使用 `modernPolyfills` 指定所需的 `core-js` 条目；不要直接设为 `true`，自动检测可能引入不必要的 polyfill；
- 对 CSS 新特性、第三方组件和浏览器内核缺陷，需分别降级或替换，不能指望 JavaScript polyfill 解决。

只为实际需要且确认目标浏览器缺失的能力引入 polyfill，避免无差别增加首屏体积。

### 5. 用生产产物验证

```bash
pnpm build
```

构建完成后，执行以下检查：

1. 查看生成的 HTML 与 `dist` 目录，确认同时引用了现代和 legacy 相关资源。
2. 使用目标浏览器版本或云测平台打开部署后的生产产物，验证登录、首屏渲染、路由跳转和关键提交等核心路径。
3. 结合控制台报错逐项处理缺失的运行时 API、第三方组件兼容性和 CSS 特性。

Vite 开发服务器主要服务于现代开发浏览器，不能代替对生产构建产物的低版本浏览器验收。

## 总结

对于 Vue 3 项目，支持仍具备原生 ES2016 能力的旧版现代浏览器时，可使用 `@vitejs/plugin-legacy` 生成条件加载的兼容产物，并针对实际缺失的运行时 API 按需补充 polyfill。若需求明确要求 IE11，应调整技术选型或保留 Vue 2 方案，而不是承诺 Vue 3 可以通过构建配置兼容。

参考资料：[Vite 构建生产环境](https://vite.dev/guide/build)、[Vite 插件使用指南](https://vite.dev/guide/using-plugins.html)、[Vue 浏览器支持说明](https://vuejs.org/about/faq.html#what-browsers-does-vue-support)
