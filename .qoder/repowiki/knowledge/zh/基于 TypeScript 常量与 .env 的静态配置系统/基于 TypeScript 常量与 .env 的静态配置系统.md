---
kind: configuration_system
name: 基于 TypeScript 常量与 .env 的静态配置系统
category: configuration_system
scope:
    - '**'
source_files:
    - config/site.ts
    - config/routes.ts
    - config/pages.ts
    - config/constants.ts
    - config/projects.ts
    - config/experience.ts
    - config/skills.ts
    - config/socials.ts
    - config/contributions.ts
    - .env.copy
    - app/api/contact/route.ts
    - next.config.js
    - package.json
---

## 1. 采用的方案

该仓库没有引入任何运行时配置框架（如 dotenv、config、yup 等），而是采用 **纯 TypeScript 常量 + Next.js 环境变量** 的组合方式管理站点配置：
- 所有面向展示的业务数据（站点元信息、路由、项目、经验、技能、社交链接、贡献）集中在 `config/` 目录下的多个 `.ts` 文件中，以 `export const` 形式暴露。
- 运行期敏感或环境相关变量通过 `.env.copy` 模板定义，由 Next.js 在构建时注入；服务端 API 使用 `process.env.*` 读取，客户端公开变量使用 `NEXT_PUBLIC_` 前缀。
- 构建期配置集中在根级 `next.config.js`（CORS headers）、`package.json`（scripts/dependencies）、`components.json`（shadcn/ui 配置）等标准 Next.js 配置文件。

## 2. 关键文件

- `config/site.ts`：站点全局元数据（名称、作者、URL、OG image、关键词、外部链接）。
- `config/routes.ts`：主导航菜单项（标题 + href）。
- `config/pages.ts`：按 `ValidPages` 联合类型键控的页面元数据（title/description/metadata）。
- `config/constants.ts`：共享类型常量（`ValidSkills`、`ValidCategory`、`ValidExpType`、`ValidPages`）。
- `config/projects.ts`：项目列表数组（含技术栈、时间线、描述、截图）。
- `config/experience.ts`：工作经历数组。
- `config/skills.ts`：技能列表（含评分、图标、描述）。
- `config/socials.ts`：社交链接数组。
- `config/contributions.ts`：开源贡献列表。
- `.env.copy`：环境变量模板（Google Form 字段 ID、Google Analytics Measurement ID、Resume Link）。
- `app/api/contact/route.ts`：唯一使用 `process.env.*` 的服务端代码，读取 Google Form 配置。
- `next.config.js`：Next.js 构建期配置（仅定义了 `/api/sb-contact` 的 CORS headers）。
- `package.json`：脚本命令（dev/build/start/lint）及依赖声明。

## 3. 架构与约定

### 3.1 业务配置分层
`config/` 目录按领域拆分，每个文件导出一个或多个常量对象/数组：
- `site.ts` 提供站点级单例配置，被 layout、manifest、sitemap 等顶层模块引用。
- `routes.ts`、`pages.ts` 提供导航与页面元数据的集中式来源，避免在组件中硬编码路径和文案。
- `projects.ts`、`experience.ts`、`skills.ts`、`socials.ts`、`contributions.ts` 作为“静态数据库”，被对应页面组件直接 import 渲染。
- `constants.ts` 用 TypeScript 联合类型约束各配置文件的字段取值，形成跨文件的类型契约（例如 `techStack: ValidSkills[]`、`category: ValidCategory[]`）。

### 3.2 类型驱动的配置
配置不仅是数据，还通过接口和联合类型进行强约束：
- `ExperienceInterface`、`ProjectInterface`、`skillsInterface`、`contributionsInterface` 等接口定义在每个配置文件中。
- `ValidPages` 联合类型被用作 `pagesConfig` 的索引签名键，新增页面必须显式添加键值，否则 TS 编译报错——这是一种隐式的“注册表”约束。
- `skillsUnsorted` 通过 `.sort()` 派生出排序后的 `skills`，并切片出 `featuredSkills`，体现“源数据 + 派生视图”的模式。

### 3.3 环境变量分层
- 服务端变量：`GOOGLE_FORM_LINK`、`GOOGLE_FORM_FIELD_ID_*` 仅在 `app/api/contact/route.ts` 中以 `process.env.*` 读取，用于将联系表单提交到 Google Forms。
- 客户端变量：`NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID`、`NEXT_PUBLIC_RESUME_LINK` 遵循 Next.js 约定，可在浏览器端访问，用于 Google Analytics 和简历链接。
- `.env.copy` 仅作为模板存在，实际 `.env` 不被纳入版本控制（见 `.gitignore`），部署时需由平台注入。

### 3.4 构建期与运行期分离
- 所有业务内容（项目、经验、技能、社交、贡献、路由）均为编译期常量，不存在运行时加载 JSON/YAML 的逻辑。
- 博客内容位于 `content/blogs/*.md`，通过 `lib/blogs.ts` + `gray-matter` 在构建时解析为结构化数据，同样属于编译期数据源。
- 只有第三方服务集成（Google Form、Google Analytics）通过环境变量在运行期注入。

## 4. 约定与约束

- **业务配置必须放在 `config/` 下并以 `export const` 暴露**：所有页面元数据、项目、经验、技能、社交、贡献均遵循此约定，便于统一 import。
- **新增页面需在 `config/constants.ts` 的 `ValidPages` 中添加联合成员，并在 `config/pages.ts` 中补充对应条目**：由 TypeScript 类型系统强制保证一致性。
- **技能、分类、经验类型等枚举值集中在 `config/constants.ts`**：其他配置文件通过 `import { ValidXxx } from "./constants"` 引用，禁止重复定义字符串字面量。
- **前端可见变量必须以 `NEXT_PUBLIC_` 前缀命名**：这是 Next.js 框架约定的强制规则，仓库中所有客户端变量均遵守。
- **敏感配置不得硬编码进源码**：Google Form 字段 ID 等通过 `process.env.*` 在服务端 API 中读取，`.env.copy` 仅提供占位示例。
- **配置数据不随请求变化**：整个站点没有动态配置加载逻辑（无 fetch/config 库），所有配置在构建时即确定，适合个人作品集这种静态内容为主的场景。
- **Next.js 构建配置集中在 `next.config.js`**：当前仅包含 CORS headers，未启用复杂插件或运行时配置覆盖。

## 5. 适用性说明

本仓库是一个 Next.js App Router 个人作品集站点，配置系统简单直接：以 TypeScript 常量为主、环境变量为辅。没有引入独立的配置中心、feature flag 系统或运行时配置热更新机制。对于此类小型静态内容站点而言，该方案足够简洁且易于维护。