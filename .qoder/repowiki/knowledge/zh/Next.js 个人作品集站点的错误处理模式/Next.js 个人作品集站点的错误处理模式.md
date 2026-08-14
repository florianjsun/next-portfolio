---
kind: error_handling
name: Next.js 个人作品集站点的错误处理模式
category: error_handling
scope:
    - '**'
source_files:
    - app/api/contact/route.ts
    - app/api/notion-webhook/route.ts
    - lib/blogs.ts
    - lib/github.ts
    - lib/blog-markdown.ts
---

## 1. 整体方案

该仓库是一个基于 Next.js App Router 的个人作品集站点，**没有统一的错误类型定义、错误码枚举或全局错误中间件**。错误处理以“就地处理”为主：在 API Route 中通过 `try/catch` + `NextResponse` 返回 HTTP 状态码；在数据获取层（`lib/`）直接抛出原生 `Error`，由调用方决定是转换为页面级错误还是静默降级。

## 2. 关键文件与位置

- **API 路由层**
  - `app/api/contact/route.ts`：联系表单提交接口，使用 Zod 校验输入，失败返回 400；外部 Google Form 请求失败返回 502；未配置环境变量时返回 500；其他异常统一 catch 后记录 `console.error` 并返回 500。
  - `app/api/notion-webhook/route.ts`：Notion Webhook 接收端点，对 JSON 解析失败返回 400，验证 token 格式不合法返回 400，未配置 verification token 返回 503，签名校验失败返回 401。所有分支均显式返回带 `{ error }` 字段的 JSON 响应。

- **数据获取层（lib）**
  - `lib/blogs.ts`：核心 Notion 博客数据源。大量使用 `throw new Error(...)` 表达业务契约违反（如缺少属性、类型不匹配、重复 slug、查询结果超限、数据源配置变更等）。同时引入 `@notionhq/client` 的 `isNotionClientError` 和 `APIErrorCode.ObjectNotFound`，将“对象不存在”视为可恢复的“无内容”而非错误——`loadBlogPost` 捕获此类异常后返回 `null`，由上层 `getBlogPost` 再返回 `null`，最终页面渲染空状态。
  - `lib/github.ts`：GitHub Star 数抓取，对外部网络异常采用“静默降级”策略——`catch` 后返回 `null`，由调用组件自行决定是否显示默认值。
  - `lib/blog-markdown.ts`：Markdown 渲染过程中遇到非法 Markdown 时抛出 `Error`。

- **工具层**
  - `lib/utils.ts`：仅包含 `cn`、`formatDate`、`getDurationText` 等纯函数，不包含错误处理逻辑。

## 3. 架构与约定

### 3.1 分层职责
| 层级 | 错误处理方式 | 典型场景 |
|---|---|---|
| API Route | `try/catch` → `NextResponse.json({ error }, status)` | 入参校验失败、第三方服务不可用、签名校验失败 |
| 数据获取层 (`lib/*`) | 直接 `throw new Error(描述性消息)` | 数据源配置缺失、字段类型不匹配、业务约束被破坏 |
| 数据获取层（容错路径） | `catch` 后返回 `null` | 可选的外部依赖（GitHub star 数）、可恢复的“不存在”（Notion ObjectNotFound） |
| 页面/组件 | 消费 `null` 或 `undefined` 作为“无数据”信号 | 列表为空、单篇文章不存在 |

### 3.2 具体约定
- **Zod 校验**：在 API 入口统一使用 `z.object().safeParse()`，失败返回 400 并附带人类可读的错误信息。
- **环境变量缺失**：`contact/route.ts` 在未配置必需环境变量时直接返回 500；`blogs.ts` 中若 `NOTION_TOKEN` 与 `NOTION_DATA_SOURCE_ID` 均未设置则 `console.warn` 并禁用博客功能（返回空数组），但只配了其中一个则抛错。
- **第三方 API 错误分类**：`blogs.ts` 通过 `isNotionClientError(error) && error.code === APIErrorCode.ObjectNotFound` 精确区分“资源不存在”（返回 null）与其他 Notion 客户端错误（向上抛出）。
- **缓存失效时的保护**：`loadPublishedBlogRecords` 在缓存键对应的 dataSourceId 变化时抛错，防止跨数据源的脏读。
- **Webhook 安全**：`notion-webhook/route.ts` 强制校验签名，未配置 verification token 时返回 503 而非静默忽略。

### 3.3 未采用的模式
- 没有自定义错误类（如 `AppError`、`ApiError`）。
- 没有全局错误边界（`error.tsx` / `global-error.tsx`）。
- 没有统一的错误码常量表（仅 `blogs.ts` 内部引用 `APIErrorCode`）。
- 没有 `rethrow` 或错误包装器。

## 4. 约束与规则

- **API 响应必须显式携带状态码**：所有 `NextResponse` 都附带明确的 HTTP 状态（400/401/500/502/503），不使用默认 200。
- **JSON 错误体结构一致**：`notion-webhook/route.ts` 统一返回 `{ error: string }` 形式，便于调用方解析。
- **数据完整性优先于静默失败**：对必填字段、类型、业务约束（slug 唯一性、Status 必须含 Published）一律抛错，不返回部分数据。
- **可选依赖允许降级**：GitHub star 数、Notion 博客（当配置缺失时）均以 `null`/`[]` 形式降级，保证站点主流程可用。
- **日志记录**：仅在 API 层使用 `console.error` 记录异常堆栈，业务层通过抛错让调用方决定日志级别。

## 5. 适用性说明

该仓库属于前端/全栈应用，错误处理集中在 Next.js API Route 与数据获取层，遵循“轻量级、就近处理”的原则，适合小型个人项目维护成本低的场景。对于大型团队项目，建议引入统一错误类型、全局错误边界与结构化错误码以提升可观测性与可测试性。