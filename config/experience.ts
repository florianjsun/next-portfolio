import type { ValidSkills } from "@/config/constants";

export interface ExperienceInterface {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: Date;
  endDate: Date | "Present";
  description: [string, ...string[]];
  achievements: string[];
  skills: ValidSkills[];
  companyUrl?: string;
  logo?: string;
}

export const experiences: ExperienceInterface[] = [
  {
    id: "taian-dongxin-zhilian",
    position: "Java 开发工程师",
    company: "泰安市东信智联信息科技有限公司",
    location: "山东泰安",
    startDate: new Date("2023-07-01"),
    endDate: new Date("2025-06-01"),
    description: [
      "参与泰山易停&小停泊车、泰山易行、泰发展智慧园区等项目，负责需求分析、方案设计、核心功能开发与日常维护。",
      "负责停车订单同步与检索、路内停车、设备网关、监管平台数据上报及日志采集等模块，推动智慧交通业务数字化。",
      "使用 Spring Cloud Alibaba、Redis、RabbitMQ、Netty、MySQL、Elasticsearch 等技术，支持多协议物联网设备统一接入与高并发业务处理。",
      "基于 Spring AI、MCP 协议与 Qwen3 实现智能停车助手，支持停车场余位、营收和路线等智能问答。",
    ],
    achievements: [
      "支撑泰山易停&小停泊车平台接入 200 余家停车场、200 万注册用户及日均约 5 万笔订单。",
      "采用线程池与 Canal 监听 Binlog 实现订单增量数据实时同步，保障 Elasticsearch 与 MySQL 数据一致性。",
      "基于 Netty 支持 TCP、UDP、MQTT 多协议设备接入，可同时连接数千台不同品牌、不同类型的硬件设备。",
      "支撑 2000 余辆共享电单车统一管理，车辆日均在线率超过 95%，日均同步车辆及订单数据超过 5 万条。",
      "建设百万级设备、运维及操作日志采集分析能力，将运维问题定位效率提升 50%。",
      "实现智慧园区 100 余台物联终端的统一监控与数据归集，提升运维效率 30%。",
    ],
    skills: [
      "Java",
      "Spring Boot",
      "Spring Cloud Alibaba",
      "Spring AI",
      "MCP",
      "MySQL",
      "Redis",
      "RabbitMQ",
      "Netty",
      "Elasticsearch",
      "Kubernetes",
    ],
    companyUrl: "https://www.dongxinzhilian.com",
    logo: "/experience/dongxin-zhilian-logo.png",
  },
  {
    id: "luliang-university",
    position: "计算机科学与技术专业",
    company: "吕梁学院",
    location: "山西吕梁",
    startDate: new Date("2019-01-01"),
    endDate: new Date("2023-01-01"),
    description: ["2019 年至 2023 年就读于吕梁学院计算机科学与技术专业。"],
    achievements: ["软考中项软件设计师证书"],
    skills: [],
    companyUrl: "https://www.llu.edu.cn/",
    logo: "/experience/luliang-university-logo.png",
  },
];
