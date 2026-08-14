---
kind: logging_system
name: 基于原生 console 的轻量日志输出（无专用日志框架）
slug: logging_system
category: logging_system
scope:
    - '**'
---

## 1. 使用的系统/方案

该仓库没有引入任何第三方日志框架（如 pino、winston、bunyan、loglevel、@sentry 等），也没有自定义 logger 模块。所有日志输出均直接使用 Node.js /浏览器内置的 `console` API：
- `console.error`：用于错误场景（API 失败、前端表单提交失败）
- `console.warn`：用于非致命告警（Notion 配置缺失、包含不支持的 block）
- `console.info`：在 Notion webhook 路由中记录信息性事件

未使用结构化字段、日志级别枚举、统一前缀格式或日志收集器。

## 2. 关键文件

| 文件 | 用途 |
|---|---|
| `app/api/contact/route.ts` | Serverless API 层，捕获异常后 `console.error` 并返回 500 |
| `components/forms/contact-form.tsx` | 客户端表单，`catch(err)` 后 `console.error` 并弹出用户提示 |
| `lib/blogs.ts` | Notion 博客数据加载，配置缺失时 `console.warn`（带一次性标记避免重复打印），渲染时检测到未知 block 也 `console.warn` |
| `app/api/notion-webhook/route.ts` | Webhook 入口，使用 `console.info` 记录请求信息 |

## 3. 架构与约定

- **无集中式初始化**：不存在 `lib/logger.ts`、`config/logging.ts` 之类的初始化入口；每个调用点直接依赖全局 `console`。
- **按作用域加前缀**：仅在 API 路由中使用方括号前缀标识来源，例如 `[contact] Failed to submit contact form`；其他位置仅输出纯文本消息。
- **一次性警告模式**：`lib/blogs.ts` 通过模块级布尔变量 `didWarnAboutMissingConfig` 确保“Notion blog is disabled”警告只打印一次，避免每次构建/请求都刷屏。
- **错误即抛出 + 顶层 catch 打日志**：`lib/blogs.ts` 内部大量使用 `throw new Error(...)` 表达业务校验失败；上层 `loadBlogPost` 对 Notion 特定错误（`ObjectNotFound`）做特殊处理返回 `null`，其他错误继续抛出；API 路由则在 `try/catch` 中 `console.error` 后返回 5xx。
- **客户端与服务端分离**：`components/forms/contact-form.tsx` 是 `"use client"` 组件，其 `console.error` 输出到浏览器控制台；`app/api/*` 中的 `console.*` 输出到 Vercel/Node 运行时的 stdout/stderr。

## 4. 约定与约束

- **无强制规范**：仓库中没有 ESLint 规则、Prettier 配置或文档禁止/要求使用 `console`，因此当前做法属于“随用随写”风格。
- **实际观察到的约束**：
  - 仅在服务端代码（Next.js API Route、`server-only` 的 `lib/blogs.ts`）和客户端表单中直接调用 `console`，未在 UI 组件中输出日志。
  - 对可恢复的降级场景（Notion 未配置、存在未知 block）使用 `console.warn`；对不可恢复的错误使用 `console.error` 并配合 HTTP 状态码或抛出异常。
  - 不向日志中注入结构化字段（如 `timestamp`、`requestId`、`userId`），也不将日志写入文件或外部服务。
- **部署环境**：由于项目托管在 Vercel（从 `.next/`、`next.config.js`、`pnpm-lock.yaml` 可推断），这些 `console.*` 输出最终由 Vercel Functions 的 stdout/stderr 承载，未见额外的日志采集集成。

综上，该仓库的日志系统是**完全原生的、分散的、无抽象层的 console 输出**，适合个人作品集站点的规模；若未来需要结构化日志、分级过滤或集中采集，需新建统一的 logger 模块并替换现有 `console.*` 调用。