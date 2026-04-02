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

# Public env vars baked into the web bundle at build time
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_VAPID_PUBLIC_KEY
ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV EXPO_PUBLIC_VAPID_PUBLIC_KEY=$EXPO_PUBLIC_VAPID_PUBLIC_KEY

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
