# 云服务器 Docker 部署指南

把本站部署到 Linux 云服务器（阿里云、腾讯云、华为云或其他
VPS）。构建使用 Next.js `standalone` 产物，运行使用 Docker
Compose，对外用 Nginx 反代并启用 HTTPS。

Vercel 一键部署见 [README](../README.md#💻-deploy)。

## 架构

```text
浏览器
  │  HTTPS :443
  ▼
Nginx（证书、反代）
  │  HTTP 127.0.0.1:3000
  ▼
Docker 容器 next-portfolio
  │  node server.js
  ▼
Notion / GitHub / Google Forms
```

容器只监听本机 `127.0.0.1:3000`，不直接暴露到公网。公网只开放
`22`、`80`、`443`。

## 仓库里的部署文件

| 文件                        | 作用                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `Dockerfile`                | 多阶段构建：安装依赖、`pnpm build`、只拷贝 standalone 运行时 |
| `.dockerignore`             | 缩小构建上下文，并阻止 `.env` 进入镜像                       |
| `compose.yml`               | 构建参数、运行环境、健康检查、日志轮转                       |
| `deploy/nginx.conf.example` | Nginx 反代模板                                               |
| `next.config.js`            | `output: "standalone"`，生成 `.next/standalone`              |
| `.env.copy`                 | 环境变量清单                                                 |

## 服务器要求

- 系统：Ubuntu 22.04 / 24.04（其他发行版命令需自行替换）
- 配置：建议 **2 GB 内存**。1 GB 机器可以跑容器，但在服务器上构建镜像容易
  OOM，需要加 swap，或在本机构建后把镜像拷上去
- 软件：Docker Engine 24+、Compose v2 插件
- 域名：A 记录指向服务器公网 IP
- 云厂商安全组：放行 `22`、`80`、`443`

本项目要求 Node.js 24（见 `.node-version`）和 pnpm
`10.34.5`。镜像内会通过 Corepack 安装，服务器上不必再装 Node。

## 环境变量

先复制模板：

```bash
cp .env.copy .env
```

`.env` 不要提交到 Git。Compose 会用它做三件事：

1. **构建参数**：`NEXT_PUBLIC_*` 在 `next build` 时写入前端包。改了这些值必须重新
   `docker compose build`。
2. **构建期密钥**：博客列表、博客详情的静态参数和 `sitemap.xml` 都是预渲染的，
   所以 `next build` 必须能读到 `NOTION_TOKEN` / `NOTION_DATA_SOURCE_ID`，否则
   镜像里会烤进一个空博客列表，且要等 ISR 过期（6 小时）才会自愈。`.env` 通过
   BuildKit secret 挂进构建阶段，不会留在镜像层里。**因此 `.env` 必须存在才能
   `docker compose build`。**
3. **运行时注入**：服务端密钥（Notion、GitHub、Google Forms）在容器启动时读取。

| 变量                                    | 阶段 | 说明                                     |
| --------------------------------------- | ---- | ---------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | 构建 | 对外域名，空则用 `config/site.ts` 默认值 |
| `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID`     | 构建 | Google Analytics，可空                   |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION`       | 构建 | Search Console 验证，可空                |
| `NEXT_PUBLIC_RESUME_LINK`               | 构建 | `/resume` 跳转地址，可空                 |
| `NOTION_TOKEN`                          | 运行 | Notion 内部集成 token（`ntn_...`）       |
| `NOTION_DATA_SOURCE_ID`                 | 运行 | 博客数据源 ID，必须和 token 成对出现     |
| `NOTION_BLOG_REVALIDATE_SECONDS`        | 运行 | 博客缓存秒数，默认 `900`                 |
| `NOTION_WEBHOOK_VERIFICATION_TOKEN`     | 运行 | Webhook 校验，上线后再填                 |
| `NOTION_WEBHOOK_LOG_VERIFICATION_TOKEN` | 运行 | 仅首次握手临时设为 `true`                |
| `GOOGLE_FORM_LINK`                      | 运行 | 联系表单转发地址                         |
| `GOOGLE_FORM_FIELD_ID_*`                | 运行 | 表单字段 ID                              |
| `GITHUB_USERNAME`                       | 运行 | 贡献页用户名，缺省用 `config/site.ts`    |
| `GITHUB_TOKEN`                          | 运行 | 可选，提高 GitHub API 限额               |

`NEXT_PUBLIC_*` 会出现在浏览器里，不要放密钥。

站点对外域名由 `NEXT_PUBLIC_SITE_URL` 决定，sitemap、canonical、Open
Graph 都读它；留空时回退到 `config/site.ts` 里的默认值。自托管只需在 `.env`
里写 `NEXT_PUBLIC_SITE_URL=https://your-domain.com`，不必改代码。它是构建期变量，
改完要重新 `docker compose build`。

自托管时 `@vercel/analytics` 不会上报。访问统计用 Google Analytics
即可。

## 本机先验证（可选）

本机已安装 Docker 时：

```bash
cp .env.copy .env
# 编辑 .env 和 config/site.ts

docker compose build
docker compose up -d
```

默认只绑定 `127.0.0.1:3000`。本机浏览器访问
<http://127.0.0.1:3000>。临时要从局域网访问，把 `compose.yml` 里的端口改成
`"3000:3000"`，验证完改回去。

```bash
docker compose logs -f web
docker compose down
```

## 1. 初始化服务器

以 Ubuntu、普通用户有 `sudo` 为例。

### 安装 Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y \
  docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"
```

重新登录后执行 `docker compose version`，确认是 Compose v2。

### 内存不足时加 swap

1 GB 机器在服务器上构建前建议加 2 GB swap：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 防火墙

```bash
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

云控制台安全组也要放行同样的端口。不要把 `3000` 放到公网。

## 2. 上传代码

推荐用 Git：

```bash
sudo apt-get install -y git
git clone https://github.com/florianjsun/next-portfolio.git
cd next-portfolio
```

也可用 `rsync` 从本机同步，排除 `node_modules` 和 `.next`：

```bash
rsync -av --exclude node_modules --exclude .next --exclude .git \
  ./ user@your-server:/home/user/next-portfolio/
```

## 3. 配置并启动

```bash
cd next-portfolio
cp .env.copy .env
nano .env
nano config/site.ts
```

确认 `config/site.ts` 的 `url` 已改成正式域名。然后：

```bash
docker compose build
docker compose up -d
docker compose ps
curl -I http://127.0.0.1:3000
```

`curl` 应返回 `200`。容器状态应为 `healthy`（启动后大约 30 秒）。

查看日志：

```bash
docker compose logs -f web
```

## 4. Nginx 反代和 HTTPS

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/next-portfolio
sudo nano /etc/nginx/sites-available/next-portfolio
```

把 `example.com` 换成你的域名，然后启用站点：

```bash
sudo ln -sf /etc/nginx/sites-available/next-portfolio \
  /etc/nginx/sites-enabled/next-portfolio
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

域名已解析到这台机器后签发证书：

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot 会改 Nginx 配置并加上自动续期。检查：

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

浏览器打开 `https://example.com`，确认首页、技能、项目、经历、贡献、博客、联系表单都能打开。

### 使用 Cloudflare

- 第一次用 Certbot 时，DNS 代理先设为 **仅 DNS**（灰云），签完再开橙色云
- SSL/TLS 模式用 **Full (strict)**
- 若改用 Cloudflare 源站证书，不要再走 Let's Encrypt，源站证书仍指向
  `127.0.0.1:3000` 的 Nginx

## 5. Notion Webhook

博客缓存默认最多 15 分钟刷新。要发布后立刻更新，在 Notion 里把
webhook 指到：

```text
https://example.com/api/notion-webhook
```

订阅 page / data source 的内容与属性事件。首次握手会下发一次性
verification token：

1. 临时在 `.env` 里设置
   `NOTION_WEBHOOK_LOG_VERIFICATION_TOKEN=true`
2. `docker compose up -d` 后重发握手
3. 从 `docker compose logs web` 里复制 token
4. 写入 `NOTION_WEBHOOK_VERIFICATION_TOKEN`，立刻把 log 开关改回
   `false`
5. 再执行 `docker compose up -d`（只重启，不必重新 build）
6. 在 Notion 里完成验证

之后的请求会做 HMAC 校验，通过后使博客缓存失效。

封面和正文图片不要用 Notion 临时上传地址（大约 1 小时过期）。用
`/public` 本地路径或对象存储 / CDN 的稳定 HTTPS 地址。

## 更新

代码或 `NEXT_PUBLIC_*` 有变化：

```bash
cd next-portfolio
git pull
docker compose build
docker compose up -d
```

只改了服务端环境变量（Notion、GitHub、Google Forms）：

```bash
docker compose up -d
```

不必重新 build。

## 回滚

每次 `docker compose build` 都会覆盖 `next-portfolio:latest`。上线前先打标签：

```bash
docker tag next-portfolio:latest next-portfolio:$(date +%Y%m%d-%H%M)
```

回滚到某个标签：

```bash
docker tag next-portfolio:20260815-1100 next-portfolio:latest
docker compose up -d
```

Git 回滚后再重新构建也可以：

```bash
git log --oneline
git checkout <commit>
docker compose build
docker compose up -d
```

## 本机构建、服务器只运行

服务器内存不够时，在本机构建并导出镜像：

```bash
docker compose build
docker save next-portfolio:latest | gzip > next-portfolio.tar.gz
scp next-portfolio.tar.gz user@your-server:~/
```

服务器上：

```bash
gunzip -c next-portfolio.tar.gz | docker load
cd next-portfolio
docker compose up -d --no-build
```

服务器上仍需要 `compose.yml` 和 `.env`，但不需要再执行
`pnpm install` / `pnpm build`。

## 日常命令

```bash
docker compose ps
docker compose logs -f --tail=200 web
docker compose restart web
docker compose down
docker image prune -f
```

磁盘被日志占满时，`compose.yml` 已限制单文件 10 MB、保留 3 个。仍可检查：

```bash
docker system df
sudo journalctl --disk-usage
```

## 故障排查

**`docker compose build` 在 `pnpm build` 被杀或退出码 137**

内存不够。加 swap，或改成本机构建再 `docker load`。

**构建成功，容器立刻退出**

`next.config.js` 必须有 `output: "standalone"`，否则
`.next/standalone` 不存在，镜像是坏的。查看：

```bash
docker compose logs web
```

**页面能开，Analytics / 简历链接不对**

`NEXT_PUBLIC_*` 只在构建期生效。改 `.env` 后要
`docker compose build && docker compose up -d`。

**博客为空，或构建/运行报 Notion 配置不完整**

`NOTION_TOKEN` 和 `NOTION_DATA_SOURCE_ID` 必须同时有或同时空。只填一个会抛错。两个都空时博客功能关闭，站点仍可访问。

博客页返回 200 但一篇文章都没有，先确认这两点：

1. 构建时 `.env` 就已经写好了 Notion 变量。它们只在运行时才有的话，
   `next build` 会预渲染出空列表并烤进镜像。补好 `.env` 后重新
   `docker compose build && docker compose up -d`。
2. Notion 里文章的 `Status` 是 `Published` 而不是 `Draft`，且
   `Title`/`Slug`/`PublishedAt`/`Description`/`Tags`/`CoverImage`/`ReadingTime`/`Featured`
   九个属性齐全、类型正确。缺一个都会被跳过。

**联系表单 500**

检查全部 `GOOGLE_FORM_*` 是否写入容器：

```bash
docker compose exec web printenv | grep GOOGLE_FORM
```

**Webhook 401 / 503**

`503`：还没配 `NOTION_WEBHOOK_VERIFICATION_TOKEN`。`401`：签名不对，或握手 token
复制错了。确认 Nginx 把 `x-notion-signature` 原样转给容器，不要改
`Content-Type`。

**贡献页失败或很慢**

未认证的 GitHub API 容易限流。在 `.env` 里加
`GITHUB_TOKEN` 后 `docker compose up -d`。

**HTTPS 证书失败**

确认域名 A 记录已生效，安全组和 `ufw` 放行了 80，且没有其它进程占用
80。Cloudflare 代理先关掉再跑 Certbot。

**502 Bad Gateway**

容器没起来，或没听在 `127.0.0.1:3000`：

```bash
docker compose ps
curl -I http://127.0.0.1:3000
sudo nginx -t
sudo tail -n 50 /var/log/nginx/error.log
```

## 上线检查清单

- [ ] `.env` 里 `NEXT_PUBLIC_SITE_URL` 已设为正式 HTTPS 域名
- [ ] 服务器上有 `.env`，且未提交到 Git
- [ ] `NEXT_PUBLIC_*` 在构建前已写入 `.env`
- [ ] `docker compose ps` 显示 `healthy`
- [ ] `https://你的域名` 可打开，HTTP 会跳到 HTTPS
- [ ] 首页、技能、项目、经历、贡献、博客、联系表单抽查通过
- [ ] 需要博客时，Notion 变量成对配置，Webhook 已验证
- [ ] 安全组 / `ufw` 未放行 `3000`
- [ ] 已给当前镜像打回滚标签
