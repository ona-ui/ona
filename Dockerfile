# Dockerfile multi-stage pour optimiser le build du monorepo
FROM node:22.11.0-alpine AS base

WORKDIR /app

# Copier les fichiers de configuration du workspace
COPY package.json yarn.lock .npmrc ./
COPY packages/ ./packages/

# Installer les dépendances une seule fois
RUN yarn install --frozen-lockfile

# Stage pour le backend
FROM base AS backend-builder
COPY apps/backend/ ./apps/backend/
RUN cd apps/backend && yarn build

# Stage pour le frontend
FROM base AS frontend-builder
COPY apps/docs/ ./apps/docs/
RUN cd apps/docs && yarn build

# Image finale pour le backend
FROM node:22.11.0-alpine AS backend
WORKDIR /app
COPY --from=backend-builder /app ./
EXPOSE 3333
CMD ["yarn", "workspace", "backend", "start"]

# Image finale pour le frontend
FROM node:22.11.0-alpine AS frontend
WORKDIR /app
COPY --from=frontend-builder /app ./
EXPOSE 3000
CMD ["yarn", "workspace", "docs", "start"]