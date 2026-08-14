---
kind: error_handling
name: Next.js 作品集站点的错误处理策略
slug: error_handling
category: error_handling
scope:
    - '**'
---

## 1. 整体方法

该仓库是一个基于 Next.js App Router 的个人作品集站点，没有统一的错误类库或全局错误中间件。错误处理分散在 API Route、服务端数据层与客户端表单组件中，采用以下模式：
- **API Route**：使用 `try/catch` 包裹业务逻辑，通过 `NextResponse` / `new NextResponse` 返回明确的 HTTP 状态码（400、401、500、502、503），并在 `catch` 分支用 `console.error` 记录日志后返回通用错误消息。
- **服务端数据层（lib）**：对 Notion API 调用和 Markdown 渲染等不可信输入进行严格校验，遇到配置缺失、字段类型不匹配、内容过大、HTML 嵌套过深等情况直接 `throw new Error(...)`，由上层调用者决定是转换为 `null` 还是继续向上抛出。
- **客户端表单**：使用 `react-hook-form` + `zod` 做前端校验；提交时 `fetch` 失败会 `throw new Error(...)`，外层 `try/catch` 捕获后通过模态框（`use-modal-store`）向用户展示成功/失败提示。

## 2. 关键文件与位置

| 文件 | 职责 |
|---|---|
| `app/api/contact/route.ts` | 联系表单 API：Zod 校验请求体，环境变量缺失直接返回 500，外部 fetch 失败返回 502，异常统一 catch 返回 500 |
| `app/api/notion-webhook/route.ts` | Notion Webhook 回调：JSON 解析失败返回 400，未配置验证令牌返回 503，签名校验失败返回 401，成功后触发 `revalidatePath`/`revalidateTag` |
| `lib/blogs.ts` | 博客数据加载：集中处理 Notion 配置校验、属性类型检查、分页游标、重复 slug 检测、缓存失效；对 Notion 的 `ObjectNotFound` 错误特殊处理为 `null` |
| `lib/blog-markdown.ts` | Markdown → HTML 渲染：限制最大字节数（2MB）、限制 HTML 最大嵌套深度（100），超出则抛错 |
| `components/forms/contact-form.tsx` | 客户端联系表单：`zodResolver` 前端校验，`fetch` 失败抛错并通过模态框反馈给用户 |
| `components/ui/form.tsx` | Form UI 封装：`useFormField` 内部抛错提示误用，UI 层根据 `error` 字段渲染破坏性样式 |

## 3. 架构与约定

### 3.1 API 层错误响应约定
- 所有 API Route 都显式设置 HTTP 状态码，不使用默认 200 表示错误。
- 参数/配置错误优先返回 4xx（如 400 Invalid JSON、401 Invalid signature），服务端内部异常返回 5xx（500 Internal error、502 Failed to submit the form、503 Webhook verification is not configured）。
- 错误信息以纯字符串或 `{ error: string }` JSON 形式返回，不包含堆栈。

### 3.2 服务端数据层错误模型
- 使用 `throw new Error(message)` 表达“不可恢复的数据/配置错误”，例如 Notion 属性缺失、类型不符、slug 重复、Markdown 超限等。
- 对可预期的“不存在”场景（Notion ObjectNotFound）使用 `isNotionClientError(error) && error.code === APIErrorCode.ObjectNotFound` 判断并返回 `null`，而非抛错。
- 配置缺失分两种：完全缺失时 `console.warn` + 返回空结果（博客禁用）；部分缺失时直接抛错（token 与 dataSourceId 必须成对出现）。

### 3.3 输入校验与防御性编程
- 使用 `zod` 在 API 入口（`contactSchema`）与数据映射（`notionBlogRecordSchema`）两处做结构化校验。
- 对 Notion 返回的富文本、日期、标签、封面图等每个属性都有独立的 getter 函数，类型不匹配即抛错，避免隐式 `undefined` 传播。
- 对 Markdown 渲染前做大小限制（`MAX_MARKDOWN_BYTES = 2_000_000`）和 HTML 深度限制（`MAX_NOTION_HTML_DEPTH = 100`），防止 DoS 或内存溢出。

### 3.4 客户端错误呈现
- 表单提交失败通过 `storeModal.onOpen({ title, description, icon })` 打开模态框，区分成功（successAnimated）与失败（warning）图标。
- 表单字段级错误由 `react-hook-form` + `zod` 自动注入到 `FormMessage`，无需手动管理。

## 4. 约定与约束

- **API Route 必须返回明确状态码**：代码中所有分支都显式指定了 400/401/500/502/503，没有依赖默认 200。
- **服务端数据层对非法输入一律抛错**：`lib/blogs.ts` 与 `lib/blog-markdown.ts` 中对 Notion 属性类型、slug 格式、Markdown 大小、HTML 深度的校验全部通过 `throw new Error(...)` 中断执行。
- **可预期缺失走 null 路径**：`getBlogPost`、`loadBlogPost` 对找不到页面或 ObjectNotFound 返回 `null`，由调用方决定是否降级显示。
- **Webhook 安全校验前置**：JSON 解析、令牌长度/字符集校验、签名验证都在执行业务逻辑之前完成，任一失败立即返回对应状态码。
- **无全局错误边界或自定义 Error 类**：未发现 `Error` 子类、错误码枚举（除 Notion SDK 的 `APIErrorCode`）、全局 `unhandledrejection` 处理器或 Next.js `error.tsx` 页面。
- **日志仅用于调试**：`console.error` 与 `console.warn` 用于记录异常与配置缺失，不替代返回值中的错误信息。
