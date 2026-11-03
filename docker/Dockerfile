# Stage 1: Build Frontend (React + Vite)
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend (TypeScript + Node)
FROM node:22-bookworm AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 3: Production Runtime
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies & compiled code
COPY server/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=server-builder /app/server/dist ./dist
# Copy frontend built assets
COPY --from=client-builder /app/client/dist ./client-dist

# Copy decky-plugin into production runtime for in-Decky self-updater
COPY decky-plugin ./decky-plugin

# Create persistent data directory
RUN mkdir -p /app/data && chmod 777 /app/data
VOLUME ["/app/data"]

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "dist/index.js"]
