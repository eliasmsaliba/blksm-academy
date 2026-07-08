FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install --workspace=@blksm/shared --workspace=@blksm/web --include-workspace-root

COPY packages/shared packages/shared
COPY apps/web apps/web

RUN npm run build --workspace=@blksm/shared

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "dev"]
