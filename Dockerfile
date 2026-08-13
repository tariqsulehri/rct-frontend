# Production frontend image using lightweight Nginx Alpine (~20MB).
# Pre-built dist/ folder is produced during pipeline quality checks
# for instant docker builds (<15 seconds) with 0 QEMU emulation overhead.

FROM --platform=linux/amd64 nginx:alpine AS runner

# Remove default Nginx site config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy pre-compiled frontend distribution bundle and Nginx routing config
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
