ARG NODE_VERSION=24.18.0-alpine

FROM node:${NODE_VERSION}

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS
RUN npm run build

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]