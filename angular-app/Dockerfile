FROM node:22.15.0-alpine AS builder
WORKDIR /app

COPY --chown=node:node package*.json .
COPY --chown=node:node angular-app/package*.json angular-app/
COPY --chown=node:node packages/shared-schemas/package.json packages/shared-schemas/package.json

RUN npm -w angular-app ci --omit=dev
RUN npm i -g @angular/cli@19.2.12

COPY --chown=node:node packages/shared-schemas packages/shared-schemas
COPY --chown=node:node angular-app angular-app

RUN npm -w angular-app run build --configuration=production

FROM nginx:1.28.0-alpine3.21-slim
COPY --from=builder /app/angular-app/dist/angular-app/browser /usr/share/nginx/html
COPY angular-app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80