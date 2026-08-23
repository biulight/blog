---
title: 设计可复用的 GitHub Actions 流程
description: 为 Web、CLI 与桌面 App 设计可维护的 CI、部署、签名和 Release 流程
sidebar_position: 1
---

# 设计可复用的 GitHub Actions 流程

一套容易维护的 GitHub Actions 流程，应当让入口文件只回答“何时运行、发布到哪里”，把测试、构建、部署和发布等重复步骤放进可复用 workflow。常见执行链是：

```text
触发 → 预检或测试 → 构建 → 传递不可变产物 → 部署或发布 → 验证与清理
```

Web、CLI 和桌面 App 都能复用这条主线，但它们交付的对象不同。先选对发布模型，再决定怎样拆 Job；不要为了统一 YAML 而把平台签名、服务器部署和 GitHub Release 塞进同一个万能 workflow。

## 先选择发布模型

| 发布对象 | 主要产物 | 推荐触发 | 发布终点 | 适合的组织方式 |
| --- | --- | --- | --- | --- |
| Web 应用 | 一份静态资源归档 | `workflow_dispatch` 或受保护分支 | 一台或多台服务器 | 预检 → 构建一次 → 矩阵部署 → Release |
| 跨平台 CLI | 各目标平台的压缩包 | 正式版本标签 | GitHub Release 或包仓库 | 测试 → 构建矩阵 → 汇总资产 → Release |
| 桌面 App | 安装包、平台签名、updater 签名和更新清单 | 严格版本标签 | GitHub Release 或更新服务器 | 版本预检 → 原生平台构建 → 汇总 → 发布清单 |

Web 部署通常是在受控服务器上切换同一份构建产物；CLI 和桌面 App 则要把多个平台资产交付给用户。桌面 App 还多出平台证书、updater 签名和更新清单，不能简单视为“带界面的 CLI”。

## 按稳定职责拆分 workflow

入口 workflow 使用 `push`、`pull_request`、`schedule` 或 `workflow_dispatch` 接收事件，并决定环境、权限与执行顺序。可复用 workflow 使用 `workflow_call` 声明输入、输出和所需 Secrets，完成一项稳定职责。

| Workflow | 主要职责 | 不应负责 |
| --- | --- | --- |
| `ci.yml` | 选择触发分支并调用质量检查 | 部署和创建 Release |
| `reusable-test.yml` | 格式、静态检查、安全审计和测试 | 判断发布环境 |
| `reusable-build.yml` | 安装工具链、构建并上传产物 | 修改服务器状态 |
| `reusable-deploy.yml` | 下载既有产物并部署 | 重新构建源码 |
| `release.yml` | 校验版本、生成说明和发布资产 | 接受任意生产环境参数 |

同一份测试和构建逻辑可以被 Pull Request、预览版和正式版复用。调用方通过 `needs` 表达依赖；前一步失败时，部署或发布自然停止。

### 一个可裁剪的基础骨架

下面的测试 workflow 只接受仓库内其他 workflow 调用。顶层权限默认只读，需要创建标签、Release 或 Pull Request 时，再在调用 Job 中单独提升。

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

入口 workflow 只声明触发规则并调用它：

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

仓库内调用可复用 workflow 时使用相对路径，并把 `uses` 放在 Job 层级。调用 Job 不能再同时声明 `runs-on` 或 `steps`。调用方的 `GITHUB_TOKEN` 权限只能在被调用链中保持或收紧，不能由被调用 workflow 擅自提升。

## Web 应用：预检、构建一次、部署后发布

多环境 Web 应用通常有 `dev`、`uat`、`stage`、`prod`。环境名应通过类型为 `string` 的 input 传给可复用 workflow，而不是在脚本中根据分支反复猜测。

生产入口适合显式串联四个阶段：

```yaml title=".github/workflows/deploy-production.yml"
name: deploy-production

on:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  preflight:
    uses: ./.github/workflows/reusable-preflight.yml
    with:
      environment: production

  build:
    needs: preflight
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: production

  deploy:
    needs: build
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: production
      artifact_name: ${{ needs.build.outputs.artifact_name }}
    secrets:
      deploy_ssh_key: ${{ secrets.DEPLOY_SSH_KEY }}

  release:
    needs: [build, deploy]
    if: ${{ !cancelled() && needs.deploy.result == 'success' }}
    permissions:
      contents: write
    uses: ./.github/workflows/reusable-release.yml
    with:
      artifact_name: ${{ needs.build.outputs.artifact_name }}
```

预检应在构建前验证版本是否已更新、生产 Environment 是否完整、服务器列表能否解析，以及受保护审批是否通过。质量检查可以作为独立 `test` Job，或作为必须通过的分支保护检查；不能只假设“此前应该跑过 CI”。

### 生成可追踪的构建产物

构建 Job 只运行一次，并把产物名称作为 workflow output 返回。产物名至少包含环境和运行标识，避免并发运行互相覆盖。

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
        run: echo "name=web-${{ inputs.environment }}-${{ github.run_id }}-${{ github.run_attempt }}" >> "$GITHUB_OUTPUT"
      - uses: actions/upload-artifact@v7
        with:
          name: ${{ steps.meta.outputs.name }}
          path: dist/
          retention-days: ${{ inputs.retention_days }}
          if-no-files-found: error
```

部署和 Release 都下载这份产物，不能再次检出源码并重新构建。这样服务器上的版本、Release 附件和审计记录才指向相同字节。

### 使用 Environment 管理环境差异

GitHub Environment 适合存放环境级 Variables、Secrets 和审批规则：

- Variables 保存可公开的环境参数，例如区域、部署端口和目标路径。
- Secrets 保存私钥、令牌、证书和密码。
- Repository Variables 保存所有环境都相同的非敏感值。
- 不把 Secrets 转存为构建产物、缓存、Job output 或调试日志。

生产 Environment 应配置 required reviewers。手动触发只接受预先允许的环境；不要直接把任意用户输入拼进远程命令。环境 Secrets 由实际引用该 Environment 的 Job 读取，不能假设它们会自动穿过任意层级的可复用 workflow。

### 用矩阵部署到多台服务器

服务器清单可以保存在 Environment Variable 中，例如：

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

启用 `fail-fast` 能在一台服务器失败后尽快停止尚未开始的矩阵任务，但已经完成的节点不会自动回滚。生产部署必须配套以下一种方案：

- 上传到版本目录，完成健康检查后原子切换软链接；
- 保留上一版本并让部署脚本支持显式回滚；
- 由负载均衡器逐台摘除、部署、检查后重新加入。

不要直接在当前服务目录原地解压并假设矩阵失败会恢复所有节点。需要经过跳板机时，使用经过审计的 SSH Action 或 SSH 配置；跳板机地址、账号和私钥均来自受保护配置。

### Artifact 还是 runner 共享存储

| 方式 | 适合场景 | 主要代价 |
| --- | --- | --- |
| GitHub Artifact | 生产发布、不同 runner 传递、需要审计和下载 | 有上传下载时间和保留期限 |
| 自托管 runner 共享存储 | 同一受控存储域内的频繁开发部署 | Job 与基础设施耦合，需要自行隔离和清理 |

生产流程默认使用 Artifact。共享存储只适用于确定所有相关 runner 都能访问同一受控存储域的情况，并使用包含环境、仓库、`run_id` 和 `run_attempt` 的唯一目录：

```text
<shared-root>/<environment>__<repository>__<run_id>__<run_attempt>/
```

部署前检查产物存在且属于当前运行。清理任务先提供 `dry_run`，默认只处理当前仓库；跨仓库清理或对共享根目录递归删除都应视为高风险操作。workflow 和运维文档必须对生产究竟使用 Artifact 还是共享存储保持一致。

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
      if-no-files-found: error
```

交叉编译目标可能需要额外链接器。例如在 x86_64 Linux runner 上构建 Linux ARM64 时，需要安装对应的 GNU 交叉工具链，并设置 Cargo linker。不要假设添加 Rust target 就足以完成所有交叉编译。

预览版可以由 `schedule` 或 `workflow_dispatch` 触发，并复用独立的滚动 prerelease 标签；正式版应由不可移动的 SemVer 标签触发。生成 Release 说明或自动创建合并 PR 时，先查询是否已有相同目标；辅助步骤失败不应悄悄改写已经发布的正式标签。

## 桌面 App：原生构建、两类签名、统一发布

桌面 App 发布同时面对操作系统信任链和应用内更新协议。推荐的执行链是：

```text
严格版本预检
  ├─ Windows 原生构建与 updater 签名
  └─ macOS 原生/通用构建、代码签名与 updater 签名
          ↓
汇总平台 Artifact → 校验签名配对 → 生成更新清单 → 原子发布
```

### 发布前锁定版本

版本脚本应验证所有版本来源一致，例如 JavaScript workspace、Tauri 配置、`Cargo.toml` 和 `Cargo.lock`。标签触发时还要验证 `vMAJOR.MINOR.PATCH` 与应用版本完全一致；手动正式发布时，当前版本必须高于已有正式标签。

发布 workflow 不应自行“猜一个版本”或在构建后改版本文件。构建所用提交、标签、安装包名称和更新清单中的 `version` 必须一致。

### 平台差异大时使用独立 Job

CLI 的构建命令相似，适合矩阵；桌面 App 的平台准备和 Secrets 往往差异明显，使用独立 Job 更容易审计：

- Windows Job 使用 Windows runner，构建安装程序并生成 updater 包与 `.sig`。
- macOS Job 使用 macOS runner，导入临时 keychain，构建目标架构或 universal binary，并在 `if: always()` 的清理步骤删除临时 keychain。
- 每个 Job 使用独立的构建目录，尤其在 self-hosted runner 上避免不同运行共享 Cargo target、证书或安装包。
- 上传前明确检查预期的安装包和 updater 签名各自存在；不能只用宽泛 glob 后假设构建完整。

### 区分平台代码签名与 updater 签名

这两类签名解决不同问题：

| 签名 | 验证者 | 作用 |
| --- | --- | --- |
| 平台代码签名 | Windows 或 macOS | 验证安装包发布者并满足平台信任要求 |
| Tauri updater 签名 | 应用内 updater | 验证下载的更新包未被替换 |

设置 `TAURI_SIGNING_PRIVATE_KEY` 只能生成 updater 签名，不等于完成 Windows Authenticode、macOS Developer ID 签名或 Apple notarization。文档和上线清单应分别确认每一种能力；没有配置和产物证据时不要声称已经完成。

### 汇总产物并生成更新清单

平台 Job 使用不同 Artifact 名称，例如 `desktop-release-windows` 和 `desktop-release-macos`。发布 Job 下载并合并它们，然后对每个平台执行严格检查：

1. updater `.sig` 恰好匹配一个更新包；
2. 更新包文件实际存在；
3. 清单覆盖所有支持的 `target` 与 `arch`；
4. 清单中的相对路径指向当前版本目录；
5. 发布说明、版本和发布日期来自本次正式发布。

若 macOS 同时支持 Intel 和 Apple Silicon，可以分别发布两个包，也可以让两个架构指向同一个已验证的 universal 包。不要让缺少某个平台的清单仍被标记为成功。

### 选择发布终点

| 终点 | 做法 | 适合场景 |
| --- | --- | --- |
| GitHub Release | 由发布 Job 创建 Release、上传安装包并生成 updater JSON | 公共分发或直接使用 GitHub 更新源 |
| 自建更新服务器 | 上传到不可变版本目录，再原子替换 `latest.json` | 需要鉴权、授权下载或自定义更新 API |

自建服务器发布时，先上传到包含 `run_id` 和 `run_attempt` 的临时目录；验证完成后移动到版本目录，最后才原子替换 `latest` 清单。旧版本目录应保留到超过回滚窗口。上传失败时不能留下指向不完整版本的新清单。

更新服务器程序本身的部署应使用独立 workflow：构建和测试服务端二进制、上传临时文件、运行数据库迁移、原子替换程序、重载服务管理器并执行健康检查。客户端每次 Release 不应顺带重复迁移或重启更新服务。

## 安全性与稳定性

### 最小权限

顶层先设置只读权限：

```yaml
permissions:
  contents: read
```

创建标签或 GitHub Release 的 Job 通常需要 `contents: write`；创建 Pull Request 的 Job 才需要 `pull-requests: write`。没有发布 Pages 或使用 OIDC 时，不应授予 `pages: write` 或 `id-token: write`。来自 fork 的 Pull Request 不应获得生产 Secrets，也不应直接部署。

### 固定依赖版本

第三方 Action 至少固定到明确的主版本，并通过依赖更新工具持续升级。对生产签名和部署等高风险步骤，优先固定到审核过的完整提交 SHA，同时保留版本注释。不要使用浮动的 `main`、`master` 或 `latest`。

### 缓存不是产物

缓存用于加速可重新生成的依赖，键应包含操作系统、工具链和锁文件哈希。构建产物必须通过 Artifact 或受控共享存储传递，不能依赖缓存命中。任何 Job 都应能在缓存完全失效时正确执行。

### 并发与失败处理

生产部署和正式桌面发布使用稳定的 concurrency group，并设置 `cancel-in-progress: false`。已经开始修改服务器或发布清单的任务不应被新运行强制取消。

清理临时 SSH 密钥、证书、keychain 和工作目录的步骤使用 `if: always()`。清理失败应可见，但不能覆盖真正的构建或部署错误。自托管 runner 还要定期检查工作目录、构建缓存和证书是否残留。

## 上线检查清单

- 入口 workflow 的分支、严格版本标签、定时任务和手动参数符合预期。
- 可复用 workflow 的 inputs、outputs 和 secrets 声明完整，调用链权限只会保持或收紧。
- 质量检查成功后才能构建，构建成功后才能部署或发布。
- 同一份不可变产物贯穿服务器部署、Release 和更新清单。
- Environment 已配置审批、Variables、Secrets 和最小权限。
- 生产并发不会取消已经开始的部署或发布。
- Web 多节点部署具有健康检查、原子切换或明确回滚方法。
- Artifact 与共享存储的实际选择和运维文档一致，清理任务默认限制在当前仓库。
- CLI 与桌面 App 覆盖所有支持平台，并验证文件名、可执行权限和归档内容。
- 桌面 App 分别验证平台代码签名、updater 签名以及签名与安装包的配对。
- 正式标签不可覆盖；创建 Release、更新 `latest` 清单或自动 PR 前检查重复项。
- 自托管 runner 不残留 SSH 私钥、证书、临时 keychain 或未隔离的发布产物。
