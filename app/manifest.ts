import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sun Jing | 全栈 & AI应用工程师",
    short_name: "Sun Jing",
    description:
      "Sun Jing - 全栈 & AI应用工程师，正在探索如何用AI为传统业务提速。欢迎浏览我的项目、经历与贡献",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "150x150",
        type: "image/x-icon",
      },
      {
        src: "/favicon.ico",
        sizes: "150x150",
        type: "image/x-icon",
        purpose: "maskable",
      },
    ],
    categories: [
      "portfolio",
      "ai",
      "software engineering",
      "machine learning",
      "developer",
      "web development",
    ],
    lang: "zh-CN",
    dir: "ltr",
    scope: "/",
  };
}
