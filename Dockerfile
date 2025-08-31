# Dockerfile multi-stage pour optimiser le build du monorepo
FROM node:22.11.0-alpine AS base

WORKDIR /app

# Copier les fichiers de configuration du workspace
COPY package.json yarn.lock .npmrc ./
COPY packages/ ./packages/

# Installer les dépendances une seule fois
RUN yarn install --frozen-lockfile

# Ajouter les binaires locaux au PATH
ENV PATH="/app/node_modules/.bin:$PATH"

# Stage pour le backend
FROM base AS backend-builder
COPY apps/backend/ ./apps/backend/
RUN yarn install --frozen-lockfile
RUN yarn workspace backend build

# Stage pour le frontend
FROM base AS frontend-builder
COPY apps/docs/ ./apps/docs/
RUN yarn install --frozen-lockfile
RUN yarn workspace docs build

# Stage pour l'admin
FROM base AS admin-builder
COPY apps/admin/ ./apps/admin/
RUN yarn install --frozen-lockfile
RUN yarn workspace admin build

# Image finale pour le backend
FROM node:22.11.0-alpine AS backend
WORKDIR /app
# Installer curl pour les health checks
RUN apk add --no-cache curl
COPY --from=backend-builder /app ./
EXPOSE 3333
CMD ["yarn", "workspace", "backend", "start"]

# Image finale pour le frontend
FROM node:22.11.0-alpine AS frontend
WORKDIR /app
# Installer curl pour les health checks
RUN apk add --no-cache curl
COPY --from=frontend-builder /app ./
EXPOSE 3000
CMD ["yarn", "workspace", "docs", "start"]

# Image finale pour l'admin
FROM node:22.11.0-alpine AS admin
WORKDIR /app
# Installer curl pour les health checks
RUN apk add --no-cache curl
COPY --from=admin-builder /app ./
EXPOSE 3002
CMD ["yarn", "workspace", "admin", "start"]