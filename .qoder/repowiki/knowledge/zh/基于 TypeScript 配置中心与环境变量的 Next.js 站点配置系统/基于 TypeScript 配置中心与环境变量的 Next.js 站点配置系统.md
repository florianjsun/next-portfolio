---
kind: configuration_system
name: 基于 TypeScript 配置中心与环境变量的 Next.js 站点配置系统
slug: configuration_system
category: configuration_system
scope:
    - '**'
---

## 1. 采用的方案

该仓库没有引入第三方配置库（如 dotenv、config-manager 等），而是采用 **TypeScript 模块 + `.env` 环境变量** 的组合方式，将站点元信息、路由、页面标题、项目/经历/技能/社交数据集中到 `config/` 目录下的多个 TS 文件中，运行时通过 `process.env` 读取服务端敏感配置。

构建与运行期配置来源：
- `next.config.js`：Next.js 应用级配置（仅定义了 `/api/sb-contact` 的 CORS headers）。
- `components.json`：shadcn/ui 组件配置（由 CLI 生成）。
- `postcss.config.js`、`eslint.config.mjs`、`.prettierrc`、`tsconfig.json`：开发与构建期工具链配置。
- `.env.copy`：提供环境变量模板，实际 `.env` 文件未提交。

## 2. 核心文件与职责

| 文件 | 职责 |
|---|---|
| `config/site.ts` | 站点全局元信息：名称、作者、用户名、描述、URL、OG Image、Favicon、Logo、SEO keywords |
| `config/routes.ts` | 顶部导航菜单 `mainNav`，统一维护各页面的标题与 href |
| `config/pages.ts` | 每个页面的 `title` / `description` / `metadata.title` / `metadata.description`，类型被 `ValidPages` 约束 |
| `config/constants.ts` | 共享枚举类型：`ValidSkills`、`ValidCategory`、`ValidExpType`、`ValidPages`，作为其他配置的联合类型基础 |
| `config/projects.ts` | 项目列表 `Projects` 与 `featuredProjects`，使用 `ValidSkills`、`ValidCategory`、`ValidExpType` 做类型校验 |
| `config/experience.ts` | 工作经历数据（结构类似 projects） |
| `config/skills.ts` | 技能列表，受 `ValidSkills` 约束 |
| `config/contributions.ts` | 开源贡献数据 |
| `config/socials.ts` | 社交链接数组 `SocialLinks`，引用 `@/components/common/icons` 中的图标 |
| `next.config.js` | Next.js 构建配置，仅定义 API 路径的 CORS headers |
| `.env.copy` | 环境变量模板，包含 Google Form 字段 ID、Google Analytics ID、简历链接等 |
| `app/api/contact/route.ts` | 唯一在服务端直接读取 `process.env.GOOGLE_FORM_*` 的地方 |

## 3. 架构与约定

### 3.1 配置分层
- **站点元数据层**：`siteConfig` 提供网站级常量，被 `sitemap.ts`、`manifest.ts`、布局页等消费。
- **页面内容层**：`pagesConfig` 以键值映射形式为每个 `ValidPages` 提供 SEO 元数据，新增页面需同时声明对应 key。
- **业务数据层**：`projects.ts`、`experience.ts`、`skills.ts`、`contributions.ts`、`socials.ts` 是纯数据数组，不依赖运行时环境。
- **路由层**：`routes.ts` 的 `mainNav` 是导航菜单的唯一数据源，页面组件不硬编码链接。
- **类型约束层**：`constants.ts` 中定义的 `ValidSkills`、`ValidCategory`、`ValidExpType`、`ValidPages` 被多处 import 复用，确保配置项取值一致。

### 3.2 类型驱动的配置
所有业务配置都通过 TypeScript 接口和联合类型进行约束。例如 `ProjectInterface` 要求 `category` 必须是 `ValidCategory[]`，`techStack` 必须是 `ValidSkills` 或一组扩展技术字符串；`PagesConfig` 的 key 空间被 `ValidPages` 锁定。这种设计使得新增/修改配置时编译器会提示不一致之处。

### 3.3 环境变量策略
- 仅服务端 Route Handler 使用 `process.env`，当前仅在 `app/api/contact/route.ts` 中读取 `GOOGLE_FORM_LINK`、`GOOGLE_FORM_FIELD_ID_NAME`、`GOOGLE_FORM_FIELD_ID_EMAIL`、`GOOGLE_FORM_FIELD_ID_MESSAGE`、`GOOGLE_FORM_FIELD_ID_SOCIAL`。
- 客户端可见变量遵循 Next.js 约定，以 `NEXT_PUBLIC_` 前缀命名（如 `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID`、`NEXT_PUBLIC_RESUME_LINK`），在 `.env.copy` 中给出占位示例。
- 没有统一的 env 加载/校验中间件；环境变量在首次使用时直接访问，缺少时不会抛出错误，而是按默认行为处理。

### 3.4 静态资源与外部 URL
站点图片、项目截图、logo 等静态资源放在 `public/` 下，配置中通过相对路径引用（如 `/projects/portfolio/home-hero.png`）。站点 URL、GitHub、Twitter、模板仓库地址集中在 `siteConfig.links`，避免散落各处。

## 4. 约定与约束

- **配置集中化**：所有站点文案、导航、项目、经历、技能、社交链接均位于 `config/` 目录，页面组件不应内联这些内容。
- **类型即契约**：新增技能、分类、页面时必须先在 `constants.ts` 中扩展联合类型，否则导入处会报类型错误。
- **页面元数据必须成对出现**：`pagesConfig` 中每个 `ValidPages` 都必须提供 `title`、`description`、`metadata`，新增页面需同步补充。
- **导航与路由解耦**：导航项来自 `routes.mainNav`，新增页面应在此注册，而不是在多个组件中重复写死链接。
- **环境变量模板先行**：`.env.copy` 是所有可配置环境变量的单一来源，部署时需复制为 `.env` 并填入真实值；注释说明 Google Form 字段 ID 可在 `api/contact/route.ts` 中查找。
- **Next.js 构建配置最小化**：`next.config.js` 只保留必要的 CORS header，其余构建选项走 Next.js 默认值。
- **主题配置通过 next-themes**：`components/common/theme-provider.tsx` 是对 `next-themes` 的薄封装，主题切换逻辑不在本仓库自定义实现。

## 5. 适用性判断

该仓库确实存在一个明确的配置系统：以 TypeScript 模块为核心的静态配置中心 + `.env` 环境变量，用于管理站点元信息、导航、页面 SEO、业务数据以及运行时密钥。因此本类别适用，但属于轻量级、单仓个人站点的配置模式，而非企业级多环境配置平台。