# ---------- Builder Stage ----------

FROM node:18-alpine AS builder

WORKDIR /app

# Prisma requires openssl

RUN apk add --no-cache openssl

# Copy package files and Prisma schema (needed for generate)
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies and generate Prisma client (single RUN for network reliability)
RUN npm ci && npx prisma generate

# Copy remaining source code

COPY . .

# ---------- Production Stage ----------

FROM node:18-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

# Copy node_modules from builder

COPY --from=builder /app/node_modules ./node_modules

# Copy prisma schema and generated client

COPY --from=builder /app/prisma ./prisma

# Copy application source

COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) process.exit(1)})"

CMD ["npm","start"]
