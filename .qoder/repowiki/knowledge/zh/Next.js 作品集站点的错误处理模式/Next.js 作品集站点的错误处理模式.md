---
kind: error_handling
name: Next.js 作品集站点的错误处理模式
category: error_handling
scope:
    - '**'
source_files:
    - app/api/contact/route.ts
    - app/api/github-stars/route.ts
    - app/(root)/blogs/[slug]/page.tsx
    - app/layout.tsx
    - components/ui/form.tsx
    - components/forms/contact-form.tsx
    - components/common/github-star-badge.tsx
    - lib/blogs.ts
---

## 1. 使用的系统与方式

该仓库是一个基于 Next.js App Router 的个人作品集站点，没有引入统一的错误处理框架（如 Sentry、自定义 Error Boundary、全局异常中间件等）。错误处理以**分散的 try/catch + 原生 `throw`/`notFound`/`redirect`** 为主，结合表单层 Zod 校验与 React Hook Form 的错误展示。

- **服务端 API 路由**：使用 `try/catch` 包裹异步操作，失败时返回 `NextResponse("...", { status: 500 })` 或静默降级。
- **页面渲染层**：对缺失资源使用 Next.js 内置的 `notFound()` 触发 404；对无效 ID 使用 `redirect()` 重定向到列表页。
- **根布局启动期**：通过直接 `throw new Error(...)` 在构建/渲染阶段中断，用于强制要求关键环境变量存在。
- **客户端组件**：对外部网络请求使用 `try/catch` 并忽略错误，保证 UI 可降级显示。
- **表单层**：使用 `zod` + `@hookform/resolvers/zod` 做字段级校验，错误信息通过 `FormMessage` 组件渲染。

## 2. 关键文件与位置

| 场景 | 文件 | 处理方式 |
|---|---|---|
| 联系表单 API | `app/api/contact/route.ts` | 缺少 `GOOGLE_FORM_LINK` 时返回 500；`fetch` 失败返回 500 |
| GitHub Stars API | `app/api/github-stars/route.ts` | URL 解析失败回退默认仓库；GitHub API 失败返回 `null` |
| 博客文章页 | `app/(root)/blogs/[slug]/page.tsx` | `getBlogPost` 抛错时调用 `next/navigation` 的 `notFound()` |
| 根布局 | `app/layout.tsx` | 缺失 `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` 时 `throw new Error(...)` |
| 表单 UI | `components/ui/form.tsx` | `useFormField` 未处于 `FormField` 内时 `throw new Error(...)` |
| 联系表单客户端 | `components/forms/contact-form.tsx` | Zod 校验 + `fetch` 失败 `catch` 后仅 `console.log` |
| GitHub Star 徽章 | `components/common/github-star-badge.tsx` | 网络请求失败 `catch` 后忽略，UI 降级 |
| 博客数据层 | `lib/blogs.ts` | `fs.readFileSync` 读取不存在文件会抛出 `ENOENT`，由上层捕获 |

## 3. 架构与约定

### 3.1 服务端 API 错误
- 所有 `route.ts` 中的异步逻辑都包裹在 `try/catch` 中。
- 配置缺失（如 `GOOGLE_FORM_LINK`）直接返回 500 文本响应。
- 外部依赖失败（如 GitHub API）采用**静默降级**：返回空值而非报错，使前端仍可渲染基础内容。

### 3.2 页面路由错误
- 使用 Next.js App Router 的 `notFound()` 表示“资源不存在”，对应 404 页面。
- 使用 `redirect('/xxx')` 处理无效参数（如经验/项目 ID 不存在时回到列表页）。
- `generateMetadata` 中对 `getBlogPost` 的 `catch` 返回最小化元数据，避免元数据生成失败导致整页崩溃。

### 3.3 启动期/构建期错误
- 根布局在渲染前检查关键环境变量，缺失则 `throw new Error(...)`，让 Next.js 在构建/首次渲染时报错，便于早期发现配置问题。

### 3.4 客户端组件错误
- 网络请求类副作用（如获取 GitHub stars）使用 `try/catch` 并忽略错误，确保 UI 始终可用。
- 组件内部契约违反（如 `useFormField` 未在 `FormField` 中使用）通过 `throw new Error(...)` 快速失败，帮助开发者尽早发现问题。

### 3.5 表单错误
- 使用 `zod` schema 定义字段规则，错误消息集中声明在 schema 中。
- `react-hook-form` 的 `formState.errors` 通过 `FormMessage` 组件统一渲染为带 `text-destructive` 样式的提示。
- 提交失败时仅记录日志，不阻断用户重试。

## 4. 约定与约束

- **API 层**：所有外部 I/O（HTTP 请求、环境变量读取）必须用 `try/catch` 包裹，失败时返回明确的 HTTP 状态码或降级值，不得让异常冒泡到 Next.js 默认错误处理器。
- **页面层**：资源不存在时使用 `notFound()`，参数无效时使用 `redirect()`，禁止自行渲染“未找到”的 HTML 片段。
- **启动期**：关键环境变量缺失时应 `throw new Error(...)`，以便在部署/构建阶段暴露配置问题。
- **客户端**：非关键网络请求的错误应被吞掉（`catch` 后忽略），保证 UI 降级可用；组件内部契约违反才抛错。
- **表单**：所有用户输入必须经 Zod 校验，错误信息通过 `FormMessage` 展示，禁止直接使用 `alert` 或控制台输出作为用户反馈。
- **无全局错误边界**：仓库未实现 `error.tsx` / `global-error.tsx` 或自定义 `ErrorBoundary`，因此未捕获的运行时异常将交由 Next.js 默认错误页面处理。
- **无结构化错误类型**：没有定义统一的错误枚举或错误类，错误以字符串消息和 HTTP 状态码区分。
