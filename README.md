# Biulight 文档

本仓库维护 Biulight 项目的公开用户手册、实践指南与持续沉淀的知识，并使用 [Docusaurus](https://docusaurus.io/) 构建和发布。

访问线上站点：[blog.biulight.top/timeline](https://blog.biulight.top/timeline/)

## 内容结构

- `docs/products/`：产品安装、操作、配置和故障排查手册。
- `docs/knowledge/`：可跨项目复用的通用知识。
- `docs/developing/`：开发实践与文档维护说明。
- `docs/learning/`：个人学习记录。
- `blog/`：按时间发布的文章。

## 本地运行

需要准备以下环境：

- Node.js 22 或更高版本
- pnpm 11 或更高版本

`pnpm` 11 的最低支持 Node 版本为 22，因此本仓库统一按 Node.js 22+ 作为本地开发前提。

安装依赖并启动本地开发服务器：

```bash
pnpm install
pnpm start
```

生成生产构建：

```bash
pnpm build
```

修改 React、TypeScript、导航或主题代码后，还需要执行类型检查：

```bash
pnpm typecheck
```

## 维护文档

产品仓库是行为、命令、配置、兼容性和版本信息的事实来源；本仓库负责将这些信息组织成便于用户完成任务的公开文档。不要根据 issue、计划或 TODO 推测尚未发布的行为，也不要机械复制产品 README。

更新产品手册时：

1. 在 `.agents/projects.yml` 中确认产品仓库和上次审阅的版本。
2. 阅读产品仓库的 `AGENTS.md`，并检查上次审阅后发生的用户可见变化。
3. 对照当前命令定义、配置解析器、测试或发布产物核实文档内容。
4. 更新完成后运行 `pnpm build`；涉及 React、TypeScript、导航或主题时再运行 `pnpm typecheck`。
5. 更新 `.agents/projects.yml` 中对应产品的审阅提交与版本。

更完整的内容分类和更新流程见[文档维护指南](docs/developing/documentation.md)，AI 协作约束见 [AGENTS.md](AGENTS.md)。
