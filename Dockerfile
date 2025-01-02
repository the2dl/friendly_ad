FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application with better error visibility
RUN echo "Starting build process..." && \
    ls -la && \
    mkdir -p dist && \
    CI=false npm run build

# Production image
FROM nginx:alpine

# Create non-root user
RUN adduser -D -H -u 1000 -s /sbin/nologin webuser

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Update permissions
RUN chown -R webuser:webuser /usr/share/nginx/html && \
    chown -R webuser:webuser /var/cache/nginx && \
    chown -R webuser:webuser /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R webuser:webuser /var/run/nginx.pid

USER webuser

EXPOSE 80