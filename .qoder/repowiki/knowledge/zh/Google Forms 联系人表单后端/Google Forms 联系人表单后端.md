---
kind: external_dependency
name: Google Forms 联系人表单后端
slug: google-forms
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
source_files:
    - .env.copy
    - app/api/contact/route.ts
---

### 身份与角色
- 联系表单的后端实际走 Google Forms，而非 SendGrid/Nodemailer（二者已从依赖中移除）。`api/contact/route.ts` 将表单数据 POST 到预填链接。

### 集成方式
- 通过 `.env.copy` 中的 `GOOGLE_FORM_LINK` 及 `GOOGLE_FORM_FIELD_ID_*` 字段 ID 配置目标表单与字段映射。
- 运行时通过环境变量注入，不硬编码在源码中。

### 稳定约束
- 表单提交依赖 Google Forms 的预填 URL 机制；更换后端时需保持相同的字段名约定（name/email/message/social）。