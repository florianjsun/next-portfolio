---
kind: external_dependency
name: Google Analytics 分析
slug: google-analytics-分析
category: external_dependency
scope:
    - '**'
---

通过 `@next/third-parties/google` 的 `GoogleAnalytics` 组件注入 GA 追踪脚本，测量 ID 来自 `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` 环境变量。若未配置则不渲染任何 GA 代码。生产环境需替换 `.env.copy` 中的占位值 `G-XXXXXXXXXX`。