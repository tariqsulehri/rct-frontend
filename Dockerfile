# Production frontend image.
# Stage 1 compiles the Vite/React application into static files.
FROM ubuntu:24.04 AS builder
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC
WORKDIR /build

# Install dependencies before copying source so Docker can cache npm ci when
# only application code changes.
RUN apt-get update && apt-get install -y curl ca-certificates tzdata && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# Copy only files needed by the Vite build.
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.ts postcss.config.js* ./
COPY index.html ./
COPY src ./src
COPY public ./public

# Keep API URL relative in production. nginx.conf proxies /api/v1 to the backend,
# so the same image can run on localhost, VM IPs, or a real domain.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2 is the small runtime image. It contains nginx plus the compiled files;
# Node and source code are not shipped to production.
FROM ubuntu:24.04 AS runner
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

RUN apt-get update && apt-get install -y nginx tzdata && rm -rf /var/lib/apt/lists/*

# Remove default Ubuntu nginx site to prevent it from serving the "Welcome to nginx!" page
RUN rm -f /etc/nginx/sites-enabled/default

COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf                 /etc/nginx/conf.d/default.conf

# Browser traffic enters here.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
