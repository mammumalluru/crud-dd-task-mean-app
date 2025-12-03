# backend/Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (use package-lock if present)
COPY package*.json ./
RUN npm ci --only=production
##RUN npm install

# Copy source
COPY . .

# Ensure environment variable usage:
# The app currently reads DB url from app/config/db.config.js (hardcoded).
# Recommend overriding by setting MONGO_URL (see notes below).

EXPOSE 8080

# Start the server
CMD ["node", "server.js"]


