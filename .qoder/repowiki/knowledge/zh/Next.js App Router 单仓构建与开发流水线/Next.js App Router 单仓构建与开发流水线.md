---
kind: build_system
name: Next.js App Router 单仓构建与开发流水线
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.js
    - pnpm-workspace.yaml
    - tsconfig.json
    - postcss.config.js
    - eslint.config.mjs
    - scripts/test-blog-markdown.mjs
    - .env.copy
---

## 1. 使用的系统与工具

本项目是一个基于 Next.js App Router 的单仓个人作品集站点，构建与开发完全依赖 Next.js 内置的构建管线，并通过 pnpm 作为包管理器统一驱动。核心工具链如下：

- **运行时/框架**：Next.js `^16.3.0`（App Router），React 19.2.8。
- **包管理**：pnpm `10.34.5`，通过根级 `packageManager` 字段锁定版本，并使用 `pnpm-workspace.yaml` 声明工作区规则。
- **类型系统**：TypeScript `^6.0.3`，`tsconfig.json` 开启 `strict`、`isolatedModules`、`noEmit`（由 Next 编译输出）。
- **样式构建**：Tailwind CSS v4 + `@tailwindcss/postcss`，通过 `postcss.config.js` 注入 PostCSS 插件。
- **代码质量**：ESLint 10 + `eslint-config-next` + React/Hooks 插件；Prettier 3 + `prettier-plugin-organize-imports`。
- **测试脚本**：自定义 Node 脚本 `scripts/test-blog-markdown.mjs`，使用 esbuild 将 `lib/blog-markdown.ts` 打包为 ESM 后在内存中执行断言。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `package.json` | 定义 `dev` / `build` / `start` / `lint` / `test:blog-markdown` 五个脚本入口 |
| `next.config.js` | 空配置对象，完全依赖 Next.js 默认行为 |
| `pnpm-workspace.yaml` | 允许 `esbuild`、`unrs-resolver` 构建，并显式放行 ESLint 插件对 eslint 10 的 peerDependency 兼容 |
| `tsconfig.json` | 启用 Next TypeScript 插件、`@/*` 路径别名、增量编译 |
| `postcss.config.js` | 仅注册 `@tailwindcss/postcss` |
| `eslint.config.mjs` | 基于 Flat Config 的 ESLint 配置，继承 Next 推荐与 Core Web Vitals 规则 |
| `scripts/test-blog-markdown.mjs` | 博客 Markdown 渲染器的单元测试，验证安全过滤、Notion 扩展块、深度嵌套与超大输入等边界 |
| `.env.copy` | 环境变量模板（如 Notion token） |
| `.next/` | Next.js 构建产物目录（被 gitignore） |

## 3. 架构与约定

### 3.1 构建阶段
- **开发模式**：`pnpm dev` → `next dev`，启动 Next 开发服务器，提供 HMR、类型检查与 API 路由热重载。
- **生产构建**：`pnpm build` → `next build`，生成静态/SSG 产物到 `.next/`，无自定义 webpack/vite 覆盖。
- **运行产物**：`pnpm start` → `next start`，以生产模式启动已构建的应用。
- **样式处理**：Tailwind v4 通过 PostCSS 在 Next 构建时自动处理 `app/globals.css` 中的 `@tailwind` 指令。
- **类型检查**：TypeScript 不直接产出 JS（`noEmit`），由 Next 在构建期调用 tsc 做类型校验。

### 3.2 依赖与工作区策略
- 项目是**单仓库单应用**，没有子 package，但保留了 `pnpm-workspace.yaml`，用于控制 pnpm 在工作区模式下允许 `esbuild` 和 `unrs-resolver` 进行原生构建，并显式声明 ESLint 插件与 eslint 10 的 peerDependency 兼容范围。
- 所有依赖（含 devDependencies）集中在根 `package.json`，不存在 monorepo 多包拆分。

### 3.3 测试与质量门禁
- 没有 Jest/Vitest 等测试框架，测试通过 `pnpm test:blog-markdown` 运行一个自包含的 Node 脚本，用 esbuild 将 `lib/blog-markdown.ts` 打包成 ESM 模块并在内存中 `import()`，然后对一组 fixture 断言 HTML 输出是否包含/不包含特定片段。
- 该脚本还强制要求源码中保留 `rehype-sanitize` 管道（第 149–152 行读取源文件并断言字符串存在），从而把安全 sanitizer 的存在性纳入测试契约。
- 代码风格由 `pnpm lint`（即 `eslint`）与 Prettier 共同约束，`.prettierrc` 与 `.prettierignore` 位于仓库根。

### 3.4 部署与发布
- 仓库未包含 Dockerfile、CI/CD 配置文件（如 GitHub Actions `.github/workflows`）、Makefile 或发布脚本。
- 版本号来自 `package.json` 的 `version: "0.1.0"`，但未见 npm publish 或 tag 脚本，当前仓库更偏向“可本地构建并部署到任意托管平台”的形态。
- 环境变量通过 `.env.copy` 提供模板，实际部署时需复制为 `.env` 并填入 Notion token 等敏感信息。

## 4. 约定与约束

- **构建命令约定**：所有构建/开发动作必须通过 `pnpm <script>` 触发（`dev` / `build` / `start` / `lint` / `test:blog-markdown`），禁止绕过 pnpm 直接调用 `next` 或 `node`。
- **Next 配置最小化**：`next.config.js` 保持为空对象，所有定制通过 Next 默认能力完成；如需新增构建选项应在此文件添加而非引入外部构建器。
- **TypeScript 严格模式**：`tsconfig.json` 开启 `strict`、`isolatedModules`、`noEmit`，新增模块需满足这些编译器选项。
- **路径别名**：`@/*` 指向仓库根，组件与 lib 通过绝对导入引用，避免相对路径地狱。
- **PostCSS 仅 Tailwind**：`postcss.config.js` 只注册 `@tailwindcss/postcss`，新增 PostCSS 插件需在此处显式声明。
- **ESLint Flat Config**：规则集中定义于 `eslint.config.mjs`，新增规则应合并进现有 rules 对象而非创建新配置文件。
- **Markdown 渲染安全契约**：`scripts/test-blog-markdown.mjs` 强制要求 `lib/blog-markdown.ts` 的输出必须经过 `rehypeSanitize`，且拒绝超过字节限制与最大嵌套深度的输入——修改渲染逻辑时必须同步更新该脚本的断言。
- **依赖版本锁定**：通过 `pnpm-lock.yaml` 与 `packageManager` 字段锁定 pnpm 与依赖树，变更依赖需重新生成 lock 文件。
- **构建产物隔离**：`.next/` 目录不参与版本控制，任何需要持久化的构建缓存应放在其他位置或通过 Next 内置缓存机制管理。