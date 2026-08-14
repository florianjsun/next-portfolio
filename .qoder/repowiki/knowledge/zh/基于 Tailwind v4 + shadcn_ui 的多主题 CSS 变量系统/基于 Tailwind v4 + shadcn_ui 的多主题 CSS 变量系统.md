---
kind: frontend_style
name: 基于 Tailwind v4 + shadcn/ui 的多主题 CSS 变量系统
slug: frontend_style
category: frontend_style
scope:
    - '**'
---

## 1. 采用的样式体系

- **CSS 框架**：Tailwind CSS v4（通过 `@tailwindcss/postcss` 插件在 PostCSS 中启用），入口为 `app/globals.css`，使用 `@import "tailwindcss"` 语法。
- **UI 组件库**：shadcn/ui（由 `components.json` 配置，style 为 `default`，baseColor 为 `zinc`，启用 CSS Variables），所有基础 UI 组件位于 `components/ui/`，如 `button.tsx`、`card.tsx`、`dialog.tsx`、`tabs.tsx`、`tooltip.tsx`、`toast.tsx` 等，均基于 Radix UI 原语与 `class-variance-authority` (cva) 构建。
- **动画库**：`tw-animate-css`（通过 `@import "tw-animate-css"` 引入）提供预置动画；自定义动画（如 accordion-down/up）在 `@theme inline { ... }` 块内以 CSS 变量形式声明。
- **主题切换**：基于 `next-themes` 的 `ThemeProvider`（`components/common/theme-provider.tsx`），配合根布局注入 `dark` / `retro` / `cyberpunk` / `aurora` / `synthwave` / `paper` 等多套主题类名。
- **字体**：自定义字体文件存放在 `assets/fonts/`（Inter、CalSans-SemiBold），通过 CSS 变量 `--font-inter`、`--font-cal-sans` 暴露给 Tailwind 的 `--font-sans`、`--font-heading`。

## 2. 关键文件

- `app/globals.css`：全局样式核心，包含 Tailwind v4 导入、`@custom-variant dark`、`@utility container`、`@theme inline` 设计令牌、多主题 CSS 变量定义、博客 Markdown 排版样式（`.blog-content`）、卡片交互样式等。
- `postcss.config.js`：仅启用 `@tailwindcss/postcss`，无额外预处理。
- `components.json`：shadcn/ui 配置，指向 `app/globals.css`，启用 CSS Variables 模式。
- `package.json`：声明依赖 `tailwindcss ^4.3.3`、`@tailwindcss/postcss ^4.3.3`、`tw-animate-css ^1.4.0`、`next-themes ^0.4.6`、`class-variance-authority ^0.7.1`、`clsx ^2.1.1`、`tailwind-merge ^3.6.0`、`lucide-react ^1.31.0`、`motion ^13.1.0` 等。
- `components/ui/button.tsx`：典型 shadcn/ui 组件示例，使用 cva 定义变体（variant/size）并通过 `cn()` 合并 className。
- `components/common/theme-provider.tsx`：对 `next-themes` 的薄封装。

## 3. 架构与设计约定

### 设计令牌（Design Tokens）
- 所有颜色、圆角、字体、动画时长统一通过 CSS 变量暴露：`--background`、`--foreground`、`--primary`、`--muted`、`--border`、`--radius`、`--d`、`--e` 等。
- 通过 `@theme inline { --color-primary: hsl(var(--primary)); ... }` 将 CSS 变量映射为 Tailwind 语义化 token（`bg-primary`、`text-foreground` 等），使业务组件完全脱离具体色值。
- 字体通过 `--font-sans`、`--font-heading` 指向本地字体变量。

### 多主题策略
- 默认亮色主题定义在 `:root` 下；深色主题通过 `.dark` 类覆盖同一组 CSS 变量。
- 项目内置 5 套可选主题类：`.retro`、`.cyberpunk`、`.aurora`、`.synthwave`、`.paper`，每套都完整覆盖全部语义化变量，实现一键换肤。
- 主题切换由 `next-themes` 驱动，组件侧无需感知主题逻辑。

### 响应式策略
- 采用 Tailwind 原子类 + CSS `@media` 混合方式。例如 `@utility container` 用多个 `min-width` 断点控制最大宽度；`.card` 在 `min-width: 600px` 时调整高度。
- 全局 `html, body { overflow-x: hidden; }` 防止横向滚动。

### 组件样式约定
- 所有可复用 UI 组件集中在 `components/ui/`，遵循 shadcn/ui 生成规范：使用 `class-variance-authority` 声明 `variants`（如 button 的 `variant`、`size`），通过 `cn(...)` 合并用户传入 className。
- 业务领域组件（blogs、projects、experience、skills、forms、modals、common）按功能目录组织，不直接写 CSS，而是组合 Tailwind 原子类与 `components/ui/*` 中的基础组件。
- 博客内容渲染区统一使用 `.blog-content` 类包裹，Markdown 生成的 HTML 元素（h1-h6、p、blockquote、pre、table、img 等）在此处集中排版。

### 图标与动效
- 图标统一使用 `lucide-react`。
- 页面级过渡动画通过 `components/common/animated-page-transition.tsx`、`providers/animation-provider.tsx` 与 `motion` 库实现。

## 4. 约定与约束

- **样式来源单一入口**：所有样式最终汇聚于 `app/globals.css`，其他模块不得自行引入独立样式文件（除业务组件内联 className 外）。
- **颜色必须走语义变量**：禁止在组件中硬编码十六进制或 RGB 色值，应使用 `bg-primary`、`text-foreground` 等 Tailwind 语义类，底层由 CSS 变量驱动。
- **主题扩展方式**：新增主题需在 `:root` 同级添加新的类选择器（如 `.new-theme`），并完整覆盖全部语义变量（background、foreground、primary、accent、destructive、ring、radius 等），以保持各主题一致性。
- **组件样式通过 cva**：新增/修改 `components/ui/*` 中的组件时，需通过 cva 的 `variants` 声明新变体，而非新增 CSS class。
- **博客内容样式隔离**：Markdown 渲染产物必须包裹在 `.blog-content` 容器中，其内部排版规则集中维护，避免污染全局样式。
- **字体加载**：自定义字体需放入 `assets/fonts/` 并在 `globals.css` 中通过 CSS 变量引用，保持字体族统一管理。
- **PostCSS 最小化**：`postcss.config.js` 仅注册 `@tailwindcss/postcss`，不引入 SCSS/Sass/Less 等额外处理器，保证构建链路简洁。

该方案以 Tailwind v4 原子类为基础、shadcn/ui 组件库为骨架、CSS 变量为设计令牌中心，实现了可切换的多主题、一致的视觉语言与低耦合的组件样式体系。