# SEO优化

<cite>
**本文引用的文件**
- [lib/metadata.ts](file://lib/metadata.ts)
- [app/layout.tsx](file://app/layout.tsx)
- [app/(root)/layout.tsx](file://app/(root)/layout.tsx)
- [app/(root)/page.tsx](file://app/(root)/page.tsx)
- [app/(root)/blogs/page.tsx](file://app/(root)/blogs/page.tsx)
- [app/(root)/blogs/[slug]/page.tsx](file://app/(root)/blogs/[slug]/page.tsx)
- [app/(root)/contact/page.tsx](file://app/(root)/contact/page.tsx)
- [app/(root)/contributions/page.tsx](file://app/(root)/contributions/page.tsx)
- [app/(root)/experience/page.tsx](file://app/(root)/experience/page.tsx)
- [app/(root)/projects/page.tsx](file://app/(root)/projects/page.tsx)
- [app/(root)/skills/page.tsx](file://app/(root)/skills/page.tsx)
- [app/sitemap.ts](file://app/sitemap.ts)
- [app/manifest.ts](file://app/manifest.ts)
- [public/robots.txt](file://public/robots.txt)
- [config/site.ts](file://config/site.ts)
- [config/pages.ts](file://config/pages.ts)
- [lib/json-ld.ts](file://lib/json-ld.ts)
</cite>

## 更新摘要
**所做更改**
- 新增集中式元数据系统章节，详细介绍 `lib/metadata.ts` 中的 `createPageMetadata` 函数
- 更新核心组件部分，反映新的元数据管理架构
- 添加新页面使用集中式元数据系统的示例
- 更新架构图表以展示新的元数据流向
- 增强故障排查指南，包含新系统的调试方法

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考量](#性能考量)
8. [故障排查指南](#故障排查指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介
本文件为Next.js投资组合的SEO优化提供系统化文档，覆盖搜索引擎优化策略、元数据配置、结构化数据实现与站点地图生成。重点说明Open Graph标签、Twitter卡片、JSON-LD标记与语义化HTML的使用，并给出SEO最佳实践、关键词优化与内容结构化方法，以及SEO测试工具与监控指标建议。

**最新更新**：项目现已采用集中式元数据管理系统，通过 `lib/metadata.ts` 中的 `createPageMetadata` 函数提供一致的SEO配置，包括Open Graph标签、Twitter卡片、规范URL和社交媒体集成。

## 项目结构
本项目采用Next.js App Router组织页面与布局：
- 根布局集中定义全局元数据（标题模板、描述、关键词、OG/Twitter、图标、manifest、canonical、robots、Google验证等）
- **新增**：集中式元数据系统 `lib/metadata.ts` 提供统一的页面元数据生成器
- 各路由页面按需使用集中式函数或自定义元数据
- 站点地图由服务端函数动态生成，包含静态路由与博客文章
- PWA manifest用于PWA能力与分享展示
- robots.txt声明爬虫策略与站点地图位置
- JSON-LD通过统一序列化器注入到页面中

```mermaid
graph TB
A["根布局<br/>app/layout.tsx"] --> B["站点级元数据<br/>siteConfig"]
A --> C["Open Graph / Twitter<br/>全局配置"]
A --> D["图标与Manifest<br/>icons/manifest"]
E["集中式元数据系统<br/>lib/metadata.ts"] --> F["createPageMetadata函数"]
F --> G["标准化OG标签"]
F --> H["Twitter卡片"]
F --> I["规范URL"]
J["页面使用<br/>contact/projects/experience等"] --> E
K["首页<br/>app/(root)/page.tsx"] --> L["Person + SoftwareApplication JSON-LD"]
M["博客列表<br/>app/(root)/blogs/page.tsx"] --> N["CollectionPage + Blog JSON-LD"]
O["博客详情<br/>app/(root)/blogs/[slug]/page.tsx"] --> P["BlogPosting + BreadcrumbList JSON-LD"]
Q["站点地图<br/>app/sitemap.ts"] --> R["静态路由 + 动态博客"]
S["robots.txt"] --> T["允许抓取 + Sitemap地址"]
```

**图表来源**
- [lib/metadata.ts:12-59](file://lib/metadata.ts#L12-L59)
- [app/layout.tsx:17-80](file://app/layout.tsx#L17-L80)
- [app/(root)/page.tsx:29-81](file://app/(root)/page.tsx#L29-L81)
- [app/(root)/blogs/page.tsx:12-119](file://app/(root)/blogs/page.tsx#L12-L119)
- [app/(root)/blogs/[slug]/page.tsx:43-83](file://app/(root)/blogs/[slug]/page.tsx#L43-L83)
- [app/sitemap.ts:8-74](file://app/sitemap.ts#L8-L74)
- [public/robots.txt:1-7](file://public/robots.txt#L1-L7)

**章节来源**
- [lib/metadata.ts:12-59](file://lib/metadata.ts#L12-L59)
- [app/layout.tsx:17-80](file://app/layout.tsx#L17-L80)
- [app/(root)/page.tsx:29-81](file://app/(root)/page.tsx#L29-L81)
- [app/(root)/blogs/page.tsx:12-119](file://app/(root)/blogs/page.tsx#L12-L119)
- [app/(root)/blogs/[slug]/page.tsx:43-83](file://app/(root)/blogs/[slug]/page.tsx#L43-L83)
- [app/sitemap.ts:8-74](file://app/sitemap.ts#L8-L74)
- [public/robots.txt:1-7](file://public/robots.txt#L1-L7)

## 核心组件
- **集中式元数据系统**：`lib/metadata.ts` 中的 `createPageMetadata` 函数提供统一的页面元数据生成，确保所有页面具有一致的SEO配置
- 全局元数据与社交分享：在根布局集中配置标题模板、描述、关键词、作者、Open Graph、Twitter卡片、图标、manifest、canonical、robots策略与Google验证令牌
- 站点地图：按优先级与更新频率维护静态页面，并动态聚合博客文章
- 结构化数据：首页注入个人与软件应用信息；博客列表注入集合页与博客集合；博客详情注入文章与面包屑
- PWA清单：定义应用名称、描述、启动路径、主题色、图标与分类
- robots.txt：允许所有爬虫访问根路径，并指向站点地图

**章节来源**
- [lib/metadata.ts:12-59](file://lib/metadata.ts#L12-L59)
- [app/layout.tsx:17-80](file://app/layout.tsx#L17-L80)
- [app/sitemap.ts:8-74](file://app/sitemap.ts#L8-L74)
- [app/(root)/page.tsx:29-81](file://app/(root)/page.tsx#L29-L81)
- [app/(root)/blogs/page.tsx:12-119](file://app/(root)/blogs/page.tsx#L12-L119)
- [app/(root)/blogs/[slug]/page.tsx:43-83](file://app/(root)/blogs/[slug]/page.tsx#L43-L83)
- [app/manifest.ts:3-38](file://app/manifest.ts#L3-L38)
- [public/robots.txt:1-7](file://public/robots.txt#L1-L7)

## 架构总览
下图展示了SEO相关的关键模块与数据流向：站点配置驱动全局元数据与社交分享；**新增的集中式元数据系统**提供标准化的页面元数据生成；页面级元数据覆盖默认值；结构化数据通过统一序列化器注入；站点地图与服务端渲染结合确保可索引性。

```mermaid
sequenceDiagram
participant U as "用户/爬虫"
participant L as "根布局 app/layout.tsx"
participant M as "集中式元数据 lib/metadata.ts"
participant P as "页面(首页/博客)"
participant S as "站点配置 config/site.ts"
participant SM as "站点地图 app/sitemap.ts"
participant R as "robots.txt"
U->>L : 请求页面
L->>S : 读取站点名/描述/关键词/OG图片
L-->>U : 返回带全局Meta的HTML
P->>M : 调用createPageMetadata()
M->>S : 获取站点配置
M-->>P : 返回标准化元数据
P->>P : 设置页面级Title/Description/Canonical/OG/Twitter
P->>P : 注入JSON-LD(Person/BlogPosting/CollectionPage)
U->>SM : 获取sitemap.xml
SM-->>U : 返回静态+动态URL列表
U->>R : 读取robots.txt
R-->>U : 允许抓取并指向Sitemap
```

**图表来源**
- [lib/metadata.ts:12-59](file://lib/metadata.ts#L12-L59)
- [app/layout.tsx:17-80](file://app/layout.tsx#L17-L80)
- [config/site.ts:1-39](file://config/site.ts#L1-L39)
- [app/(root)/page.tsx:29-81](file://app/(root)/page.tsx#L29-L81)
- [app/(root)/blogs/[slug]/page.tsx:43-83](file://app/(root)/blogs/[slug]/page.tsx#L43-L83)
- [app/sitemap.ts:8-74](file://app/sitemap.ts#L8-L74)
- [public/robots.txt:1-7](file://public/robots.txt#L1-L7)

## 详细组件分析

### 集中式元数据系统（新增）
**新增功能**：项目现已采用集中式元数据管理系统，通过 `lib/metadata.ts` 中的 `createPageMetadata` 函数提供统一的页面元数据生成。

- **统一接口**：`createPageMetadata` 函数接受标题、描述、路径和可选关键词参数
- **自动规范URL**：根据站点基础URL自动生成规范的canonical URL
- **标准化社交标题**：自动应用 "页面标题 | 站点名" 格式
- **完整OG标签**：包含网站类型、语言、URL、标题、描述、站点名、封面图尺寸与替代文本
- **Twitter卡片集成**：大图卡片、标题、描述、图片与创作者信息
- **关键字支持**：可选的关键字参数，支持不同类型的关键字格式

**使用示例**：
```typescript
// 在页面中使用
export const metadata = createPageMetadata({
  title: "页面标题",
  description: "页面描述",
  path: "/page-path",
  keywords: ["关键词1", "关键词2"]
});
```

**章节来源**
- [lib/metadata.ts:12-59](file://lib/metadata.ts#L12-L59)

### 全局元数据与社交分享（根布局）
- 标题模板：使用"%s | 站点名"模式，便于子页面继承
- 描述与关键词：从站点配置集中管理，保证一致性
- Open Graph：网站类型、语言、URL、标题、描述、站点名、封面图尺寸与替代文本
- Twitter卡片：大图卡片、标题、描述、图片与创作者
- 图标与Manifest：favicon、shortcut、apple图标与webmanifest路径
- Canonical：统一规范URL，避免重复内容
- Robots：允许索引与跟随，并为GoogleBot开启大预览与无片段限制
- Google验证：通过环境变量注入

**章节来源**
- [app/layout.tsx:17-80](file://app/layout.tsx#L17-L80)
- [config/site.ts:1-39](file://config/site.ts#L1-L39)

### 使用集中式元数据系统的页面
多个页面已迁移到新的集中式元数据系统，确保SEO配置的一致性：

- **联系页面** (`app/(root)/contact/page.tsx`)
- **贡献页面** (`app/(root)/contributions/page.tsx`) 
- **经验页面** (`app/(root)/experience/page.tsx`)
- **项目页面** (`app/(root)/projects/page.tsx`)
- **技能页面** (`app/(root)/skills/page.tsx`)

这些页面通过调用 `createPageMetadata` 函数获得标准化的SEO配置，包括完整的Open Graph标签、Twitter卡片和规范URL。

**章节来源**
- [app/(root)/contact/page.tsx:5-10](file://app/(root)/contact/page.tsx#L5-L10)
- [app/(root)/contributions/page.tsx:5-10](file://app/(root)/contributions/page.tsx#L5-L10)
- [app/(root)/experience/page.tsx:5-10](file://app/(root)/experience/page.tsx#L5-L10)
- [app/(root)/projects/page.tsx:6-12](file://app/(root)/projects/page.tsx#L6-L12)
- [app/(root)/skills/page.tsx:5-10](file://app/(root)/skills/page.tsx#L5-L10)

### 首页结构化数据（Person + SoftwareApplication）
- Person：姓名、主页、头像、职位、社交账号链接
- SoftwareApplication：应用名称、类别、平台、价格、作者信息
- 通过统一序列化器安全注入script标签

**章节来源**
- [app/(root)/page.tsx:29-81](file://app/(root)/page.tsx#L29-L81)
- [lib/json-ld.ts:1-9](file://lib/json-ld.ts#L1-L9)

### 博客列表页结构化数据（CollectionPage + Blog）
- CollectionPage：集合页名称、描述、URL、所属网站、作者
- Blog：博客集合信息，内嵌多篇BlogPosting（标题、描述、发布时间、URL、作者、标签、封面图）

**章节来源**
- [app/(root)/blogs/page.tsx:12-119](file://app/(root)/blogs/page.tsx#L12-L119)

### 博客详情页结构化数据（BlogPosting + BreadcrumbList）
- BlogPosting：标题、描述、发布时间与修改时间、作者、发布者、URL、主页面ID、图片、关键词、字数、阅读时长、语言、所属博客
- BreadcrumbList：首页 -> 博客 -> 当前文章的路径层级
- 页面级元数据：标题、描述、作者、关键词、canonical、OG、Twitter、Robots策略

**章节来源**
- [app/(root)/blogs/[slug]/page.tsx:43-83](file://app/(root)/blogs/[slug]/page.tsx#L43-L83)
- [app/(root)/blogs/[slug]/page.tsx:101-174](file://app/(root)/blogs/[slug]/page.tsx#L101-L174)

### 站点地图（Sitemap）
- 静态路由：首页、技能、项目、经历、贡献、博客、联系、简历，分别设置lastModified、changeFrequency与priority
- 动态路由：遍历博客元数据，为每篇文章生成独立条目，使用文章更新时间作为lastModified
- 基于站点基础URL拼接完整地址

```mermaid
flowchart TD
Start(["开始"]) --> Base["读取站点基础URL"]
Base --> Static["构建静态路由数组<br/>含优先级/频率/更新时间"]
Static --> FetchBlogs["获取博客元数据"]
FetchBlogs --> MapBlogs["映射为博客URL条目"]
MapBlogs --> Merge["合并静态与动态路由"]
Merge --> Return["返回站点地图"]
```

**图表来源**
- [app/sitemap.ts:8-74](file://app/sitemap.ts#L8-L74)

**章节来源**
- [app/sitemap.ts:8-74](file://app/sitemap.ts#L8-L74)

### PWA清单（Manifest）
- 应用名称与短名称、描述、启动路径、显示模式、背景与主题色
- 图标资源与用途（标准/可遮罩）
- 分类标签与语言方向
- 与根布局中的manifest路径保持一致

**章节来源**
- [app/manifest.ts:3-38](file://app/manifest.ts#L3-L38)
- [app/layout.tsx:62-66](file://app/layout.tsx#L62-L66)

### robots.txt
- 允许所有爬虫访问根路径
- 声明站点地图地址

**章节来源**
- [public/robots.txt:1-7](file://public/robots.txt#L1-L7)

### 语义化HTML与可访问性
- 单页单一H1：博客详情页使用H1承载文章标题
- 段落与列表：用p、ul/li等语义标签组织内容
- 图片alt：为关键图片提供有意义的替代文本
- 链接aria-label：为按钮与导航提供无障碍标签
- 这些做法有助于搜索引擎理解内容与提升可访问性

**章节来源**
- [app/(root)/blogs/[slug]/page.tsx:213-236](file://app/(root)/blogs/[slug]/page.tsx#L213-L236)
- [app/(root)/page.tsx:81-137](file://app/(root)/page.tsx#L81-L137)

## 依赖关系分析
- 站点配置site.ts被根布局、首页、博客列表与详情多处引用，形成SEO信息的单一事实源
- **新增**：集中式元数据系统 `lib/metadata.ts` 被多个页面引用，提供统一的SEO配置
- 根布局集中输出OG/Twitter/图标/manifest/robots策略，页面级仅做必要覆盖
- JSON-LD序列化器lib/json-ld.ts被首页与博客页面复用，确保脚本注入安全
- 站点地图依赖博客元数据接口，保证动态内容及时收录

```mermaid
graph LR
Site["config/site.ts"] --> Root["app/layout.tsx"]
Site --> Metadata["lib/metadata.ts"]
Metadata --> Pages["各个页面<br/>contact/projects/experience等"]
Site --> Home["app/(root)/page.tsx"]
Site --> BlogList["app/(root)/blogs/page.tsx"]
Site --> BlogDetail["app/(root)/blogs/[slug]/page.tsx"]
JsonLd["lib/json-ld.ts"] --> Home
JsonLd --> BlogList
JsonLd --> BlogDetail
Sitemap["app/sitemap.ts"] --> BlogsMeta["博客元数据接口"]
```

**图表来源**
- [config/site.ts:1-39](file://config/site.ts#L1-L39)
- [lib/metadata.ts:12-59](file://lib/metadata.ts#L12-L59)
- [app/layout.tsx:17-80](file://app/layout.tsx#L17-L80)
- [app/(root)/page.tsx:29-81](file://app/(root)/page.tsx#L29-L81)
- [app/(root)/blogs/page.tsx:12-119](file://app/(root)/blogs/page.tsx#L12-L119)
- [app/(root)/blogs/[slug]/page.tsx:43-83](file://app/(root)/blogs/[slug]/page.tsx#L43-L83)
- [lib/json-ld.ts:1-9](file://lib/json-ld.ts#L1-L9)
- [app/sitemap.ts:8-74](file://app/sitemap.ts#L8-L74)

## 性能考量
- 首屏元数据在服务端渲染时即已输出，减少客户端重绘与解析开销
- **新增**：集中式元数据系统通过函数复用减少代码重复，提高维护效率
- OG/Twitter图片建议使用合适尺寸（如1200x630），避免过大影响加载
- 站点地图按变更频率与优先级排序，帮助爬虫高效抓取
- JSON-LD以字符串形式注入，避免运行时计算带来的额外开销
- 合理使用canonical与robots策略，减少重复抓取与无效爬取

## 故障排查指南
- **集中式元数据系统问题**
  - 检查 `createPageMetadata` 函数的参数是否正确传递
  - 确认站点配置 `siteConfig` 中的URL和图像路径正确
  - 验证生成的canonical URL是否符合预期
- 社交媒体预览异常
  - 检查OG与Twitter卡片是否配置了title、description、image及尺寸
  - 确认图片URL可公开访问且响应正常
  - 参考：根布局与页面级元数据配置
- 结构化数据校验失败
  - 使用Google Rich Results Test或Schema Markup Validator校验JSON-LD
  - 确保字段类型与必填项正确（如发布日期、作者、URL）
  - 参考：首页与博客页面的JSON-LD注入位置
- 站点地图未生效
  - 确认robots.txt中Sitemap地址正确
  - 检查sitemap.xml是否包含预期URL与优先级
  - 参考：站点地图生成逻辑与robots.txt
- 重复内容问题
  - 确保每个页面设置了正确的canonical URL
  - 避免多域名或多协议导致重复
  - 参考：根布局与页面级alternates配置
- 抓取与索引控制
  - 检查robots指令是否符合预期（index/follow）
  - 针对特定页面可单独覆盖robots策略
  - 参考：根布局与博客详情页robots配置

**章节来源**
- [lib/metadata.ts:12-59](file://lib/metadata.ts#L12-L59)
- [app/layout.tsx:17-80](file://app/layout.tsx#L17-L80)
- [app/(root)/blogs/[slug]/page.tsx:43-83](file://app/(root)/blogs/[slug]/page.tsx#L43-L83)
- [app/sitemap.ts:8-74](file://app/sitemap.ts#L8-L74)
- [public/robots.txt:1-7](file://public/robots.txt#L1-L7)

## 结论
本项目通过集中化的站点配置与根布局元数据，**新增的集中式元数据系统**配合页面级覆盖与统一的JSON-LD注入，实现了完善的SEO基础能力。`createPageMetadata` 函数确保了所有页面具有一致的SEO配置，包括标准的Open Graph标签、Twitter卡片和规范URL。站点地图与robots.txt确保爬虫高效抓取，OG与Twitter卡片提升社交分享体验。建议在后续迭代中持续完善结构化数据、优化图片与内容质量，并结合SEO工具进行持续监测与调优。

## 附录

### SEO最佳实践清单
- 标题与描述：每页唯一且具吸引力，长度适中
- 关键词：围绕业务与内容主题自然分布，避免堆砌
- 语义化HTML：正确使用H1-H6、p、ul/li、figure等
- 图片优化：合理尺寸、压缩、alt文本、懒加载
- 结构化数据：Person、Article/BlogPosting、BreadcrumbList、WebSite等
- 社交分享：OG与Twitter卡片完整一致
- 站点地图：静态+动态URL，合理优先级与更新频率
- robots策略：明确允许/禁止规则，避免误屏蔽
- canonical：统一规范URL，避免重复内容
- 可访问性：aria-label、键盘可达、对比度与可读性
- **新增**：使用集中式元数据系统确保SEO配置一致性

### 关键词优化与内容结构化
- 关键词来源：站点配置keywords、页面metadata、博客tags
- 内容结构：清晰的标题层级、摘要段落、标签与分类
- 内部链接：通过导航与相关文章增强权重传递
- 更新频率：根据changeFrequency调整内容刷新节奏

**章节来源**
- [config/site.ts:19-37](file://config/site.ts#L19-L37)
- [config/pages.ts:15-80](file://config/pages.ts#L15-L80)
- [app/(root)/blogs/page.tsx:12-119](file://app/(root)/blogs/page.tsx#L12-L119)
- [app/(root)/blogs/[slug]/page.tsx:43-83](file://app/(root)/blogs/[slug]/page.tsx#L43-L83)

### SEO测试工具与监控指标
- 测试工具
  - Google Search Console：提交站点地图、查看索引状态、错误报告
  - Rich Results Test：校验结构化数据有效性
  - Schema Markup Validator：验证JSON-LD语法与语义
  - Lighthouse：性能与可访问性审计
  - 社交媒体调试器：Facebook Sharing Debugger、Twitter Card Validator
  - **新增**：Next.js元数据调试器：检查页面元数据生成结果
- 监控指标
  - 搜索表现：点击率、平均排名、曝光量、索引覆盖率
  - 抓取与索引：抓取频次、错误数、排除原因
  - 结构化数据：富结果启用数量、错误修复进度
  - 性能与体验：Core Web Vitals、移动端友好度
  - **新增**：元数据一致性：检查各页面OG标签和Twitter卡片的完整性