# ====================================================================
# Stage 1: Base & Dependencies
# ====================================================================
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate

COPY package.json ./
RUN pnpm install --ignore-scripts

# ====================================================================
# Stage 2: Builder
# ====================================================================
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate

COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Environment variables needed at build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=1

RUN pnpm run build

# ====================================================================
# Stage 3: Minimal Production Runner
# ====================================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
