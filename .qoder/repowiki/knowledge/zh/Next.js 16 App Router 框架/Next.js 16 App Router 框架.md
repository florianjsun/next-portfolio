---
kind: external_dependency
name: Next.js 16 App Router 框架
slug: next-js-16-app-router-框架
category: external_dependency
scope:
    - '**'
---

项目基于 Next.js 16（App Router + RSC），使用 `(root)` 路由组组织页面。通过 `app/layout.tsx` 的 `metadata` 对象集中注入 SEO、OpenGraph、Twitter Card、robots 等元数据；`app/sitemap.ts` 与 `app/manifest.ts` 分别生成站点地图和 PWA manifest，均依赖 `config/site.ts` 中的 `url` 作为基础域名。构建产物为静态站点，部署目标为 Vercel。