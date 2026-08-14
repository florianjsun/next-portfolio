---
kind: external_dependency
name: Convot 第三方聊天挂件
slug: convot-第三方聊天挂件
category: external_dependency
scope:
    - '**'
---

在根布局中以 `<Script>` 动态加载 `https://convot.xyz/widget.js`，并附带 `data-token` 与 `data-api-url=https://api.convot.xyz` 参数，用于在所有页面挂载第三方聊天机器人组件。token 为服务端环境变量注入，不应硬编码在仓库中。