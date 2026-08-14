---
kind: frontend_style
name: 基于 Tailwind CSS v4 + shadcn/ui 的主题化设计系统
category: frontend_style
scope:
    - '**'
source_files:
    - app/globals.css
    - postcss.config.js
    - components.json
    - lib/fonts.ts
    - lib/utils.ts
    - components/common/theme-provider.tsx
    - app/layout.tsx
    - components/ui/button.tsx
---

## 1. 使用的系统与工具

- **CSS 框架**：Tailwind CSS v4（通过 `@import "tailwindcss"` 引入，无需传统 `tailwind.config.js`），配合 PostCSS 插件 `@tailwindcss/postcss`。
- **组件库**：shadcn/ui（`components.json` 中声明 style="default"、baseColor="zinc"、cssVariables=true），所有 UI 组件位于 `components/ui/`，使用 Radix UI 作为底层无样式基础组件。
- **变体引擎**：`class-variance-authority`（cva）用于定义组件的 variant/size 组合（如 `Button` 的 `buttonVariants`）。
- **主题切换**：`next-themes` 提供 light/dark/system 主题切换，通过 `attribute="class"` 在 `<html>` 上切换 `.dark` 类。
- **动画**：`tw-animate-css` 提供预置动画；自定义 keyframes（accordion-down/up）在 `globals.css` 的 `@theme inline` 块中注册为 Tailwind 动画。
- **字体**：`next/font` 加载 Google Fonts（Inter、Norican）与本地字体（CalSans-SemiBold），以 CSS 变量 `--font-inter`、`--font-cal-sans` 暴露给 Tailwind。

## 2. 关键文件

- `app/globals.css`：全局样式入口，包含 Tailwind v4 导入、`@custom-variant dark`、`@theme inline` 设计令牌、light/dark 两套 HSL 色板、`.blog-content` Markdown 排版、Hero 液态背景等。
- `postcss.config.js`：仅启用 `@tailwindcss/postcss`。
- `components.json`：shadcn/ui 配置，指向 `app/globals.css`，baseColor zinc，别名 `@/components`、`@/lib/utils`。
- `lib/fonts.ts`：字体导出（`fontSans`、`fontHeading`、`fontNorican`）。
- `lib/utils.ts`：`cn(...)` 工具函数，组合 `clsx` + `tailwind-merge`。
- `components/common/theme-provider.tsx`：对 `next-themes` 的薄封装。
- `app/layout.tsx`：根布局，注入 `fontSans.variable` / `fontHeading.variable`，包裹 `ThemeProvider`，设置 `bg-background font-sans antialiased`。
- `components/ui/button.tsx`：典型 shadcn 风格组件，用 cva 声明 variant/size。

## 3. 架构与设计约定

### 设计令牌（Design Tokens）
- 所有颜色、圆角、字体、动画时长统一通过 CSS 自定义属性（HSL 值）集中管理于 `:root` 与 `.dark` 选择器中，并通过 `@theme inline` 映射到 Tailwind 语义化 token（`--color-primary`、`--color-muted`、`--radius-*`、`--animate-accordion-*` 等）。
- 字体族通过 `--font-inter`、`--font-cal-sans` 变量暴露，并在 `@theme inline` 中映射为 `--font-sans`、`--font-heading`。
- 动画时长与缓动函数通过 `--d: 700ms`、`--e: cubic-bezier(0.19, 1, 0.22, 1)` 统一抽象，供卡片 hover 等过渡复用。

### 主题策略
- 使用 `next-themes` 以 `class` 模式切换 `.dark` 类，light/dark 两套 HSL 色板在 `globals.css` 中并列定义。
- 组件通过 Tailwind 语义类名（`bg-primary`、`text-foreground`、`border-border` 等）自动适配主题，无需额外逻辑。

### 响应式策略
- 采用 Tailwind 断点（sm/md/lg/xl/2xl）进行响应式布局。
- 自定义 `container` utility 通过 `@media (min-width: ...)` 实现最大宽度约束。
- Hero 液态背景与卡片 hover 效果通过 `@media (hover: hover) and (min-width: 600px)` 限定桌面交互。

### 博客内容排版
- `.blog-content` 模块集中定义 h1-h6、p、a、blockquote、pre/code、table、hr、img 等 Markdown 渲染后的样式，统一使用设计令牌色值，确保文章阅读体验一致。

### 组件样式组织
- 通用原子组件集中在 `components/ui/`，遵循 shadcn 约定：每个组件一个文件，使用 `cn()` 合并 className，通过 cva 声明变体。
- 业务组件按功能域分目录（`blogs/`、`projects/`、`experience/`、`skills/`、`forms/`、`modals/`、`backgrounds/`），共享的基础组件放 `common/`。

## 4. 约定与约束

- **样式来源单一入口**：所有样式由 `app/globals.css` 聚合，通过 `@import "tailwindcss"` 和 `@import "tw-animate-css"` 引入，禁止在其他位置重复引入 Tailwind。
- **颜色必须走设计令牌**：组件内禁止硬编码十六进制颜色，应使用 `hsl(var(--primary))` 或 Tailwind 语义类（`bg-primary`、`text-muted-foreground` 等）。
- **暗色模式通过 `.dark` 类切换**：新增颜色需同时在 `:root` 与 `.dark` 下定义对应 HSL 值。
- **组件 className 合并必须使用 `cn()`**：来自 `@/lib/utils`，基于 `clsx` + `tailwind-merge`，避免冲突。
- **字体变量通过 next/font 注入**：新增字体需在 `lib/fonts.ts` 导出并以 `variable` 形式注册 CSS 变量，再在 `@theme inline` 中映射。
- **动画时长/缓动统一引用 `--d`、`--e`**：自定义过渡不得硬编码时间或贝塞尔曲线，应复用全局变量保证一致性。
- **Markdown 内容统一通过 `.blog-content` 容器包裹**：新增排版元素需在此模块中补充样式，保持文章区域视觉一致。