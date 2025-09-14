FROM node:24-slim

# # Chromium dependencies
RUN apt-get update && apt-get install -y \
# for Prisma
openssl \ 
# for healthcheck
curl \
# for Playwright
  libglib2.0-0 \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libatspi2.0-0 \
  libcairo2 \
  libdbus-1-3 \
  libexpat1 \
  libx11-6 \
  libxcb1 \
  libxshmfence1 \
  && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /workspace

COPY --chown=node:node package*.json .
COPY --chown=node:node api-db/package*.json api-db/
COPY --chown=node:node packages/shared-schemas/package*.json packages/shared-schemas/

RUN npm -w api-db ci

RUN npm run -w api-db postinstall

COPY --chown=node:node packages/shared-schemas packages/shared-schemas
COPY --chown=node:node api-db api-db

RUN npm run -w packages/shared-schemas  build
RUN npx -w api-db prisma generate
RUN npm run -w api-db build

RUN npm prune -w api-db --omit=dev

WORKDIR /workspace/api-db
EXPOSE 3000
CMD ["node", "./build/server.js"]