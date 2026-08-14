---
kind: logging_system
name: 基于原生 console 的轻量级日志输出
category: logging_system
scope:
    - '**'
source_files:
    - app/api/contact/route.ts
    - app/api/notion-webhook/route.ts
    - app/global-error.tsx
    - lib/blogs.ts
    - lib/github-contributions.ts
    - components/forms/contact-form.tsx
    - scripts/test-blog-markdown.mjs
---

## 1. 使用的系统/方案

该仓库**没有引入任何第三方日志框架**（如 pino、winston、bunyan、debug 等），`package.json` 中也不存在相关依赖。所有日志输出均直接使用 Node.js /浏览器内置的 `console.*` API（`console.log`、`console.warn`、`console.error`、`console.info`）。

## 2. 关键文件与位置

日志调用散落在以下文件中，按模块划分：

- **API 路由层**：
  - `app/api/contact/route.ts` — 使用 `console.error("[contact] Failed to submit contact form", error)` 记录联系表单提交失败。
  - `app/api/notion-webhook/route.ts` — 使用 `console.info(...)` 记录 Notion Webhook 接收信息。
- **全局错误处理**：
  - `app/global-error.tsx` — 使用 `console.error("[global] Unhandled application error", error)` 捕获并输出未处理的应用级异常。
- **业务逻辑层**：
  - `lib/blogs.ts` — 在博客内容解析过程中使用 `console.warn(...)` 发出警告（例如 Markdown 解析异常或数据缺失）。
  - `lib/github-contributions.ts` — 使用 `console.error(...)` 记录 GitHub 贡献数据加载失败。
- **客户端组件**：
  - `components/forms/contact-form.tsx` — 前端表单发送失败时通过 `console.error("Failed to send the contact message", err)` 输出错误。
- **测试脚本**：
  - `scripts/test-blog-markdown.mjs` — 使用 `console.log("pass ...")` 作为简单测试用例的输出标记。

## 3. 架构与约定

- **无统一 logger 初始化**：不存在 `lib/logger.ts` 之类的集中式日志配置，也没有统一的 log level 管理。
- **就地打印**：每个需要输出的位置直接调用 `console.*`，由运行时环境（Next.js 开发服务器 / Vercel 日志平台）负责输出到标准输出。
- **结构化字段**：日志消息采用**字符串前缀 + 对象参数**的方式提供上下文，例如 `[contact] Failed to submit contact form`、`[global] Unhandled application error`，便于在终端或日志系统中快速筛选来源。
- **级别选择约定**：
  - 错误场景使用 `console.error`（表单提交失败、GitHub 数据加载失败、全局未处理异常）。
  - 非致命问题使用 `console.warn`（博客解析过程中的可恢复异常）。
  - 事件性信息使用 `console.info`（Webhook 接收通知）。
  - 正常流程或测试输出使用 `console.log`。

## 4. 约定与约束

- **无强制规范**：仓库中没有 ESLint 规则、Prettier 配置或文档强制要求使用特定日志方式；当前模式是自然形成的实践。
- **生产环境行为**：由于未做 `process.env.NODE_ENV` 判断，`console.*` 调用在生产构建产物中仍会保留；日志最终由 Next.js/Vercel 运行时的 stdout/stderr 管道输出，无法自定义格式或持久化策略。
- **范围限制**：日志仅覆盖 API 路由、全局错误边界、部分 lib 和表单组件；UI 组件层（除表单外）基本不主动输出日志。
- **无日志聚合/分级开关**：没有环境变量控制日志级别，也没有将日志写入文件或发送到外部监控服务的代码。

综上，该仓库的“日志系统”本质上是**零依赖的原生 console 输出**，适用于个人作品集这类小型项目，不具备企业级日志系统的结构化、分级、采样、持久化等能力。