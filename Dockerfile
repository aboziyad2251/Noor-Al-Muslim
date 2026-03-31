# ============================================================
# Stage 1: Build the Expo Web app
# ============================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install dependencies before copying all source code to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
# Setting environment variables for the build if needed
RUN npx expo export -p web

# ============================================================
# Stage 2: Production Nginx Server
# ============================================================
FROM nginx:alpine

# Copy built frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Replace default config with our SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
