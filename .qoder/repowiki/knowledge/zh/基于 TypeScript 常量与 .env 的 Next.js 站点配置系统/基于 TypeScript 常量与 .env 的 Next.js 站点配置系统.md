---
kind: configuration_system
name: 基于 TypeScript 常量与 .env 的 Next.js 站点配置系统
category: configuration_system
scope:
    - '**'
source_files:
    - .env.copy
    - config/site.ts
    - config/routes.ts
    - config/constants.ts
    - config/projects.ts
    - config/experience.ts
    - config/skills.ts
    - config/contributions.ts
    - config/socials.ts
    - config/pages.ts
    - lib/blogs.ts
    - lib/github-contributions.ts
    - lib/urls.ts
    - lib/content-urls.ts
    - app/api/contact/route.ts
    - app/api/notion-webhook/route.ts
    - app/layout.tsx
    - app/(root)/resume/page.tsx
    - components/common/analytics.tsx
    - next.config.js
---

## 1. 使用的系统与方式

该仓库没有引入第三方配置框架，而是采用 **TypeScript 模块常量 + Next.js 环境变量** 的组合方式管理运行时配置。所有可编辑的站点内容（项目、经历、技能、社交链接、导航路由等）以纯 TS 对象导出；需要区分客户端/服务端或部署环境注入的值则通过 `process.env` 读取。

- 构建期/静态配置：集中在 `config/` 目录下的若干 `.ts` 文件，按领域拆分（site、routes、projects、experience、skills、contributions、socials、constants、pages），由页面和组件直接 import。
- 运行期环境变量：通过 `.env.copy` 模板声明全部可用变量，实际值由部署平台（如 Vercel）注入，代码中通过 `process.env.*` 读取。
- 外部服务凭据（Notion、GitHub、Google Form）仅在服务端模块中使用，遵循注释约定“never prefix these secrets with NEXT_PUBLIC_”。

## 2. 关键文件与包

- `config/site.ts`：站点元信息（名称、作者、URL、OG 图片、关键词、社交链接）。
- `config/routes.ts`：主导航 `RoutesConfig.mainNav`，集中定义页面标题与路由。
- `config/constants.ts`：全局类型枚举（`ValidSkills`、`ValidCategory`、`ValidExpType`、`ValidPages`），被其他配置模块复用以保证类型一致。
- `config/projects.ts` / `config/experience.ts` / `config/skills.ts` / `config/contributions.ts` / `config/socials.ts` / `config/pages.ts`：各业务域的数据配置，使用 `constants.ts` 中的类型约束。
- `.env.copy`：完整的环境变量清单与示例值，是部署时填写 `.env` 的依据。
- `lib/blogs.ts`：服务端博客数据加载器，集中处理 Notion 相关环境变量（`NOTION_TOKEN`、`NOTION_DATA_SOURCE_ID`、`NOTION_BLOG_REVALIDATE_SECONDS`、`NOTION_WEBHOOK_VERIFICATION_TOKEN`）。
- `app/api/contact/route.ts`：联系表单 API，校验并转发到 Google Form，依赖 `GOOGLE_FORM_LINK` 与各字段 ID。
- `lib/github-contributions.ts`：GitHub 贡献数据读取，使用 `GITHUB_USERNAME`、`GITHUB_TOKEN`。
- `app/layout.tsx`、`app/(root)/resume/page.tsx`：在布局与页面中读取 `NEXT_PUBLIC_*` 变量用于 SEO、Analytics 与简历跳转。
- `next.config.js`：当前为空配置对象，未做额外运行时配置扩展。

## 3. 架构与设计约定

### 3.1 分层：静态配置 vs 环境变量
- **静态配置**：所有面向展示的内容（项目、经历、技能、社交、导航、站点名/描述/关键词）放在 `config/*.ts` 中以 TS 常量导出。这样既能享受 IDE 类型提示，又能通过 `constants.ts` 中的联合类型保证字段取值合法。
- **环境变量**：任何随部署变化、不应提交到代码库的值（API Key、Token、外部链接、重验证秒数）一律走 `process.env`，并通过 `.env.copy` 集中声明。

### 3.2 客户端与服务端隔离
- 客户端可见的配置通过 `NEXT_PUBLIC_` 前缀暴露（如 `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID`、`NEXT_PUBLIC_RESUME_LINK`），在 `app/layout.tsx`、`app/(root)/resume/page.tsx` 等处直接使用。
- 服务端专用密钥（Notion Token、GitHub Token、Webhook Verification Token、Google Form 字段映射）仅在 `server-only` 模块或服务端 Route Handler 中读取，并在 `.env.copy` 注释中明确禁止加 `NEXT_PUBLIC_` 前缀。

### 3.3 默认值与降级策略
- `lib/blogs.ts` 中 `getRevalidateSeconds()` 将 `NOTION_BLOG_REVALIDATE_SECONDS` 解析为数字，不合法时回退到 `DEFAULT_REVALIDATE_SECONDS = 900`。
- `getNotionConfig()` 要求 `NOTION_TOKEN` 与 `NOTION_DATA_SOURCE_ID` 同时存在，否则返回 `null` 并打印一次警告日志；缺失时博客功能静默禁用，不影响站点其他部分。
- GitHub 用户名优先使用 `GITHUB_USERNAME`，回退到 `siteConfig.username`。

### 3.4 配置校验
- 使用 Zod 对从 Notion 拉取的每条记录进行 schema 校验（`notionBlogRecordSchema`），包括 slug 格式、日期合法性、标签数量、封面 URL 稳定性等，失败时抛出带上下文的错误。
- 联系表单通过 `z.object({ name, email, message, social })` 校验请求体，再校验必填的 Google Form 环境变量，任一缺失即返回 500。
- `lib/content-urls.ts` 提供 `isHttpsUrl` / `isSiteRelativeUrl` 等工具，配合 `lib/urls.ts` 的 `toAbsoluteUrl` 强制 URL 必须是 HTTPS 或站点相对路径。

### 3.5 配置组织原则
- 每个业务域一个配置文件（projects、experience、skills、contributions、socials、pages），避免单一大配置对象。
- 跨域共享的类型抽取到 `constants.ts`，被多个配置模块引用，确保枚举值一致性。
- 路由配置独立于页面实现，`config/routes.ts` 的 `mainNav` 被导航组件消费，便于统一调整菜单项。

## 4. 约定与约束

- **环境变量必须先在 `.env.copy` 中声明**：该文件包含所有可用键及占位说明，是部署配置的权威清单。
- **服务端密钥不得加 `NEXT_PUBLIC_` 前缀**：`.env.copy` 中对 Notion 相关变量有明确注释约束，违反会导致密钥泄露到客户端。
- **Notion 配置成对生效**：`NOTION_TOKEN` 与 `NOTION_DATA_SOURCE_ID` 必须同时设置，否则博客功能禁用；只设其一会抛错。
- **Google Form 集成需配置完整**：`GOOGLE_FORM_LINK` 与四个 `GOOGLE_FORM_FIELD_ID_*` 缺一不可，否则联系表单 API 返回 500。
- **URL 安全约束**：站点内 URL 必须为 HTTPS 或站点相对路径，`toAbsoluteUrl` 会对非法值抛错。
- **配置变更影响缓存**：博客数据通过 `unstable_cache` 缓存并按 `NOTION_BLOG_REVALIDATE_SECONDS` 定时刷新，修改 Notion 配置后需等待缓存失效或通过 tag 重新验证。
- **Next.js 构建配置保持最小化**：`next.config.js` 当前为空对象，未在此处注入运行时配置，所有运行时行为通过环境变量驱动。