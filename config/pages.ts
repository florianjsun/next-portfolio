import { ValidPages } from "./constants";

type PagesConfig = {
  [key in ValidPages]: {
    title: string;
    description: string;
    metadata: {
      title: string;
      description: string;
    };
    // featuredDescription: string;
  };
};

export const pagesConfig: PagesConfig = {
  home: {
    title: "主页",
    description: "欢迎来到我的个人网站。",
    metadata: {
      title: "主页",
      description: "Sun Jing的个人网站",
    },
  },
  skills: {
    title: "技能",
    description: "定义我职业身份的核心技能。",
    metadata: {
      title: "技能",
      description: "Sun Jing的核心技能，定义了他的职业身份。",
    },
  },
  projects: {
    title: "项目",
    description: "展示我的项目经验和技术成果。",
    metadata: {
      title: "项目",
      description: "Sun Jing的项目经验和技术成果。",
    },
  },
  contact: {
    title: "联系",
    description: "欢迎联系，探索合作机会。",
    metadata: {
      title: "联系",
      description: "欢迎联系，探索合作机会。",
    },
  },
  contributions: {
    title: "开源贡献",
    description: "开源贡献与社区参与。",
    metadata: {
      title: "开源贡献",
      description: "Sun Jing的开源贡献与社区参与。",
    },
  },
  resume: {
    title: "简历",
    description: "Sun Jing的简历。",
    metadata: {
      title: "简历",
      description: "Sun Jing的简历。",
    },
  },
  blogs: {
    title: "博客",
    description: "AI、技术、生活等方面的感悟和思考。",
    metadata: {
      title: "博客",
      description: "Sun Jing的博客 —— AI、技术、生活等方面的感悟和思考。",
    },
  },
  experience: {
    title: "工作经历",
    description: "职业历程与发展轨迹。",
    metadata: {
      title: "工作经历",
      description: "Sun Jing的职业历程与发展轨迹。",
    },
  },
};
