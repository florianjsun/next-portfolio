---
kind: external_dependency
name: Tailwind CSS 4 样式框架
slug: tailwind-css-4-样式框架
category: external_dependency
scope:
    - '**'
---

已迁移至 Tailwind CSS 4，采用 CSS-first 配置：在 `app/globals.css` 中通过 `@import` 引入 tailwind 与 tw-animate-css，使用 `@theme inline` 声明设计令牌（颜色、字体、圆角、动画 keyframes），并通过 `@custom-variant dark` 支持暗色主题。PostCSS 插件替换为 `@tailwindcss/postcss`，不再需要 `tailwind.config.js`。主题系统由 next-themes 驱动，支持 light/dark/retro/cyberpunk/paper/aurora/synthwave 七套主题。