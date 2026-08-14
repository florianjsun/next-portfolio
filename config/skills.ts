import { Icons } from "@/components/common/icons";

export interface SkillsInterface {
  name: string;
  description: string;
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const skillsUnsorted: SkillsInterface[] = [
  {
    name: "Java",
    description: "扎实掌握 Java SE、集合框架、JMM、并发编程及常用设计模式。",
    rating: 5,
    icon: Icons.java,
  },
  {
    name: "Spring Boot",
    description:
      "使用 Spring、Spring MVC 与 Spring Boot 进行架构设计和后端服务开发。",
    rating: 5,
    icon: Icons.springBoot,
  },
  {
    name: "Spring Cloud Alibaba",
    description:
      "基于 Spring Cloud Alibaba 实现服务治理、负载均衡、配置与容错管理。",
    rating: 5,
    icon: Icons.alibabaCloud,
  },
  {
    name: "Spring AI",
    description:
      "将 Spring AI 与业务系统集成，实现工具调用、智能问答与多步骤执行。",
    rating: 5,
    icon: Icons.spring,
  },
  {
    name: "Agent",
    description:
      "掌握 Prompt、RAG、Agent Loop 与 Few-shot，构建可规划和执行的智能体。",
    rating: 5,
    icon: Icons.aiAgent,
  },
  {
    name: "MCP",
    description:
      "基于 MCP 协议连接业务数据和外部工具，扩展智能体的上下文与执行能力。",
    rating: 5,
    icon: Icons.mcp,
  },
  {
    name: "MySQL",
    description:
      "熟悉 InnoDB、事务、索引优化与 MVCC，具备数据库设计和性能调优经验。",
    rating: 5,
    icon: Icons.mysql,
  },
  {
    name: "Redis",
    description:
      "掌握常用数据结构、持久化与集群方案，优化缓存性能和系统可靠性。",
    rating: 5,
    icon: Icons.redis,
  },
  {
    name: "RabbitMQ",
    description: "理解消息可靠性机制，并使用延迟交换机处理订单支付超时。",
    rating: 5,
    icon: Icons.rabbitmq,
  },
  {
    name: "Elasticsearch",
    description: "用于全文检索与数据分析，并结合 Canal 同步 MySQL 增量数据。",
    rating: 5,
    icon: Icons.elasticsearch,
  },
  {
    name: "Netty",
    description:
      "基于 Netty 构建高并发、低延迟网络服务，支持多协议物联网设备接入。",
    rating: 5,
    icon: Icons.netty,
  },
  {
    name: "Nacos",
    description: "参与采用 Nacos 的微服务项目，支撑服务注册发现与配置管理。",
    rating: 5,
    icon: Icons.nacos,
  },
  {
    name: "Canal",
    description: "监听 MySQL Binlog 实现增量数据实时同步，保障检索数据一致性。",
    rating: 5,
    icon: Icons.canal,
  },
  {
    name: "Kafka",
    description: "参与采用 Kafka 的共享电单车平台开发，支撑分布式数据流转。",
    rating: 5,
    icon: Icons.apacheKafka,
  },
  {
    name: "MQTT",
    description: "使用 MQTT 等协议统一接入多品牌、多类型物联网设备。",
    rating: 5,
    icon: Icons.mqtt,
  },
  {
    name: "WebSocket / Socket.IO",
    description: "参与采用 WebSocket 与 Socket.IO 的实时双向通信项目开发。",
    rating: 5,
    icon: Icons.socketio,
  },

  {
    name: "Linux",
    description: "熟练使用 Linux 命令进行系统维护、故障排查和性能监控。",
    rating: 5,
    icon: Icons.linux,
  },
  {
    name: "Vue.js",
    description:
      "熟悉 Vue、Element Plus、Ant Design Pro 与 Vben5 等后台开发方案。",
    rating: 5,
    icon: Icons.vue,
  },
  {
    name: "InfluxDB",
    description: "参与采用 InfluxDB 的停车平台开发，支撑时序数据存储与分析。",
    rating: 5,
    icon: Icons.influxdb,
  },
  {
    name: "MinIO",
    description: "参与采用 MinIO 的业务平台开发，支撑对象与文件资源存储。",
    rating: 5,
    icon: Icons.minio,
  },
  {
    name: "Kubernetes",
    description: "参与采用 K8S 部署的微服务项目开发与维护。",
    rating: 5,
    icon: Icons.kubernetes,
  },
];

export const skills = skillsUnsorted
  .slice()
  .sort((a, b) => b.rating - a.rating);

export const featuredSkills = skills.slice(0, 6);
