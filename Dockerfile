FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8787 HOST=0.0.0.0
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/data ./src/data
COPY storage/public ./storage/public
RUN mkdir -p .data storage/private && chown -R node:node /app
USER node
EXPOSE 8787
VOLUME ["/app/.data", "/app/storage/private"]
CMD ["node", "server/index.js"]
