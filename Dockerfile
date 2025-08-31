FROM node:22.11.0-alpine AS base

WORKDIR /app

# Copier tout ce qui est nécessaire pour que yarn installe les workspaces
COPY package.json yarn.lock .npmrc ./
COPY packages/ ./packages/
COPY apps/backend/package.json apps/backend/
COPY apps/docs/package.json apps/docs/

RUN yarn install --frozen-lockfile

# Backend build
FROM base AS backend-builder
COPY apps/backend ./apps/backend
RUN yarn workspace backend build

# Frontend build
FROM base AS frontend-builder
COPY apps/docs ./apps/docs
RUN yarn workspace docs build

# Image backend
FROM node:22.11.0-alpine AS backend
WORKDIR /app
COPY --from=backend-builder /app ./
EXPOSE 3333
CMD ["yarn", "workspace", "backend", "start"]

# Image frontend
FROM node:22.11.0-alpine AS frontend
WORKDIR /app
COPY --from=frontend-builder /app ./
EXPOSE 3000
CMD ["yarn", "workspace", "docs", "start"]
