FROM node:22-alpine AS client-build

WORKDIR /build/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS api

WORKDIR /app
COPY package.json ./
RUN apk add --no-cache openssl && npm install --omit=dev
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY src/ ./src/
COPY --from=client-build /build/client/dist ./client/dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
