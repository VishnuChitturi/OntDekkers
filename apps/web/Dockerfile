# =============================================================================
# OntDekker — Frontend Dockerfile (Next.js 14)
#
# Multi-stage build:
#   1. deps      — install only production dependencies
#   2. builder   — build the Next.js production bundle
#   3. runner    — minimal runtime image
# =============================================================================

# --- Stage 1: Install dependencies -----------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# --- Stage 2: Build the application ----------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy production deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
COPY . .

# Build the Next.js production bundle (outputs to .next/standalone when
# output: 'standalone' is enabled, otherwise standard .next build)
RUN npm run build

# --- Stage 3: Minimal runtime image ----------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public 2>/dev/null || true
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
