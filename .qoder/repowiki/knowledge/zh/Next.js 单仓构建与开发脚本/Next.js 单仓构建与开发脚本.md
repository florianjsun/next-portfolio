---
kind: build_system
name: Next.js 单仓构建与开发脚本
slug: build_system
category: build_system
scope:
    - '**'
---

## 1. 使用的系统/工具

- **框架**：Next.js 16（App Router），通过 `next build` / `next dev` / `next start` 完成编译、开发与生产启动。
- **包管理器**：pnpm 10.34.5，由 `package.json` 的 `packageManager` 字段锁定版本；根目录存在 `pnpm-workspace.yaml`，但当前仓库为单应用，未拆分子包。
- **TypeScript**：tsconfig 使用 `target: ES2017`、`module: esnext`、`moduleResolution: bundler`，并通过 Next 插件集成增量编译（`incremental: true`）。
- **样式管线**：PostCSS + Tailwind CSS v4（`@tailwindcss/postcss`），无传统 `tailwind.config.js`，样式由 PostCSS 插件链处理。
- **代码质量**：ESLint 10 + `eslint-config-next` + Prettier 3，分别由 `eslint.config.mjs` 和 `.prettierrc` 驱动。
- **测试**：仅包含一个自定义脚本命令 `test:blog-markdown`，调用 `scripts/test-blog-markdown.mjs` 校验博客 Markdown。

## 2. 关键文件

- `package.json`：定义所有 npm scripts（`dev` / `build` / `start` / `lint` / `test:blog-markdown`）、依赖与 pnpm 工作区规则。
- `next.config.js`：空配置对象，完全依赖 Next.js 默认行为。
- `tsconfig.json`：启用严格模式、路径别名 `@/*` → 根目录、Next 编译器插件、增量编译。
- `postcss.config.js`：注册 `@tailwindcss/postcss` 作为唯一 PostCSS 插件。
- `pnpm-workspace.yaml`：允许 `unrs-resolver` 构建并放宽 ESLint 相关 peerDependency 的版本约束。
- `eslint.config.mjs`、`.prettierrc`：代码风格与检查规则。
- `scripts/test-blog-markdown.mjs`：博客内容测试入口（由 `pnpm test:blog-markdown` 触发）。

## 3. 架构与约定

- **单仓单应用**：整个站点即一个 Next.js 应用，没有子 package 或 monorepo 结构，所有构建产物输出到默认的 `.next/` 目录。
- **零侵入构建配置**：`next.config.js` 为空对象，意味着项目选择“约定优于配置”的方式，不覆盖 Next 默认构建流程（如 Image Optimization、Webpack/Rspack 等均由 Next 内部管理）。
- **路径别名统一**：通过 tsconfig 的 `paths.@/*` 将 `@/xxx` 解析到仓库根目录，组件与配置均以绝对导入方式引用。
- **Tailwind v4 管线**：不再需要 `tailwind.config.js`，样式编译完全交给 `@tailwindcss/postcss` 插件。
- **pnpm 工作区预留**：虽然存在 `pnpm-workspace.yaml`，但当前仓库并未拆分 workspace，该文件主要用于声明允许的构建器与 peerDependency 版本兼容策略。

## 4. 约定与约束

- **开发/构建/启动三件套固定**：通过 `pnpm dev` 启动开发服务器、`pnpm build` 生成生产静态产物、`pnpm start` 运行生产服务，这是仓库内唯一的官方入口约定。
- **类型检查由 Next 内置**：tsconfig 设置 `noEmit: true` 且包含 Next 插件，类型检查在 `next dev` / `next build` 过程中执行，不单独暴露 `tsc` 脚本。
- **Lint 独立命令**：`pnpm lint` 直接调用 `eslint`，无 pre-commit 钩子或 CI 强制步骤可见于仓库中。
- **博客 Markdown 测试**：新增或修改 `content/blogs/*.md` 后应运行 `pnpm test:blog-markdown` 以验证 front matter 与正文格式（由 Node 脚本驱动）。
- **无 Docker / CI 配置**：仓库未发现 `Dockerfile`、`docker-compose.*` 以及 `.github/workflows` 等 CI/CD 文件，部署预期由 Vercel（Next.js 默认托管平台）或外部流水线基于 `pnpm build` 产物完成。
- **依赖锁定**：使用 `pnpm-lock.yaml` 锁定全部依赖版本，确保跨环境构建一致性。

综上，该项目采用“极简 Next.js 默认构建 + pnpm 包管理 + ESLint/Prettier 代码规范”的组合，构建过程高度依赖 Next.js 内置能力，仓库层面只保留最小化的脚本与配置文件。