FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install --workspace=@blksm/shared --workspace=@blksm/api --include-workspace-root

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build --workspace=@blksm/shared
RUN npx --workspace=@blksm/api prisma generate

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["npm", "run", "start:dev"]
