---
kind: external_dependency
name: Google Analytics 埋点
slug: google-analytics
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
source_files:
    - .env.copy
    - README.md
---

### 身份与角色
- 通过 `@next/third-parties` 集成 Google Analytics，使用 `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` 注入测量 ID。

### 集成点
- 环境变量来自 `.env.copy`，部署前需替换占位值 `G-XXXXXXXXXX`。
- README 明确列出 GA 为分析方案之一。

### 稳定约束
- 仅通过 Measurement ID 鉴权；更换账号需更新对应环境变量。