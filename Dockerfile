FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional --legacy-peer-deps

COPY . .
RUN npm prune --omit=dev --legacy-peer-deps

FROM node:20-alpine

RUN apk add --no-cache wget  # ✅ Adiciona wget para o healthcheck

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/chatbot ./chatbot
COPY --from=builder --chown=nodejs:nodejs /app/index.mjs ./

USER nodejs

EXPOSE 3000
CMD ["node", "index.mjs"]