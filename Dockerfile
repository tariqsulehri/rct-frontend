# ── Stage 1: build the React app ─────────────────────────────────────────────
FROM cgr.dev/chainguard/node:20-dev AS builder
WORKDIR /build

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js* ./
COPY src ./src
COPY public ./public

# VITE_API_URL stays relative — nginx proxy resolves the actual host at runtime
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: zero-CVE nginx to serve the built SPA ───────────────────────────
FROM cgr.dev/chainguard/nginx:1.27 AS runner

COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf                 /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
