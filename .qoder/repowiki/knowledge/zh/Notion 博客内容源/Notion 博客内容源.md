---
kind: external_dependency
name: Notion 博客内容源
slug: notion-博客内容源
category: external_dependency
scope:
    - '**'
---

项目预留了 Notion 博客能力：通过 `@notionhq/client` SDK 读取 Notion Database 内容，配合 `NOTION_TOKEN`、`NOTION_DATA_SOURCE_ID`、`NOTION_WEBHOOK_VERIFICATION_TOKEN` 及 `NOTION_BLOG_REVALIDATE_SECONDS` 环境变量实现增量 revalidate。当前博客仍走文件系统 Markdown，Notion 路径可作为后续扩展的数据源。