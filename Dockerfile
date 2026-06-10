# Production frontend image.
# Stage 1 compiles the Vite/React application into static files.
FROM node:24-alpine AS builder
WORKDIR /build

# Install dependencies before copying source so Docker can cache npm ci when
# only application code changes.
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
FROM nginx:1.27-alpine AS runner

COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf                 /etc/nginx/conf.d/default.conf

# Browser traffic enters here.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
