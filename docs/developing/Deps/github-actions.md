---
title: 设计可复用的 GitHub Actions 流程
description: 为 Web 应用和跨平台 CLI 设计可维护的 CI、构建、部署与 Release 流程
sidebar_position: 1
---

# 设计可复用的 GitHub Actions 流程

一套容易维护的 GitHub Actions 流程，应当让入口文件只负责回答“何时运行、发布到哪里”，把测试、构建、部署和发布等重复步骤放进可复用 workflow。最终得到的执行链通常是：

```text
触发 → 预检或测试 → 构建 → 传递产物 → 部署或发布 → 清理
```

本文适合需要维护多环境 Web 应用或多平台 CLI 的项目。示例提炼自真实项目，但使用通用名称和占位符，不依赖特定服务器。

## 先划分 workflow 的职责

入口 workflow 使用 `push`、`pull_request`、`schedule` 或 `workflow_dispatch` 接收事件，并决定环境、权限与执行顺序。可复用 workflow 使用 `workflow_call` 声明输入、输出和所需 Secrets，完成一项稳定职责。

推荐按以下边界拆分：

| Workflow | 主要职责 | 不应负责 |
| --- | --- | --- |
| `ci.yml` | 选择触发分支并调用测试 | 部署和创建 Release |
| `reusable-test.yml` | 格式检查、静态检查、安全审计、测试 | 判断发布环境 |
| `reusable-build.yml` | 安装工具链、缓存依赖、构建并上传产物 | 修改服务器状态 |
| `reusable-deploy.yml` | 下载已构建产物并部署 | 重新构建源码 |
| `release.yml` | 响应版本标签、生成说明、发布资产 | 接受任意环境参数 |

这样拆分后，同一份测试和构建逻辑可以被 Pull Request、预览版和正式版复用。调用方通过 `needs` 表达依赖；前一步失败时，后续部署或发布会自然停止。

## 一个可裁剪的基础骨架

下面的测试 workflow 只接受仓库内其他 workflow 调用。`permissions` 默认设为只读，需要写入 Release 或 Pull Request 时，再在入口或具体 Job 中单独提升。

```yaml title=".github/workflows/reusable-test.yml"
name: reusable-test

on:
  workflow_call:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
        with:
          version: 10
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

入口 workflow 只声明触发规则，并调用它：

```yaml title=".github/workflows/ci.yml"
name: ci

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    uses: ./.github/workflows/reusable-test.yml
```

仓库内调用可复用 workflow 时使用相对路径，并把 `uses` 放在 Job 层级。调用 Job 不能再同时声明 `runs-on` 或 `steps`。

## Web 应用：构建一次，再部署

Web 应用通常有 `dev`、`uat`、`stage`、`prod` 等环境。环境名应通过类型为 `string` 的 input 传给可复用 workflow，而不是在脚本中根据分支反复猜测。

```yaml title=".github/workflows/reusable-build.yml"
name: reusable-build

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      retention_days:
        required: false
        type: number
        default: 2
    outputs:
      artifact_name:
        value: ${{ jobs.build.outputs.artifact_name }}

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    outputs:
      artifact_name: ${{ steps.meta.outputs.name }}
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
        with:
          version: 10
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build:${{ inputs.environment }}
      - id: meta
        run: echo "name=web-${{ inputs.environment }}-${{ github.run_id }}" >> "$GITHUB_OUTPUT"
      - uses: actions/upload-artifact@v6
        with:
          name: ${{ steps.meta.outputs.name }}
          path: dist/
          retention-days: ${{ inputs.retention_days }}
          if-no-files-found: error
```

### 使用 Environment 管理环境差异

GitHub Environment 适合存放环境级 Variables、Secrets 和审批规则。建议按以下方式分工：

- Variables 保存可公开的环境参数，例如区域、部署端口和目标路径。
- Secrets 保存私钥、令牌、证书和密码。
- Repository Variables 保存所有环境都相同的非敏感值。
- 不把 Secrets 转存为构建产物、缓存、Job output 或调试日志。

生产 Environment 应配置 required reviewers。手动触发只能选择预先允许的环境，并在预检中验证版本号、必需配置和目标服务器列表；不要直接把任意输入拼接进远程命令。

### 用矩阵部署到多台服务器

构建 Job 上传一个不可变产物，部署 Job 再按服务器矩阵展开。服务器清单可以保存在 Environment Variable 中，例如：

```json
[{"name":"web-a","host":"web-a.example.com","user":"deploy"}]
```

```yaml
strategy:
  fail-fast: true
  max-parallel: 2
  matrix:
    server: ${{ fromJSON(vars.DEPLOY_SERVERS) }}
```

启用 `fail-fast` 可在一台服务器部署失败后尽快停止其他矩阵任务。若业务要求所有节点都尝试部署，再改为 `false`，并另行设计失败节点的摘除和回滚方案。

需要经过跳板机时，使用 SSH Action 的代理参数或经过审计的 SSH 配置。跳板机地址、账号和私钥均应来自 Secrets 或受保护的 Variables，不要写进 YAML。

### Artifact 还是 runner 共享存储

| 方式 | 适合场景 | 主要代价 |
| --- | --- | --- |
| GitHub Artifact | 生产发布、不同 runner 之间传递、需要审计和下载 | 有上传下载时间和存储期限 |
| 自托管 runner 共享存储 | 同一受控 runner 池内的频繁开发部署 | Job 与机器耦合，需要自行隔离和清理 |

生产流程优先使用 Artifact。共享存储只能用于确定会落到同一受控存储域的自托管 runner，并使用包含环境、仓库、`run_id` 和 `run_attempt` 的唯一目录，例如：

```text
<shared-root>/<environment>__<repository>__<run_id>__<run_attempt>/
```

部署前必须检查产物存在且属于当前运行。清理任务先提供 `dry_run`，默认只清理当前仓库，生产产物的保留时间应长于非生产产物。跨仓库删除或对共享根目录执行递归删除都应视为高风险操作。

## CLI：测试后进行多平台打包

跨平台 CLI 适合把目标平台、runner、产物名和二进制名放进矩阵。每个矩阵任务只生成一个平台资产，Release Job 最后统一下载。

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - runner: ubuntu-latest
        target: x86_64-unknown-linux-gnu
        asset: linux-x86_64
        binary: tool
      - runner: macos-14
        target: aarch64-apple-darwin
        asset: darwin-aarch64
        binary: tool
      - runner: windows-latest
        target: x86_64-pc-windows-msvc
        asset: windows-x86_64
        binary: tool.exe

runs-on: ${{ matrix.runner }}
steps:
  - uses: actions/checkout@v6
  - run: rustup target add ${{ matrix.target }}
  - run: cargo build --release --target ${{ matrix.target }}
  - uses: actions/upload-artifact@v7
    with:
      name: ${{ matrix.asset }}
      path: dist/*.tar.gz
```

交叉编译目标可能需要额外链接器。例如在 x86_64 Linux runner 上构建 Linux ARM64 时，需要安装对应的 GNU 交叉工具链，并设置 Cargo linker 环境变量。不要假设添加 Rust target 就足以完成所有交叉编译。

### 区分预览版与正式版

推荐保留两个清晰入口：

- 预览版由 `schedule` 或 `workflow_dispatch` 触发。先比较预览标签与当前提交，没有新提交时跳过自动构建。
- 正式版由符合 `v*` 或更严格 SemVer 模式的标签触发。必须先通过测试，再构建所有平台资产并创建 GitHub Release。

预览版可以复用固定标签和 prerelease，但强制移动标签会改变已有引用。执行前应确认它只代表滚动预览，使用独立名称，并把 `contents: write` 限制在发布 Job。正式版本标签不应被覆盖或复用。

Release 说明可以从 Conventional Commits 或既有标签生成。生成器配置应提交到仓库，发布前检查输出只包含当前版本变化。自动创建“发布分支合并回主分支”的 Pull Request 时，应先查询是否已有相同 head/base 的开放 PR；若仓库未允许 Actions 创建 PR，发布本身不应因此回滚。

## 安全性与稳定性

### 最小权限

顶层先设置只读权限，再按需增加：

```yaml
permissions:
  contents: read
```

创建 Release 或标签通常需要 `contents: write`；创建 Pull Request 通常需要 `pull-requests: write`。不要为了省事使用覆盖面更大的写权限。来自 fork 的 Pull Request 不应获得生产 Secrets，也不应直接执行部署。

### 固定依赖版本

第三方 Action 至少固定到明确的主版本，并通过依赖更新工具持续升级。对生产签名和部署等高风险步骤，优先固定到审核过的完整提交 SHA，同时保留版本注释。不要使用浮动的 `main`、`master` 或 `latest` 引用。

### 缓存不是产物

缓存用于加速可重新生成的依赖，键应包含操作系统、工具链和锁文件哈希。构建产物必须通过 Artifact 或受控共享存储传递，不能依赖缓存命中。任何 Job 都应能在缓存完全失效时正确执行。

### 并发与失败处理

为环境部署设置 concurrency，避免同一环境的两个版本交错写入：

```yaml
concurrency:
  group: deploy-${{ inputs.environment }}
  cancel-in-progress: false
```

生产部署通常不应取消已经开始的运行。清理临时密钥、临时 keychain 或工作目录的步骤使用 `if: always()`，但不要让清理失败掩盖真正的构建或部署错误。

## 上线检查清单

- 入口 workflow 的分支、标签、定时任务和手动参数符合预期。
- 可复用 workflow 的 inputs、outputs 和 secrets 都声明了类型与必需性。
- 测试成功后才能构建，构建成功后才能部署或发布。
- 同一份产物贯穿部署和 Release，没有在部署 Job 中重新构建。
- Environment 已配置审批、Variables、Secrets 和最小权限。
- 产物不存在时立即失败，保留时间符合审计与回滚要求。
- 多平台矩阵覆盖支持的平台，并验证归档内的二进制名称和可执行权限。
- 生产部署设置 concurrency，并准备健康检查与回滚方式。
- 预览标签可被移动，正式标签不可覆盖；自动 PR 会检查重复项。
- 自托管 runner 不残留私钥、证书或临时 keychain，共享存储有安全的预览和清理策略。

## 后续：桌面 App 发布

桌面 App 还需要处理平台证书、代码签名、Tauri updater 签名、安装包上传和更新清单合并。这些步骤与通用 CI 的安全边界不同，应在 `docs/products/lumeport/guides/` 中单独编写 Lumeport 发布指南，并覆盖版本准备、macOS 与 Windows 自托管 runner、更新服务器部署、数据库迁移、systemd 重启、回滚及发布后验证。

正式维护该产品指南时，应以 Lumeport 当前发布代码和产物为准，并同步更新 `.agents/projects.yml` 中的审阅提交与版本；本文不记录产品审阅状态。
