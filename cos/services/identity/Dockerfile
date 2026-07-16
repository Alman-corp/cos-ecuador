FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/identity ./services/identity
COPY packages ./packages
RUN npm install
RUN npm run build -w @cos/service-identity

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/services/identity/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
EXPOSE 3001
CMD ["node", "dist/main.js"]
