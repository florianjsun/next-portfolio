const DEFAULT_SITE_URL = "https://portfolio.sunnao.wtf";

// Client components import siteConfig, so the override has to be a
// NEXT_PUBLIC_ variable inlined at build time. Normalising to the origin keeps
// `${siteConfig.url}/blogs` and `new URL(siteConfig.url)` correct even if the
// value carries a trailing slash or path.
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;

  try {
    return new URL(configured).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  name: "Sun Jing - Java & AI应用工程师",
  authorName: "Sun Jing",
  username: "florianjsun",
  description:
    "Sun Jing - 全栈 & AI应用工程师，正在探索如何用AI为传统业务提速。欢迎浏览我的项目、经历与贡献",
  url: resolveSiteUrl(),
  links: {
    twitter: "https://x.com/florianjsun",
    github: "https://github.com/florianjsun",
    templateRepo: "https://github.com/florianjsun/next-portfolio.git",
  },
  ogImage:
    "https://res.cloudinary.com/dvt5vkfwz/image/upload/v1767384721/naman_portfolio_og_image.png",
  iconIco:
    "https://res.cloudinary.com/dbfvcn3f6/image/upload/v1692357384/assets/naman-favicon.ico",
  logoIcon:
    "https://res.cloudinary.com/dbfvcn3f6/image/upload/v1692357294/assets/naman-logo.png",
  keywords: [
    "Sun Jing",
    "Applied AI Engineer",
    "AI Engineer",
    "Software Engineer",
    "Full Stack Developer",
    "Machine Learning",
    "Data Engineering",
    "Python Developer",
    "React Developer",
    "Next.js Developer",
    "TypeScript",
    "AI Startups",
    "Software Development",
    "Web Developer",
    "Backend Developer",
    "Frontend Developer",
    "Tech Portfolio",
  ],
};
