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

| 文件                              | 作用                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `Dockerfile`                      | 多阶段构建：安装依赖、`pnpm build`、只拷贝 standalone 运行时 |
| `.dockerignore`                   | 缩小构建上下文，并阻止 `.env` 进入镜像                       |
| `compose.yml`                     | 构建参数、构建期 secret、运行环境、健康检查、日志轮转        |
| `deploy/nginx.conf.example`       | Nginx 反代模板（含 Cloudflare 真实 IP 还原）                 |
| `deploy/update-cloudflare-ips.sh` | 生成 `set_real_ip_from` 白名单，建议配每周定时任务           |
| `deploy/deploy-portfolio.sh`      | CI 通过 SSH 调用的部署脚本：构建、健康检查、失败自动回滚     |
| `.github/workflows/ci.yml`        | 质量检查 + 合并到 `master` 后自动部署                        |
| `next.config.js`                  | `output: "standalone"`，生成 `.next/standalone`              |
| `.env.copy`                       | 环境变量清单                                                 |

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
sudo apt-get install -y nginx certbot
```

### 4.1 还原访客真实 IP（走 Cloudflare 时必做）

Cloudflare 代理后，Nginx 看到的 `$remote_addr` 是 CF 边缘节点，日志和限流全都
失真。用仓库里的脚本生成 `set_real_ip_from` 白名单：

```bash
sudo install -m 0755 deploy/update-cloudflare-ips.sh \
  /usr/local/sbin/update-cloudflare-ips.sh
sudo mkdir -p /etc/nginx/snippets
sudo /usr/local/sbin/update-cloudflare-ips.sh
```

CF 的网段会变，挂个每周定时任务：

```bash
sudo systemctl edit --force --full cloudflare-ips.service
# [Service] Type=oneshot / ExecStart=/usr/local/sbin/update-cloudflare-ips.sh
sudo systemctl edit --force --full cloudflare-ips.timer
# [Timer] OnCalendar=weekly / Persistent=true  +  [Install] WantedBy=timers.target
sudo systemctl enable --now cloudflare-ips.timer
```

### 4.2 先放一张自签证书

橙色云开着时，CF 用哪个端口回源取决于它的 SSL/TLS 模式：Flexible 走 `80`，
Full 走 `443`。**Full 模式下源站还没有证书，ACME 校验会拿到 526 而失败。**
先放一张自签证书让 `443` 能握手，签完再换掉：

```bash
sudo mkdir -p /etc/nginx/ssl /var/www/certbot
sudo openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
  -keyout /etc/nginx/ssl/placeholder.key \
  -out /etc/nginx/ssl/placeholder.crt -subj "/CN=example.com"
```

### 4.3 启用站点

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/next-portfolio
sudo nano /etc/nginx/sites-available/next-portfolio   # 改 example.com
sudo ln -sf /etc/nginx/sites-available/next-portfolio \
  /etc/nginx/sites-enabled/next-portfolio
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

证书还没签发前，把两处 `ssl_certificate*` 先指向 `placeholder.*`。

### 4.4 签发证书

`webroot` 方式**不需要关掉橙色云**：ACME 请求会经 CF 回源到
`/.well-known/acme-challenge/`，模板里 `80` 和 `443` 都开了这个位置。

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d example.com \
  --email you@example.com --agree-tos --no-eff-email \
  --deploy-hook 'systemctl reload nginx'
```

签完把**站点 server 块**的 `ssl_certificate*` 换成
`/etc/letsencrypt/live/example.com/{fullchain,privkey}.pem`，
catch-all 块继续用自签证书，然后 `sudo nginx -t && sudo systemctl reload nginx`。

验证续期：

```bash
sudo systemctl list-timers certbot.timer
sudo certbot renew --dry-run
```

### 4.5 Cloudflare 侧设置

- 源站证书有效后，SSL/TLS 模式设为 **Full (strict)**
- 打开 **Always Use HTTPS**
- 模板对未知 Host 直接 `return 444`，且 catch-all 只挂自签证书，避免扫描源站
  IP 时从证书里读出真实域名
- 想彻底挡住绕过 CF 的直连，把 `80/443` 只放行给
  <https://www.cloudflare.com/ips/> 的网段（代价是关掉橙色云站点即不可访问）
- 若改用 Cloudflare 源站证书，就不要再走 Let's Encrypt，源站证书仍指向
  `127.0.0.1:3000` 的 Nginx

浏览器打开 `https://example.com`，确认首页、技能、项目、经历、贡献、博客、联系表单都能打开。

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

## 6. CI/CD 自动部署

`.github/workflows/ci.yml` 一个工作流承担两件事：

1. `quality` —— 每个 push 和 PR 都跑：装依赖、`pnpm audit --prod`、`pnpm check`、
   `pnpm build`。
2. `deploy` —— 只在 `master` 的 push 且 `quality` 全绿时跑：SSH 到服务器，让它
   构建并发布 **CI 刚刚验证过的那个 commit**。

镜像在服务器上构建，而不是在 GitHub 上构建再推镜像仓库。这么选的原因是博客和
sitemap 是构建期从 Notion 预渲染的，谁构建谁就得拿到 `NOTION_TOKEN`；放在服务器
构建可以让所有密钥只存在于服务器的 `.env` 里，GitHub 侧一个业务密钥都不需要。
代价是构建期间会占用服务器 CPU 约 1～2 分钟。

### 6.1 部署为什么带上 commit sha

CI 发过去的请求是 `deploy <40 位 sha>`，不是「拉最新的 master」。这样即使在 CI
跑完到部署之间又有人推了新提交，上线的仍然是通过了检查的那个版本。

### 6.2 服务器侧一次性配置

装部署脚本（必须放在仓库外面：脚本自己会执行 `git reset --hard`，放在仓库里会被
运行中的自己覆盖）：

```bash
sudo install -o root -g root -m 0755 \
  ~/next-portfolio/deploy/deploy-portfolio.sh /usr/local/bin/deploy-portfolio.sh
```

本机生成一把**专用**部署密钥（不要复用你自己的密钥）：

```bash
ssh-keygen -t ed25519 -N "" -C github-actions-deploy -f ./id_deploy
```

把公钥写进服务器的 `~/.ssh/authorized_keys`，并且**锁定到部署脚本**：

```
command="/usr/local/bin/deploy-portfolio.sh",restrict ssh-ed25519 AAAA...== github-actions-deploy
```

这一行是整套 CI/CD 的安全核心。`ubuntu` 有免密 sudo，而 `docker` 组本身等价于
root，所以一把不受限的密钥泄露就等于服务器失守。加上 `command=` 后，这把密钥无论
被要求执行什么，sshd 都只会运行部署脚本；脚本再用正则把入参限制成一个 40 位
十六进制 sha。`restrict` 顺带关掉 PTY、端口转发、agent 转发和 X11。

验证限制生效（都应该被拒绝，退出码 64）：

```bash
ssh -i ./id_deploy ubuntu@<IP> "whoami"
ssh -i ./id_deploy ubuntu@<IP> "cat ~/next-portfolio/.env"
ssh -i ./id_deploy ubuntu@<IP> "deploy abc123; cat /etc/shadow"
```

### 6.3 GitHub secrets

在 Settings → Secrets and variables → Actions 配置四个：

| Secret               | 值                                          |
| -------------------- | ------------------------------------------- |
| `DEPLOY_SSH_KEY`     | `id_deploy` 私钥全文（无口令）              |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan <IP>` 的输出，用于固定主机密钥 |
| `DEPLOY_HOST`        | 服务器 IP                                   |
| `DEPLOY_USER`        | `ubuntu`                                    |

命令行版本：

```bash
gh secret set DEPLOY_SSH_KEY < ./id_deploy
ssh-keyscan <IP> | gh secret set DEPLOY_KNOWN_HOSTS
gh secret set DEPLOY_HOST --body "<IP>"
gh secret set DEPLOY_USER --body "ubuntu"
```

服务器 IP 之所以也放 secret，是因为域名走 Cloudflare 代理，源站 IP 不该出现在仓库
文件里。`DEPLOY_KNOWN_HOSTS` 让工作流用 `StrictHostKeyChecking=yes`：万一 DNS 或
IP 被劫持，连接会直接失败而不是把私钥送给假服务器。

设好之后本机就可以删掉 `id_deploy` 了。轮换密钥＝重复 6.2 生成新的一把、替换
`authorized_keys` 里那一行、重新 `gh secret set DEPLOY_SSH_KEY`。

### 6.4 部署脚本做了什么

按顺序：`flock` 串行化（防止两次部署互相踩）→ 记下当前 commit 和当前镜像 ID →
按 sha 浅拉取并 `git reset --hard` → `docker compose build` → 给镜像打上短 sha
标签 → `docker compose up -d` → 轮询容器健康状态（最多 180 秒）→ `curl`
`127.0.0.1:3000` 冒烟 → 清理只留最近 3 个版本标签。

两种失败各有对策：

- **构建失败**：此时还没碰运行中的容器，脚本把仓库 reset 回原 commit 就退出，
  线上完全不受影响。
- **新容器起不来 / 健康检查不过**：脚本打印容器日志，把 `latest` 标签重新指回
  之前那个镜像 ID、仓库 reset 回原 commit、重新 `up -d`，然后以非零码退出让 CI
  变红。

服务器上的 `~/deploy-portfolio.log` 有完整历史。

### 6.5 并发

工作流层的 `cancel-in-progress` 只对非 `master` 分支生效，否则连续两次 push 会把
正在部署的那次 job 中途掐掉。`deploy` job 另有自己的并发组且不允许取消，多次部署
排队执行；服务器侧的 `flock` 是第二道保险。

## 更新

正常流程是合并到 `master`，剩下的交给上面的 CI/CD。

需要手动部署时（比如只改了服务端环境变量）：

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

部署当场失败的情况由部署脚本自动回滚，见 6.4，不用手工干预。

需要人工回滚的是「部署成功但改动本身有问题」。首选走正常流程，让 CI 重新验证：

```bash
git revert <commit>
git push
```

要立刻恢复、来不及等 CI 时，直接切镜像标签（脚本保留了最近 3 个短 sha 标签）：

```bash
docker images next-portfolio
docker tag next-portfolio:<短 sha> next-portfolio:latest
docker compose up -d
```

注意这只换了运行的镜像，服务器上的仓库仍停在新 commit；记得随后用 `git revert`
把代码也对齐，否则下一次部署的日志会对不上。

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
