---
kind: external_dependency
name: Google Forms 联系人表单后端
slug: google-forms-联系人表单后端
category: external_dependency
scope:
    - '**'
---

联系表单的后端通过 Next.js API Route (`app/api/contact/route.ts`) 将表单数据 POST 到 Google Forms 的预填链接 `/formResponse?fieldId=value`。需配置的环境变量包括 `GOOGLE_FORM_LINK`（预填表单 URL）以及 `GOOGLE_FORM_FIELD_ID_NAME/EMAIL/MESSAGE/SOCIAL`（各字段对应的 entry field id）。未配置时返回 500。该方案无需 Google API Key，仅依赖公开表单的预填能力。