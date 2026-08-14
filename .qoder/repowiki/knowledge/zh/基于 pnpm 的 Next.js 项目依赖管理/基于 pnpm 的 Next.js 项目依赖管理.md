---
kind: dependency_management
name: 基于 pnpm 的 Next.js 项目依赖管理
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - pnpm-lock.yaml
    - pnpm-workspace.yaml
    - next.config.js
    - postcss.config.js
    - THIRD_PARTY_NOTICES.md
---

## 1. 使用的系统/方法

该项目使用 **pnpm**（版本 `10.34.5`，通过 `package.json` 中的 `packageManager` 字段锁定）作为包管理器，采用单仓、单工作区模式。依赖声明集中在根级 `package.json` 中，分为 `dependencies`（运行时依赖）和 `devDependencies`（开发时依赖）两类。

构建与解析方面：
- 启用 esbuild 与 unrs-resolver（通过 `pnpm-workspace.yaml` 的 `allowBuilds`），加速构建。
- 通过 `peerDependencyRules.allowedVersions` 显式允许 ESLint 生态插件使用 `eslint@10`，解决 peer dependency 冲突。
- PostCSS 配置仅引入 `@tailwindcss/postcss`，配合 Tailwind CSS v4。

## 2. 关键文件

- `package.json`：声明所有第三方依赖、脚本命令及 `packageManager` 锁定版本。
- `pnpm-lock.yaml`：pnpm 生成的锁文件，确保安装可重现。
- `pnpm-workspace.yaml`：定义 workspace 行为（允许 esbuild/unrs-resolver、peer dependency 规则）。
- `next.config.js`：Next.js 配置（当前为空对象，无额外依赖注入）。
- `postcss.config.js`：PostCSS 插件注册，仅包含 Tailwind v4。
- `THIRD_PARTY_NOTICES.md`：记录项目中内联引用的第三方组件（如 React Bits Liquid Ether）及其许可证信息。

## 3. 架构与约定

- **单一工作区**：仓库是单个 Next.js 应用，没有子 workspace，所有依赖在根 `package.json` 中集中管理。
- **依赖分类清晰**：运行时依赖（如 next、react、tailwindcss、motion、zod、zustand、remark/rehype 生态等）与开发依赖（typescript、eslint、prettier、@types/*）严格区分。
- **版本策略**：大部分依赖使用 `^` 语义化版本范围，便于自动升级；少数核心依赖（如 `next`、`react`、`react-dom`、`eslint-config-next`）保持精确或较窄范围以保障兼容性。
- **私有/内部模块**：无私有 npm registry 配置，所有依赖来自公共 npm registry。
- **无 vendoring**：未使用 `vendor/` 目录或 git subtree 方式内联第三方源码；唯一例外是 `components/backgrounds/liquid-ether.tsx` 直接内联了 React Bits 的 Liquid Ether 组件代码，并在 `THIRD_PARTY_NOTICES.md` 中记录了其 MIT + Commons Clause 许可证。
- **字体资源**：自定义字体（CalSans、Inter）以二进制文件形式存放在 `assets/fonts/`，不属于 npm 依赖范畴。

## 4. 约定与约束

- **包管理器锁定**：`package.json` 中声明 `"packageManager": "pnpm@10.34.5"`，要求团队统一使用指定版本的 pnpm。
- **Peer Dependency 处理**：通过 `pnpm-workspace.yaml` 的 `peerDependencyRules.allowedVersions` 显式允许 eslint 插件使用 eslint@10，避免 peer dep 冲突导致安装失败。
- **构建工具白名单**：`allowBuilds.esbuild: true` 和 `allowBuilds.unrs-resolver: true` 明确允许这些原生构建工具参与依赖安装/构建流程。
- **许可证合规**：对直接内联的第三方源码（Liquid Ether），在 `THIRD_PARTY_NOTICES.md` 中保留完整版权声明与许可证条款，满足 MIT + Commons Clause 的要求。
- **无环境变量注入依赖**：`next.config.js` 为空配置，不通过构建期注入外部依赖；API 路由中使用的外部服务客户端（如 `@notionhq/client`）通过运行时依赖引入。
- **脚本驱动**：`scripts` 字段仅提供 dev/build/start/lint/test 基础命令，无额外的依赖更新或审计脚本（如 `pnpm audit` 未在脚本中暴露）。

总体而言，这是一个简洁的单仓 Next.js 项目，依赖管理遵循 pnpm 最佳实践：集中声明、锁文件锁定、workspace 级 peer dependency 规则，并通过文档记录内联第三方源码的许可证义务。