import { ValidCategory, ValidExpType, ValidSkills } from "./constants";

interface ProjectImageInterface {
  src: string;
  alt: string;
  width: number;
  height: number;
  display?: "full" | "compact";
}

interface PagesInfoInterface {
  title: string;
  images: ProjectImageInterface[];
  description?: string;
  layout?: "stack" | "grid";
  source?: {
    label: string;
    href: string;
  };
}

interface DescriptionDetailsInterface {
  paragraphs: string[];
  bullets: string[];
}

type ProjectTechnology =
  | ValidSkills
  | "Spring Cloud Alibaba"
  | "Nacos"
  | "RabbitMQ"
  | "Netty"
  | "Elasticsearch"
  | "InfluxDB"
  | "WebSocket"
  | "Spring AI"
  | "MCP"
  | "Canal"
  | "Qwen3"
  | "Kafka"
  | "MinIO"
  | "高德 SDK"
  | "SLS"
  | "OSS"
  | "Motion"
  | "Radix UI"
  | "Zod"
  | "Markdown";

export interface ProjectInterface {
  id: string;
  type: ValidExpType;
  companyName: string;
  category: ValidCategory[];
  shortDescription: string;
  websiteLink?: string;
  githubLink?: string;
  techStack: ProjectTechnology[];
  startDate: Date;
  endDate: Date;
  companyLogoImg: string;
  descriptionDetails: DescriptionDetailsInterface;
  pagesInfoArr: PagesInfoInterface[];
}

export const Projects: ProjectInterface[] = [
  {
    id: "next-portfolio",
    companyName: "next-portfolio",
    type: "Personal",
    category: ["Full Stack", "Web Dev", "UI/UX"],
    shortDescription:
      "基于 minimal-next-portfolio 二次开发的开源个人网站，完成中文化、内容重构、响应式项目图库与 SEO 增强。",
    githubLink: "https://github.com/florianjsun/next-portfolio",
    techStack: [
      "Next.js",
      "React",
      "Typescript",
      "Tailwind CSS",
      "Motion",
      "Radix UI",
      "Zod",
      "Markdown",
      "Vercel",
    ],
    startDate: new Date("2026-08-12"),
    endDate: new Date("2026-08-12"),
    companyLogoImg: "/projects/portfolio/home-hero.png",
    pagesInfoArr: [
      {
        title: "项目浏览与内容组织",
        description:
          "项目数据由 TypeScript 配置统一管理，列表页支持全部、个人与职业项目筛选，并以响应式卡片呈现四个项目。",
        images: [
          {
            src: "/projects/portfolio/projects-showcase.png",
            alt: "next-portfolio 项目列表与分类筛选界面",
            width: 1425,
            height: 891,
          },
        ],
      },
      {
        title: "动态项目详情与图片画廊",
        description:
          "动态路由根据项目配置生成详情页，统一展示技术栈、项目说明、图片来源、说明文字和响应式多图画廊。",
        images: [
          {
            src: "/projects/portfolio/project-detail-gallery.png",
            alt: "next-portfolio 动态项目详情与响应式图片画廊",
            width: 1425,
            height: 891,
          },
        ],
      },
      {
        title: "移动端适配",
        description:
          "导航、筛选器、项目卡片和详情图库会随屏幕宽度调整信息层级，在手机端切换为单列浏览。",
        images: [
          {
            src: "/projects/portfolio/projects-mobile.png",
            alt: "next-portfolio 手机端项目列表",
            width: 375,
            height: 812,
            display: "compact",
          },
        ],
      },
      {
        title: "多主题视觉系统",
        description:
          "基于 next-themes 与 CSS 变量实现 Light、Dark、Retro、Cyberpunk、Paper、Aurora 和 Synthwave 七套主题，并支持跟随系统设置。",
        images: [
          {
            src: "/projects/portfolio/theme-system.png",
            alt: "next-portfolio Aurora 主题与主题切换菜单",
            width: 1425,
            height: 891,
          },
        ],
      },
    ],
    descriptionDetails: {
      paragraphs: [
        "next-portfolio 是我基于 namanbarkiya 的 minimal-next-portfolio 进行二次开发的开源个人网站。项目使用 Next.js App Router 构建，围绕中文个人品牌展示重新整理了导航、首页内容、项目数据和站点配置。",
        "网站集中呈现个人简介、项目、工作经历、技能、开源贡献、技术博客和联系方式。项目、经历与技能由 TypeScript 配置驱动，博客则由 Markdown 文件生成，便于持续维护和扩展内容。",
        "在展示层之外，我还补充了多主题系统、页面动效、响应式项目图库、联系表单、分析工具和完整的 SEO 元数据，使网站同时具备作品展示、内容发布与个人检索入口三类能力。",
      ],
      bullets: [
        "基于 Next.js 16、React 19、TypeScript 6 与 Tailwind CSS 4 完成 App Router 架构升级，并使用 pnpm 管理依赖与构建流程。",
        "将项目、工作经历、技能和开源贡献抽离为类型化配置，减少页面组件与个人内容之间的耦合。",
        "重构项目模块，支持项目分类筛选、动态详情路由、多段说明、图片来源标注和响应式多图画廊。",
        "使用 gray-matter 与 remark 解析 Markdown/GFM 博客，生成文章列表、静态详情路由、标签和阅读信息。",
        "通过 Motion 提供页面和滚动动效，并基于 next-themes 实现七套视觉主题及系统主题模式。",
        "完善 canonical、Open Graph、Twitter Card、robots、动态 sitemap，以及 Person、SoftwareApplication、BlogPosting 和 BreadcrumbList JSON-LD。",
        "使用 React Hook Form 与 Zod 校验联系表单，并通过 Next.js Route Handler 将内容提交到可配置的 Google Form。",
        "集成 Vercel Analytics、可选 Google Analytics、GitHub Star 缓存接口和站内 AI 对话组件。",
      ],
    },
  },
  {
    id: "taishan-yiting",
    companyName: "泰山易停",
    type: "Professional",
    category: ["Backend", "Web Dev"],
    shortDescription:
      "面向泰安市城市级停车业务的综合管理平台，覆盖路外停车、路内停车、汽车充电与电动车充电。",
    websiteLink: "https://www.dongxinzhilian.com/scheme/show/partplatform",
    techStack: [
      "Java",
      "Spring Cloud Alibaba",
      "Nacos",
      "Redis",
      "RabbitMQ",
      "Netty",
      "MySQL",
      "Elasticsearch",
      "InfluxDB",
      "WebSocket",
      "Spring AI",
      "MCP",
      "Canal",
      "Qwen3",
    ],
    startDate: new Date("2023-07-01"),
    endDate: new Date("2025-06-30"),
    companyLogoImg: "/projects/taishan-yiting/cover.png",
    descriptionDetails: {
      paragraphs: [
        "泰山易停（含小停泊车）是面向泰安市城市级停车业务数字化转型打造的综合停车管理平台，覆盖停车场管理、订单处理、设备接入与数据分析等核心业务。",
        "我以 Java 开发工程师身份参与订单检索、智能停车助手、物联网设备接入、路内停车和支付超时处理等模块的需求分析、方案设计与功能开发。",
        "平台已接入 200 余家停车场，拥有 200 万注册用户，日均订单量约 5 万。",
      ],
      bullets: [
        "采用线程池处理订单数据同步，并结合 Canal 监听 Binlog，实现 Elasticsearch 与 MySQL 的增量数据一致性。",
        "通过门面模式统一多类型订单查询接口，结合 Elasticsearch 分词检索提升查询灵活性与响应速度。",
        "基于 Spring AI、MCP 与 Qwen3 构建智能停车助手，支持停车场余位、营收和路线等智能问答。",
        "使用 Netty 接入 TCP、UDP、MQTT 等协议，支持数千台多品牌、多类型硬件设备同时在线。",
        "参与路内停车子系统设计，基于车位相机实现车位状态实时采集与自动计费。",
        "基于 RabbitMQ 延迟交换机实现支付超时订单自动处理，提升订单处理自动化水平。",
      ],
    },
    pagesInfoArr: [
      {
        title: "平台能力总览",
        description:
          "覆盖实时监控、车场管理、无感支付、余位展示、电子发票与停充一体等能力，支撑城市停车资源统一管理。",
        images: [
          {
            src: "/projects/taishan-yiting/cover.png",
            alt: "泰山易停智慧停车运营能力总览",
            width: 2400,
            height: 1038,
          },
        ],
      },
      {
        title: "用户端核心界面",
        description:
          "从地图找车位到停车缴费、充电导航，用户可以在统一入口完成停车与充电服务。",
        layout: "grid",
        source: {
          label: "泰山易停官网",
          href: "https://www.dongxinzhilian.com/scheme/show/partplatform",
        },
        images: [
          {
            src: "/projects/taishan-yiting/app-home.png",
            alt: "泰山易停首页与附近停车场地图",
            width: 546,
            height: 1084,
          },
          {
            src: "/projects/taishan-yiting/nearby-parking.png",
            alt: "泰山易停附近停车场与余位列表",
            width: 548,
            height: 1084,
          },
          {
            src: "/projects/taishan-yiting/charging-map.png",
            alt: "泰山易停充电地图与充电车位列表",
            width: 548,
            height: 1084,
          },
        ],
      },
    ],
  },
  {
    id: "taishan-yixing",
    companyName: "泰山易行",
    type: "Professional",
    category: ["Backend", "Web Dev"],
    shortDescription:
      "泰安市共享电单车运营平台，统一管理多品牌车辆、订单、调度、运维与监管数据上报。",
    websiteLink: "https://www.dongxinzhilian.com/scheme/show/ebike",
    techStack: [
      "Java",
      "Spring Cloud Alibaba",
      "Nacos",
      "Redis",
      "MySQL",
      "Netty",
      "Kafka",
      "MinIO",
      "Elasticsearch",
      "高德 SDK",
      "SLS",
      "OSS",
      "Kubernetes",
    ],
    startDate: new Date("2023-07-01"),
    endDate: new Date("2025-06-30"),
    companyLogoImg: "/projects/taishan-yixing/cover.png",
    descriptionDetails: {
      paragraphs: [
        "泰山易行是泰安市共享电单车运营平台，提供车辆调度、订单管理、运维管理和数据上报等核心能力，并以 DDD 架构支持多品牌设备统一管理与业务扩展。",
        "我以 Java 开发工程师身份维护设备网关、对接市级监管平台、建设日志采集与运维支持模块，并参与中控协议和车辆运营工具开发。",
        "平台统一管理两大品牌、2000 余辆共享电单车，车辆日均在线率超过 95%。",
      ],
      bullets: [
        "维护并优化设备网关，支持多品牌电单车中控设备统一接入、管理和自动切换。",
        "对接市级监管平台，日均实时同步车辆、订单与运维数据超过 5 万条。",
        "建设日志采集模块，支撑每日百万级设备、运维和操作日志归集分析，问题定位时效提升 50%。",
        "参与小安中控协议对接，支持打卡、清洁车、摆车等任务，日均线上任务处理量超过 500 单。",
        "实现车辆二维码批量生成工具，累计生成二维码 5 万余个，提升车辆部署与运营效率。",
      ],
    },
    pagesInfoArr: [
      {
        title: "多端协同平台",
        description:
          "通过用户端、运营后台和设备网关协同，实现车辆实时监控、智能调度与精细化运营。",
        images: [
          {
            src: "/projects/taishan-yixing/cover.png",
            alt: "泰山易行运营后台与用户端界面总览",
            width: 1624,
            height: 920,
          },
        ],
      },
      {
        title: "产品落地与运营场景",
        description:
          "车辆投放、现场维护、平台监控、路面运营与电池充电共同构成共享电单车的完整运营闭环。",
        layout: "grid",
        source: {
          label: "泰安日报社公开报道",
          href: "https://taian.iqilu.com/taianminsheng/2026/0518/5914734.shtml",
        },
        images: [
          {
            src: "/projects/taishan-yixing/vehicle-fleet.jpg",
            alt: "泰山易行新国标共享电单车投放场景",
            width: 1084,
            height: 1466,
          },
          {
            src: "/projects/taishan-yixing/vehicle-maintenance.jpg",
            alt: "泰山易行共享电单车现场维护场景",
            width: 1084,
            height: 1416,
          },
          {
            src: "/projects/taishan-yixing/platform-operations.jpg",
            alt: "泰山易行蓝牙嗅探与监管平台技术运维场景",
            width: 1084,
            height: 1910,
          },
          {
            src: "/projects/taishan-yixing/roadside-operation.jpg",
            alt: "泰山易行绿 T 识别规范停车场景",
            width: 1080,
            height: 1920,
          },
          {
            src: "/projects/taishan-yixing/battery-charging.jpg",
            alt: "依托泰山易停资源建设的分布式电池充电柜",
            width: 1279,
            height: 1770,
          },
        ],
      },
    ],
  },
  {
    id: "taifa-smart-park",
    companyName: "泰发展智慧园区",
    type: "Professional",
    category: ["Backend", "Web Dev"],
    shortDescription:
      "面向企业园区的数字化管理平台，整合餐厨、停车与物联设备管理，提升园区运营效率。",
    websiteLink: "https://www.dongxinzhilian.com/scheme/show/park",
    techStack: ["Java", "Spring Boot", "Redis", "MySQL", "Netty", "Socket.io"],
    startDate: new Date("2023-07-01"),
    endDate: new Date("2025-06-30"),
    companyLogoImg: "/projects/taifa-smart-park/cover.png",
    descriptionDetails: {
      paragraphs: [
        "泰发展智慧园区面向企业园区数字化管理需求，整合餐厨管理、停车管理与物联设备管理三大模块，实现园区资源统一展示和智能化运营。",
        "我以 Java 开发工程师身份参与小程序身份管理、餐厨数据归集、厨房监控、访客车位预约以及物联设备统一管理等模块的需求分析与功能设计。",
        "项目已统一接入 100 余个物联终端，并为园区 1000 余人次的日常就餐登记与多维统计提供支持。",
      ],
      bullets: [
        "参与小程序快捷登录与手机号验证流程，完善园区用户身份管理。",
        "对接餐厨管理模块，归集人脸识别就餐记录并支持周、月度报表导出。",
        "参与餐厨可视化建设，餐厨大屏可实时展示每日 20 路厨房监控视频流。",
        "梳理来访车辆、车位预约与状态展示流程，高峰期支持每小时 500 余起预约，车位使用率提升 20%。",
        "参与物联设备统一管理和监控大屏设计，实现 100 余个终端的状态采集与展示，运维效率提升 30%。",
      ],
    },
    pagesInfoArr: [
      {
        title: "园区数字孪生与移动端",
        description:
          "以园区可视化大屏和移动端为入口，统一呈现安防、停车、餐厨与物联设备运行状态。",
        images: [
          {
            src: "/projects/taifa-smart-park/cover.png",
            alt: "泰发展智慧园区数字孪生大屏与移动端界面",
            width: 1624,
            height: 920,
          },
        ],
      },
      {
        title: "建设背景",
        description:
          "项目围绕数字中国、城市数字化与国有企业数字化转型要求，建设统一、可视、可持续演进的智慧园区能力。",
        source: {
          label: "泰发展智慧园区官网",
          href: "https://www.dongxinzhilian.com/scheme/show/park",
        },
        images: [
          {
            src: "/projects/taifa-smart-park/digital-china-policy.png",
            alt: "智慧园区建设背景：数字中国建设整体布局规划",
            width: 804,
            height: 552,
          },
          {
            src: "/projects/taifa-smart-park/five-year-plan.png",
            alt: "智慧园区建设背景：十四五规划和 2035 年远景目标",
            width: 804,
            height: 552,
          },
          {
            src: "/projects/taifa-smart-park/enterprise-digitalization.png",
            alt: "智慧园区建设背景：国有企业数字化转型",
            width: 804,
            height: 552,
          },
        ],
      },
    ],
  },
];

export const featuredProjects = Projects.slice(0, 4);
