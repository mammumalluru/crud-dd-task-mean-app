# frontend/Dockerfile
# --- Build stage ---
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Build production app (angular.json outputPath -> dist/angular-15-crud)
RUN npm run build -- --configuration production

# --- Run stage (nginx) ---
FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from build stage
COPY --from=build /app/dist/angular-15-crud /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
