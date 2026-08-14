---
kind: dependency_management
name: 基于 pnpm 的依赖管理与版本策略
slug: dependency_management
category: dependency_management
scope:
    - '**'
---

## 1. 使用的系统/工具

- **包管理器**：pnpm（通过 `package.json` 中的 `"packageManager": "pnpm@10.34.5"` 锁定版本），使用 pnpm 工作区协议（根目录存在 `pnpm-workspace.yaml`）。
- **锁文件**：`pnpm-lock.yaml`，用于确保所有安装者获得一致的依赖树。
- **构建/运行脚本**：通过 `scripts` 字段暴露 `dev`、`build`、`start`、`lint`、`test:blog-markdown` 等命令，全部由 Next.js CLI 驱动。
- **TypeScript 解析**：`tsconfig.json` 中 `moduleResolution` 设为 `bundler`，配合 Next.js 内置打包器解析依赖，不依赖传统 Node 模块解析。

## 2. 关键文件

- `package.json`：声明项目元信息、`dependencies` / `devDependencies` 以及 npm scripts。
- `pnpm-workspace.yaml`：启用 pnpm 工作区能力，并配置 `peerDependencyRules.allowedVersions` 以允许 ESLint 插件与 ESLint 主程序之间的版本兼容。
- `pnpm-lock.yaml`：精确锁定所有依赖及其子依赖的版本，保证可重复安装。
- `next.config.js`：当前为空对象，未引入额外依赖或外部 registry。
- `tsconfig.json`：通过 `paths` 将 `@/*` 映射到项目根目录，属于内部路径别名，不引入第三方依赖。

## 3. 架构与约定

- **单仓应用**：整个站点是单一 Next.js 应用，没有拆分多个 package，因此不存在 monorepo 级别的共享包管理；所有依赖集中在根级 `package.json`。
- **依赖分类清晰**：运行时依赖（如 `next`、`react`、`motion`、`tailwindcss`、`zod`、`zustand` 等）与开发时依赖（`eslint`、`prettier`、`typescript`、`@types/*`、`esbuild` 等）严格区分。
- **Next.js 生态对齐**：`next`、`@next/third-parties`、`eslint-config-next`、`@next/eslint-plugin-next` 版本号保持一致（均为 `16.3.0`），避免框架与工具链版本错位。
- **React 版本锁定**：`react` 与 `react-dom` 固定为 `19.2.8`，不使用 caret 范围，确保 React 运行时稳定。
- **Peer 依赖处理**：通过 `pnpm-workspace.yaml` 的 `peerDependencyRules.allowedVersions` 显式允许 `eslint-plugin-import`、`eslint-plugin-jsx-a11y`、`eslint-plugin-react` 使用 `eslint@10`，解决 ESLint 插件与主程序之间的 peer 冲突。
- **私有仓库/Registry**：未发现 `.npmrc`、`.pnpmrc`、`registry` 配置或 `GOPRIVATE` 等私有源设置，默认使用公共 npm registry。
- **Vendoring**：无 `vendor/` 或类似目录，依赖均通过 pnpm 从 registry 安装，`node_modules` 由 pnpm 管理。

## 4. 约定与约束

- **包管理器锁定**：`packageManager` 字段指定 `pnpm@10.34.5`，团队应使用该确切版本的 pnpm 进行安装与构建，以保证行为一致。
- **版本范围策略**：大多数依赖使用 `^` 前缀（语义化版本升级），但 `react`、`react-dom`、`next`、`eslint-config-next`、`@next/third-parties` 等核心库采用较严格的版本控制，避免破坏性更新。
- **ESLint 版本兼容规则**：通过 `pnpm-workspace.yaml` 的 `peerDependencyRules` 显式声明 ESLint 插件与 ESLint 主程序的兼容版本，这是本仓库对 peer 依赖冲突的唯一显式约定。
- **无自定义 registry**：仓库未配置私有 npm registry、镜像源或认证信息，所有依赖来自公共源。
- **构建产物隔离**：`tsconfig.json` 排除 `node_modules`，且 Next.js 构建输出位于 `.next/`，依赖与源码解耦。
- **脚本即入口**：所有依赖的使用都通过 `package.json.scripts` 暴露的命令触发（`next dev/build/start`、`eslint`、`prettier` 等），不直接调用二进制文件，降低环境差异风险。