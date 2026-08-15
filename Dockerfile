# syntax=docker/dockerfile:1

# Keep this aligned with `.node-version` (major 24).
ARG NODE_VERSION=24-slim

FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

COPY package.json pnpm-lock.yaml ./

# pnpm's isolated linker leaves packages such as @swc/helpers out of
# Next.js standalone traces. Hoist so the tracer can copy them.
RUN echo "node-linker=hoisted" > .npmrc

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  corepack enable pnpm && \
  pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined at build time.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID
ARG NEXT_PUBLIC_GOOGLE_VERIFICATION
ARG NEXT_PUBLIC_RESUME_LINK
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID=$NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID
ENV NEXT_PUBLIC_GOOGLE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_VERIFICATION
ENV NEXT_PUBLIC_RESUME_LINK=$NEXT_PUBLIC_RESUME_LINK

RUN corepack enable pnpm && pnpm build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir .next && chown node:node .next

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

CMD ["node", "server.js"]
