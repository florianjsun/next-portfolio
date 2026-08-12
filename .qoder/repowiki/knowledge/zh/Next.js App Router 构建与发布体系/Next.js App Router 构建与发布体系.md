---
kind: build_system
name: Next.js App Router 构建与发布体系
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.js
    - tsconfig.json
    - postcss.config.js
    - eslint.config.mjs
    - .prettierrc
    - components.json
    - next-env.d.ts
---

## 1. 构建系统概览

本项目是一个基于 **Next.js 16 (App Router)** 的个人作品集站点，构建完全依赖 Next.js 内置的构建管线，未引入自定义 Makefile、Dockerfile 或 CI 脚本。所有构建、开发、启动命令均通过 `package.json` 中的 npm scripts 暴露。

## 2. 关键文件与工具链

- **`package.json`**：定义项目元信息（`name: minimal-portfolio`, `version: 0.1.0`, `private: true`）以及四组脚本：
  - `dev`: `next dev` — 本地开发服务器
  - `build`: `next build` — 生产构建，输出到 `.next/`
  - `start`: `next start` — 启动生产服务器
  - `lint`: `eslint` — 代码检查
- **`next.config.js`**：仅配置了 `/api/sb-contact` 路径的 CORS 响应头（Access-Control-Allow-*），无其他构建期定制。
- **`tsconfig.json`**：TypeScript 编译选项，目标 ES2017，启用 strict / isolatedModules / jsx react-jsx / incremental，模块解析为 bundler，并通过 `paths` 将 `@/*` 映射到根目录，配合 Next.js 插件。
- **`postcss.config.js`**：使用 `@tailwindcss/postcss` 作为 PostCSS 插件，驱动 Tailwind CSS v4 构建。
- **`eslint.config.mjs`**：ESLint Flat Config，启用 `@next/eslint-plugin-next`（含 core-web-vitals）、`eslint-plugin-react`、`eslint-plugin-react-hooks`，忽略 `.next/*` 和 `node_modules/*`。
- **`.prettierrc`**：Prettier 格式化配置（存在但内容未在读取范围内）。
- **`components.json`**：shadcn/ui 组件库配置（用于 UI 组件生成）。
- **`next-env.d.ts`**：Next.js 自动生成的类型声明入口。

## 3. 架构与约定

- **构建产物**：`next build` 输出至根目录下的 `.next/` 目录（已存在于仓库中，说明构建产物被提交或缓存）。运行时由 `next start` 提供静态服务。
- **依赖管理**：使用 npm（`package-lock.json` 存在），依赖版本锁定在 `package.json` 中；通过 `overrides` 强制 `eslint-plugin-react`、`eslint-plugin-import`、`eslint-plugin-jsx-a11y` 使用工作区版本的 `eslint`，解决 ESLint 生态的版本冲突。
- **环境变量**：通过 `.env` 和 `.env.copy` 管理，应用运行期由 Next.js 自动注入。
- **博客内容**：Markdown 文章位于 `content/blogs/`，通过 `gray-matter` + `remark` 生态在构建时解析为 HTML（见 `lib/blogs.ts`），属于构建期数据预取。
- **样式构建**：Tailwind CSS v4 通过 `@tailwindcss/postcss` 集成，无需额外构建步骤，由 Next.js 内置处理。

## 4. 约定与约束

- **无外部 CI/CD**：仓库中未发现 GitHub Actions、Vercel CLI、Dockerfile、Makefile 等自动化部署配置，发布流程依赖手动执行 `npm run build && npm start` 或在 Vercel 等平台直接推送。
- **私有包**：`private: true` 表明该包不发布到 npm registry，仅作为个人站点源码。
- **构建阶段无测试脚本**：`package.json` 的 scripts 中未定义 `test` 命令，未见 Jest/Vitest/Mocha 等测试框架依赖。
- **增量构建**：TS 开启 `incremental: true`，利用 `.tsbuildinfo` 加速后续编译。
- **严格类型**：`strict: true` 且 `skipLibCheck: true`，要求所有 TS 代码通过严格类型检查。
- **路径别名**：统一使用 `@/*` 绝对导入，避免相对路径地狱。
- **CORS 白名单**：仅在 `next.config.js` 中对 `/api/sb-contact` 开放跨域请求，其余 API 路由默认受 Next.js 安全策略限制。

## 5. 总结

该项目采用「零配置」风格的 Next.js 构建体系：以 `next build` 为核心构建命令，结合 TypeScript、Tailwind CSS v4、ESLint Flat Config 和 Prettier 形成完整的开发与构建链路。没有自定义构建脚本、容器化或 CI 流水线，适合个人站点的轻量级部署需求。