---
kind: external_dependency
name: Vercel 部署与分析平台
slug: vercel
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
source_files:
    - package.json
    - app/manifest.ts
    - app/sitemap.ts
    - .env.copy
---

### 身份与角色
- 本项目声明为 Next.js 16 + React 19 的开发者作品集模板，官方推荐部署平台为 Vercel（README 提供一键部署链接）。
- 通过 `@next/third-parties` 集成 **Vercel Analytics** 作为前端分析采集端。

### 集成点
- `app/manifest.ts`：生成 Web App Manifest，由 Vercel/浏览器读取以支持 PWA 行为。
- `app/sitemap.ts`：构建期生成站点地图，供搜索引擎抓取。
- `.env.copy`：`NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` 等环境变量在 Vercel 构建时注入。

### 稳定约束
- 项目使用 App Router + RSC，依赖 Turbopack（Next 16），与 Vercel 的默认构建/运行环境一致；若迁移到其他平台需自行处理 Turbopack、Sitemap/Manifest 生成流程。