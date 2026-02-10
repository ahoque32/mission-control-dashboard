FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_CONVEX_URL=https://courteous-quail-705.convex.cloud
RUN npm run build
# Flatten standalone output if nested under monorepo path
RUN if [ -f .next/standalone/server.js ]; then \
      echo "Standalone at root"; \
    elif [ -d .next/standalone/mission-control ]; then \
      cp -r .next/standalone/mission-control/dashboard/. /tmp/standalone/ && \
      rm -rf .next/standalone/* && \
      cp -r /tmp/standalone/. .next/standalone/; \
    fi

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV GEMINI_API_KEY=AIzaSyBWGVz04rj1ztLrzvUxI-NEJjOex-Cdthg

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
