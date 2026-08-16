# next-portfolio

[Sun Jing](https://github.com/florianjsun) 的个人网站，面向项目、经历、技能、开源贡献与技术博客。线上地址：[https://portfolio.sunnao.wtf](https://portfolio.sunnao.wtf)

## 基于原模板二次开发

本仓库**不是**原模板的官方发行版，而是在 [namanbarkiya/minimal-next-portfolio](https://github.com/namanbarkiya/minimal-next-portfolio) 之上做的二次开发。页面结构、配置驱动内容和部分组件仍沿用原项目；站点内容、中文界面、部署方式和若干功能已按本站需求改过。

原模板作者：[Naman Barkiya](https://github.com/namanbarkiya)。原项目演示：[https://nbarkiya.xyz](https://nbarkiya.xyz)。本仓库遵循原项目的 [MIT License](LICENSE)。

相对原模板，当前仓库主要做了这些调整：

- 站点改为中文（`zh-CN`），内容换成个人简介、项目、经历与技能
- 主题收敛为浅色 / 深色 / 跟随系统，不再提供原模板的多套装饰主题
- 首页增加基于 Three.js 的 Liquid Ether 背景（来自 [React Bits](https://reactbits.dev/backgrounds/liquid-ether)，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)）
- 联系表单默认走 FormSubmit，也可改接到 Google Forms；提交接口带限流和蜜罐
- 博客继续用 Notion，并补了 Webhook 失效缓存与 Markdown 渲染校验
- 生产环境以 Docker standalone + Nginx + HTTPS 自托管，合并到 `master` 后由 CI 部署

## 功能

- 配置驱动的项目、经历、技能展示，项目详情带分类筛选和响应式图库
- 工作经历时间线与详情页
- GitHub 公开仓库与 Pull Request 贡献列表（可选 token 提高限额）
- Notion 博客：列表、详情、标签、阅读时长，以及 webhook 触发的缓存刷新
- 联系表单：Zod 校验，默认发到站点邮箱
- 明暗主题、页面动效、移动端适配
- SEO：canonical、Open Graph、robots、动态 sitemap，以及 Person / BlogPosting 等 JSON-LD
- 可选 Google Analytics；自托管时 Vercel Analytics 不会上报

## 技术栈

- **框架**：Next.js 16（App Router，`output: "standalone"`）
- **语言**：TypeScript 6、React 19
- **样式**：Tailwind CSS 4、shadcn/ui（Radix）
- **动效**：Motion；首页背景为 Three.js
- **校验**：Zod + React Hook Form
- **内容**：Notion API
- **包管理**：pnpm `10.34.5`（见 `package.json` 的 `packageManager`）
- **运行时**：Node.js 24（见 `.node-version`）

## 本地开发

需要 Node.js 24 和 pnpm。

```bash
git clone https://github.com/florianjsun/next-portfolio.git
cd next-portfolio
cp .env.copy .env
pnpm install --frozen-lockfile
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。`.env` 不要提交。未配置 Notion 时站点仍可运行，博客列表为空。

常用命令：

| 命令         | 作用                                         |
| ------------ | -------------------------------------------- |
| `pnpm dev`   | 开发服务器                                   |
| `pnpm lint`  | ESLint                                       |
| `pnpm build` | 生产构建                                     |
| `pnpm start` | 运行构建产物                                 |
| `pnpm check` | lint、类型检查、博客 Markdown 测试、Prettier |

## 环境变量

从 `.env.copy` 复制后按需填写。以 `NEXT_PUBLIC_` 开头的值会打进前端包，不要放密钥。

| 变量                                     | 说明                                       |
| ---------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                   | 对外域名；空则用 `config/site.ts` 的默认值 |
| `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID`      | Google Analytics，可空                     |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION`        | Search Console 验证，可空                  |
| `NEXT_PUBLIC_RESUME_LINK`                | `/resume` 跳转地址，可空                   |
| `NOTION_TOKEN` / `NOTION_DATA_SOURCE_ID` | 博客数据源，必须成对出现或同时为空         |
| `NOTION_BLOG_REVALIDATE_SECONDS`         | 博客缓存秒数，默认 `900`                   |
| `NOTION_WEBHOOK_VERIFICATION_TOKEN`      | Webhook HMAC 校验                          |
| `FORMSUBMIT_ID`                          | FormSubmit 激活哈希；空则用代码里的默认值  |
| `GOOGLE_FORM_*`                          | 五项都填时改走 Google Forms                |
| `GITHUB_USERNAME`                        | 贡献页用户名；缺省用 `config/site.ts`      |
| `GITHUB_TOKEN`                           | 可选，提高 GitHub API 限额                 |

Docker 构建时，`NEXT_PUBLIC_*` 和 Notion 凭证会参与预渲染。改了这些值需要重新 `docker compose build`。细节见 [docs/deploy.md](docs/deploy.md)。

## Notion 博客

博客在构建时和按需从 Notion 读取。未配置凭证时博客功能关闭，其余页面不受影响。

1. 建一个全页数据库，名称建议为 `Blog Posts`，并包含下列属性（名称区分大小写）：

   | 属性          | Notion 类型      | 说明                        |
   | ------------- | ---------------- | --------------------------- |
   | `Title`       | Title            | 标题                        |
   | `Slug`        | Text             | 唯一 kebab-case slug        |
   | `Status`      | Status 或 Select | 须包含 `Draft`、`Published` |
   | `PublishedAt` | Date             | 发布日期                    |
   | `Description` | Text             | SEO 描述，最多 600 字       |
   | `Tags`        | Multi-select     | 最多 20 个                  |
   | `CoverImage`  | Text             | 站点路径或稳定 HTTPS 地址   |
   | `ReadingTime` | Number           | 可选；详情页会在缺失时估算  |
   | `Featured`    | Checkbox         | 是否出现在首页              |

2. 创建 Notion [内部集成](https://developers.notion.com/guides/get-started/internal-connections)，授予 **Read content**，并把它加到该数据库。Token 不要暴露给浏览器。

3. 在数据库设置里打开 **Manage data sources**，复制 **data source ID**（不是页面 URL 里的 database ID）。

4. 写入 `.env`：

   ```env
   NOTION_TOKEN=ntn_...
   NOTION_DATA_SOURCE_ID=...
   NOTION_BLOG_REVALIDATE_SECONDS=900
   ```

5. 写文章、填齐必填属性，把 `Status` 改为 `Published`。草稿不会出现在站点上。Slug 须唯一，并匹配 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。

封面和正文图片不要用 Notion 临时上传地址（大约一小时过期）。用 `/public` 路径或对象存储 / CDN 的稳定 HTTPS 地址。

### Webhook 即时更新

默认最多约 15 分钟刷新一次。需要发布后立刻更新时，把 Notion webhook 指到：

```text
https://portfolio.sunnao.wtf/api/notion-webhook
```

订阅 page / data source 的内容与属性事件。首次握手会下发一次性 verification token：临时打开 `NOTION_WEBHOOK_LOG_VERIFICATION_TOKEN=true`，从服务端日志复制 token，写入 `NOTION_WEBHOOK_VERIFICATION_TOKEN`，立刻把开关改回 `false`。之后的请求会做 HMAC 校验，通过后使博客缓存失效。

## 内容与配置

个人内容集中在 `config/`，改配置即可，不必先改页面组件。

| 内容                           | 文件                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| 姓名、简介、社交链接、站点 URL | `config/site.ts`                                            |
| 导航                           | `config/routes.ts`                                          |
| 页面文案与 metadata            | `config/pages.ts`                                           |
| 技能                           | `config/skills.ts`                                          |
| 项目                           | `config/projects.ts`                                        |
| 工作经历                       | `config/experience.ts`                                      |
| 贡献列表条数与缓存             | `config/contributions.ts`                                   |
| 页脚社交图标                   | `config/socials.ts`                                         |
| 博客正文                       | Notion `Blog Posts`                                         |
| 颜色与明暗主题                 | `app/globals.css`（Tailwind v4，没有 `tailwind.config.js`） |

贡献页读取 `GITHUB_USERNAME`（缺省为 `config/site.ts` 里的用户名）的公开仓库和公开 PR。结果缓存六小时。

## 部署

生产环境跑在云服务器上：Docker Compose 构建 Next.js standalone 镜像，Nginx 反代并终止 HTTPS，容器只监听 `127.0.0.1:3000`。完整步骤、Cloudflare、证书和 CI 回滚见 [docs/deploy.md](docs/deploy.md)。

```bash
cp .env.copy .env
docker compose build
docker compose up -d
```

合并到 `master` 且质量检查通过后，GitHub Actions 会 SSH 到服务器，按该 commit 构建并发布。

也可以部署到 [Vercel](https://vercel.com)。自托管时 `@vercel/analytics` 不会上报，访问统计用 Google Analytics 即可。

## 许可与致谢

- 本仓库基于 [minimal-next-portfolio](https://github.com/namanbarkiya/minimal-next-portfolio)，许可为 [MIT License](LICENSE)
- 原模板由 [Naman Barkiya](https://github.com/namanbarkiya) 编写
- 图标来自 [Lucide](https://lucide.dev/)
- 首页流体背景来自 [React Bits — Liquid Ether](https://reactbits.dev/backgrounds/liquid-ether)，附加 Commons Clause，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
