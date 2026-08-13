<a href="https://buymeachai.ezee.li/namanbarkiya" target="_blank" rel="noopener noreferrer"><img src="https://res.cloudinary.com/dvt5vkfwz/image/upload/v1767625332/buy_chai_naman.png" alt="Buy Me A Chai" width="200"></a>

# Next.js 16 Developer Portfolio Template

A modern, responsive, and SEO-optimized **Next.js 16 portfolio template** designed for developers, designers, and professionals. This open-source project helps you showcase your skills, experience, and projects with an elegant interface that stands out. Built with server-side rendering, TypeScript, and the latest web standards for optimal performance.

## ✨ Key Features

- **Professional Experience Timeline**: Showcase your career journey with a visually appealing timeline
- **Project Showcase**: Display your technical projects with detailed information and live demos
- **Multiple Themes**: Dark, Light, Retro, Cyberpunk, Aurora, Synthwave, and Paper themes
- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop)
- **100% Performance Score**: Fully optimized for speed and Core Web Vitals
- **SEO-Ready**: Structured data, meta tags, and optimized content
- **Modern Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS, and shadcn/ui
- **Easy Customization**: Well-organized code structure with minimal effort required
- **Animations**: Subtle animations for engaging user experience
- **Analytics Integration**: Ready for Google Analytics tracking
- **Contact Form**: Functional contact form with validation
- **Notion-Powered Blog**: Write and publish posts from a Notion database
- **Open Source**: Free to use and modify for your personal portfolio

## 🚀 Demo

View the live demo at [https://nbarkiya.xyz/](https://nbarkiya.xyz)

https://github.com/namanbarkiya/minimal-next-portfolio/assets/82203888/f93bf5ca-c2bd-4fe5-a413-1050ebf6cf78

## Ranks #1 on AI Search (top-notch AEO/GEO)

https://github.com/user-attachments/assets/fc071310-9d1c-4832-877f-23f9569893d7

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with Turbopack
- **Language**: [TypeScript 6](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Validation**: [zod 4](https://zod.dev/) + [react-hook-form](https://react-hook-form.com/)
- **Form Handling**: Server actions with validation
- **Analytics**: Google Analytics + Vercel Analytics
- **Content**: Notion API with cached, webhook-driven blog updates
- **Deployment**: [Vercel](https://vercel.com)

## 🔧 Getting Started

To get started with your own portfolio website:

1. Clone this repository:

   ```bash
   git clone https://github.com/namanbarkiya/minimal-next-portfolio.git my-portfolio
   cd my-portfolio
   ```

2. Copy the contents of `.env.copy` to a new `.env` file and fill in the required information.

3. Install dependencies with pnpm (the required version is declared in
   `package.json`):

   ```bash
   pnpm install
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your web browser to see the website.

## Notion Blog Setup

Blog pages are loaded from Notion at build time and on demand. The files under
`content/blogs/` are retained only for the optional one-time migration script;
the website does not read them at runtime.

1. Create a full-page Notion database named `Blog Posts` with the following
   properties. Property names are case-sensitive.

   | Property      | Notion Type      | Notes                                     |
   | ------------- | ---------------- | ----------------------------------------- |
   | `Title`       | Title            | Post title                                |
   | `Slug`        | Text             | Unique kebab-case URL slug                |
   | `Status`      | Status or Select | Options must include `Draft`, `Published` |
   | `PublishedAt` | Date             | Public publication date                   |
   | `Description` | Text             | SEO description, up to 600 characters     |
   | `Tags`        | Multi-select     | Up to 20 tags                             |
   | `CoverImage`  | Text             | Site path or stable HTTPS URL             |
   | `ReadingTime` | Number           | Optional; details pages estimate if empty |
   | `Featured`    | Checkbox         | Makes the post eligible for the home page |

2. Create an
   [internal Notion connection](https://developers.notion.com/guides/get-started/internal-connections)
   with **Read content** access. Add the connection to the `Blog Posts`
   database. Never expose its token to browser code.

3. In the database settings, open **Manage data sources**, use the `•••` menu
   for the source, and select **Copy data source ID**. This is different from
   the database ID in the page URL.

4. Put the credentials in `.env.local`:

   ```env
   NOTION_TOKEN=ntn_...
   NOTION_DATA_SOURCE_ID=...
   NOTION_BLOG_REVALIDATE_SECONDS=900
   ```

5. Create a database page, fill every required property, write the post in its
   page body, and change `Status` to `Published`. Draft pages are never returned
   by the site. Slugs must be unique and match
   `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

### Migrate the included Markdown posts

Preview the idempotent migration with read-only access:

```bash
pnpm migrate:blogs:notion
```

Then temporarily grant the connection permission to insert content and create
only the missing pages by explicitly enabling write mode:

```bash
pnpm migrate:blogs:notion -- --write
```

Migrated pages are always created as `Draft`. Review them in Notion, publish
them, verify the existing `/blogs/<slug>` URLs, and then remove the connection's
write permission. Existing slugs and local cover-image paths are preserved.

### Automatic updates with a webhook

The fallback cache refreshes every 15 minutes by default. For faster updates,
create a Notion connection webhook pointing to:

```text
https://your-domain.example/api/notion-webhook
```

Subscribe to page and data-source content/property events. During the initial
handshake, the endpoint writes the one-time verification token to the server
log. Save it as `NOTION_WEBHOOK_VERIFICATION_TOKEN`, redeploy, and complete the
verification in Notion. Subsequent deliveries are HMAC-verified before the blog
cache is invalidated.

Notion-hosted files use signed URLs that expire after about one hour. Use local
`/public` paths or stable HTTPS object-storage/CDN URLs for `CoverImage` and
images in article bodies. Temporary Notion-upload URLs are deliberately not
rendered by the site.

## 🎨 Customization

Easily personalize your portfolio using the configuration files below:

| Section            | How to Customize                                       | File Location             |
| ------------------ | ------------------------------------------------------ | ------------------------- |
| **Personal Info**  | Edit your name, bio, and social links                  | `config/site.ts`          |
| **Skills**         | Add or modify the technologies and skills you showcase | `config/skills.ts`        |
| **Projects**       | Highlight your technical projects                      | `config/projects.ts`      |
| **Experience**     | Add your work and professional experience              | `config/experience.ts`    |
| **Contributions**  | Display open-source/community contributions            | `config/contributions.ts` |
| **Blog Content**   | Write and publish posts                                | Notion `Blog Posts`       |
| **Colors & Theme** | Customize color palette and themes                     | `tailwind.config.js`      |

All configuration files are well-organized and documented for a smooth customization process.

## 🌟 Features In Detail

### Professional Experience Timeline

An interactive, animated timeline that showcases your career journey with expandable sections for details about each position and company.

### Project Showcase

Display your technical projects with detailed information, technologies used, live demo links, and comprehensive project descriptions.

### Skills Showcase

Visually represent your technical and soft skills with customizable ratings and categories.

### Contact Form Integration

A ready-to-use contact form that can connect to various backend services.

### SEO Optimization

Built-in SEO features with proper meta tags, structured data, and semantic HTML.

## 📱 Performance and Responsiveness

![best-portfolio-website-score](https://github.com/namanbarkiya/minimal-next-portfolio/assets/82203888/3fb9c94d-9d99-4e98-92ea-14aadc91b568)
![100-score-vercel](https://github.com/namanbarkiya/minimal-next-portfolio/assets/82203888/7cfe28cc-b619-4199-9dab-1cf16723b86d)

This template is optimized for:

- 100% Lighthouse score
- Excellent Core Web Vitals metrics
- Responsive design across all device sizes
- Fast loading times with proper image optimization

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- Design inspired by modern portfolio best practices
- Built by [Naman Barkiya](https://github.com/namanbarkiya)
- Icons from [Lucide](https://lucide.dev/)

## 💻 Deploy on Vercel

The easiest way to deploy your portfolio is using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), the platform from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=namanbarkiya/minimal-next-portfolio&type=Date)](https://star-history.com/#namanbarkiya/minimal-next-portfolio&Date)

---

**Built with ❤️ by [Naman Barkiya](https://github.com/namanbarkiya)**
