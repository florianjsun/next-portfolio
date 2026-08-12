---
kind: frontend_style
name: 基于 Tailwind CSS v4 + shadcn/ui 的多主题原子化样式体系
category: frontend_style
scope:
    - '**'
source_files:
    - app/globals.css
    - postcss.config.js
    - components.json
    - components/ui/button.tsx
    - components/common/theme-provider.tsx
    - components/common/mode-toggle.tsx
    - lib/utils.ts
    - assets/fonts/CalSans-SemiBold.ttf
    - assets/fonts/Inter-Regular.ttf
---

## 1. 使用的系统与工具

- **CSS 框架**：Tailwind CSS v4（通过 `@import "tailwindcss"` 零配置引入，无传统 `tailwind.config.js`）。
- **PostCSS 插件**：仅启用 `@tailwindcss/postcss`（见 `postcss.config.js`），由 Tailwind v4 自动处理。
- **组件库**：shadcn/ui（`components.json` 中声明 `style: "default"`、`baseColor: "zinc"`、`cssVariables: true`），所有 UI 原语位于 `components/ui/`，通过 Radix UI 底层实现。
- **变体系统**：使用 `class-variance-authority`（cva）为按钮等组件定义 `variant` / `size` 组合（如 `button.tsx` 中的 `buttonVariants`）。
- **动画库**：`tw-animate-css` 提供预置动画；自定义动画（accordion-down/up）在 `globals.css` 的 `@theme inline` 中以 CSS 变量形式暴露。
- **主题切换**：`next-themes` 作为客户端 Provider（`components/common/theme-provider.tsx`），通过给 `<html>` 添加 class 切换主题。
- **字体**：本地字体文件置于 `assets/fonts/`（Inter、CalSans-SemiBold），通过 CSS 变量 `--font-inter`、`--font-cal-sans` 注入到 `--font-sans` / `--font-heading`。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `app/globals.css` | 全局样式入口：Tailwind 导入、`@custom-variant dark`、`@utility container`、`@theme inline` 设计令牌、多套主题色板、博客 Markdown prose 样式 |
| `postcss.config.js` | PostCSS 配置，仅挂载 `@tailwindcss/postcss` |
| `components.json` | shadcn/ui 元数据：RSC、TSX、Tailwind CSS 路径、别名 `@/components`、`@/lib/utils` |
| `components/ui/*.tsx` | 原子级 UI 组件（Button、Card、Dialog、Tabs、Tooltip、Modal、Input、Form 等），统一基于 cva + cn 构建 |
| `components/common/theme-provider.tsx` | 封装 `next-themes` 的 ThemeProvider |
| `components/common/mode-toggle.tsx` | 主题切换开关（暗色/亮色/复古/赛博朋克/极光/合成波/纸张） |
| `assets/fonts/*` | Inter、CalSans 字体资源 |
| `lib/utils.ts` | 提供 `cn()`（clsx + tailwind-merge）用于类名合并 |

## 3. 架构与约定

### 3.1 设计令牌（Design Tokens）

所有视觉变量集中在 `app/globals.css` 的 `@layer base` 中，以 CSS 自定义属性形式声明：
- 语义色：`--background`、`--foreground`、`--primary`、`--secondary`、`--accent`、`--destructive`、`--muted`、`--popover`、`--card`、`--border`、`--input`、`--ring`
- 字体：`--font-sans`、`--font-heading` 分别映射到 Inter 与 CalSans
- 圆角：`--radius`、`--radius-lg/md/sm`
- 动效：`--d`（duration）、`--e`（ease cubic-bezier(0.19,1,0.22,1)）

这些变量通过 `@theme inline` 映射到 Tailwind 内置 token（如 `--color-primary`、`--font-sans`），使组件可直接消费语义化变量。

### 3.2 多主题策略

站点内置 7 套主题，均通过覆盖同一组 CSS 变量实现：
- `.root`（默认亮色）
- `.dark`（暗色）
- `.retro`（复古）
- `.cyberpunk`（赛博朋克）
- `.aurora`（极光）
- `.synthwave`（合成波）
- `.paper`（纸张）

每套主题完整覆盖上述全部语义变量，包括各自独立的 `--radius`（如 retro/paper 使用更小的圆角）。主题通过 `next-themes` 切换，配合 `mode-toggle.tsx` 提供 UI 入口。

### 3.3 响应式策略

- 容器宽度：通过自定义 `@utility container` 定义断点 640px/768px/1024px/1280px/1400px 的 `max-width`。
- 媒体查询：广泛使用 `@media (min-width: ...)` 控制卡片高度、hover 效果等。
- 移动端优先：基础样式针对小屏，大屏通过 `min-width` 增强。

### 3.4 组件样式约定

- 所有 UI 组件位于 `components/ui/`，遵循 shadcn/ui 生成规范。
- 样式通过 `class-variance-authority` 声明 `variants`（如 button 的 `default/destructive/outline/secondary/ghost/link` 与 `sm/lg/icon/default`），并通过 `cn(...)` 合并用户传入的 className。
- 组件不直接写 CSS，全部使用 Tailwind utility classes。
- 业务组件（`components/blogs/`、`components/projects/`、`components/experience/` 等）复用 `ui/` 原子组件，并组合页面级布局。

### 3.5 博客内容样式

`app/globals.css` 中 `.blog-content` 模块为 Markdown 渲染内容提供排版：标题层级、引用块、代码块、表格、图片等均按统一风格设定，且继承当前主题的 CSS 变量。

## 4. 约定与约束

- **禁止手写 Tailwind 配置**：项目未维护 `tailwind.config.js`，依赖 Tailwind v4 的零配置模式，新增样式应通过 CSS 变量或 `@utility` 扩展。
- **颜色必须走语义变量**：组件中使用 `bg-primary`、`text-foreground` 等语义类，而非硬编码 HSL/Hex 值，以保证主题切换生效。
- **主题切换通过 class 驱动**：新增主题只需在 `@layer base` 中添加新的 class 选择器并覆盖全部语义变量。
- **字体通过 CSS 变量注入**：新增字体需先在 `@theme inline` 中声明变量，再绑定到 `--font-sans`/`--font-heading`。
- **UI 组件统一用 cva + cn**：新增可复用交互组件应仿照 `button.tsx` 的模式，用 `cva` 声明变体，避免散落的条件样式。
- **动画时长/缓动统一**：全局使用 `--d`（700ms）和 `--e`（`cubic-bezier(0.19,1,0.22,1)`）作为标准动效参数，组件内通过 `calc(var(--d) * N)` 派生不同时长。
- **暗黑模式通过 `&:where(.dark, .dark *)` 变体**：`@custom-variant dark` 确保 `.dark` 下的子元素也正确匹配，无需额外选择器。