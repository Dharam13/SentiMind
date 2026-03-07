# ---------- Builder Stage ----------

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy tsconfig files
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.* ./

# Build-time API URL (use http://localhost for local, http://EC2_IP or https://domain.com for production)
ARG VITE_API_GATEWAY_URL=http://localhost
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL

# Build the React app
RUN npm run build

# ---------- Production Stage - Serve with Nginx ----------

FROM nginx:alpine AS production

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
