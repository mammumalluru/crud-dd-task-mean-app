In this DevOps task, you need to build and deploy a full-stack CRUD application using the MEAN stack (MongoDB, Express, Angular 15, and Node.js). The backend will be developed with Node.js and Express to provide REST APIs, connecting to a MongoDB database. The frontend will be an Angular application utilizing HTTPClient for communication.  

The application will manage a collection of tutorials, where each tutorial includes an ID, title, description, and published status. Users will be able to create, retrieve, update, and delete tutorials. Additionally, a search box will allow users to find tutorials by title.

## Project setup

### Node.js Server

cd backend

npm install

You can update the MongoDB credentials by modifying the `db.config.js` file located in `app/config/`.

Run `node server.js`

### Angular Client

cd frontend

npm install

Run `ng serve --port 8081`

You can modify the `src/app/services/tutorial.service.ts` file to adjust how the frontend interacts with the backend.

Navigate to `http://localhost:8081/`


Document:

Below you’ll find two Dockerfiles (multi-stage for the frontend). I also include short build & run examples and a few notes about environment variables (so your containers can talk to MongoDB and the front-end can talk to the back-end).

Backend Dockerfile (backend/Dockerfile)

Place this file at crud-dd-task-mean-app/backend/Dockerfile.

# backend/Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (use package-lock if present)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Ensure environment variable usage:
# The app currently reads DB url from app/config/db.config.js (hardcoded).
# Recommend overriding by setting MONGO_URL (see notes below).
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]

How to build & run (example)
# from repo root
cd crud-dd-task-mean-app/backend

# Build image
docker build -t dd-backend:latest .

# Run (example linking to a local mongodb container named 'mongodb'):
docker run -d --name dd-backend \
  -p 8080:8080 \
  -e PORT=8080 \
  -e MONGO_URL="mongodb://mongodb:27017/dd_db" \
  dd-backend:latest


Important note for backend DB connection

The repo currently has app/config/db.config.js with url: "mongodb://localhost:27017/dd_db".

To allow runtime DB configuration, either:

Update app/config/db.config.js to read process.env.MONGO_URL || "mongodb://localhost:27017/dd_db", or

Set environment variable MONGO_URL and add a tiny change to app/models/index.js to use process.env.MONGO_URL when present.
Example change to db.config.js:

module.exports = {
  url: process.env.MONGO_URL || "mongodb://localhost:27017/dd_db"
};


This will let the container connect to mongodb service when you run with -e MONGO_URL=....

Frontend Dockerfile (frontend/Dockerfile) — multi-stage + nginx

Place this file at crud-dd-task-mean-app/frontend/Dockerfile.

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
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from build stage
COPY --from=build /app/dist/angular-15-crud /usr/share/nginx/html

# If you want a custom nginx config, copy it here:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

How to build & run (example)
cd crud-dd-task-mean-app/frontend

# Build image
docker build -t dd-frontend:latest .

# Run
docker run -d --name dd-frontend -p 80:80 dd-frontend:latest


Important note about the frontend API base URL

In the current code frontend/src/app/services/tutorial.service.ts the baseUrl is hardcoded:

const baseUrl = 'http://localhost:8080/api/tutorials';


In a container/orchestration environment you should not keep it hardcoded. Options:

Use Angular environment files and rebuild for each environment (i.e., set environment.production.apiUrl and use environment.apiUrl + '/api/tutorials'). Rebuild image when API host changes.

Runtime configuration trick: create a small assets/env.js that reads window.__env and have the Docker nginx stage copy an env.js that you can replace at container run time (or generate env.js via entrypoint using envsubst). This avoids rebuilding the Angular app to change API host.

If simple — during development set baseUrl to http://<backend-host-or-ip>:8080/api/tutorials before building.

If you want, I can:

update the backend to read MONGO_URL automatically (and show the exact patch), and/or

modify the frontend to support runtime environment variables (provide an env.js pattern + nginx entrypoint example),

or provide docker-compose.yml to run mongodb, backend, and frontend together.

Quick docker-compose.yml (optional, if you want everything working fast)

Drop this in repo root as docker-compose.yml (example — uses the Dockerfiles above):

version: "3.8"
services:
  mongodb:
    image: mongo:6
    container_name: dd-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - MONGO_URL=mongodb://mongodb:27017/dd_db
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo-data:


Run with:

docker-compose up --build

