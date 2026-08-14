export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
}

export interface RoutesConfig {
  mainNav: NavItem[];
}

export const routesConfig: RoutesConfig = {
  mainNav: [
    {
      title: "项目",
      href: "/projects",
    },
    {
      title: "工作经历",
      href: "/experience",
    },
    {
      title: "开源贡献",
      href: "/contributions",
    },
    {
      title: "技能",
      href: "/skills",
    },
    {
      title: "博客",
      href: "/blogs",
    },
    {
      title: "联系",
      href: "/contact",
    },
  ],
};
