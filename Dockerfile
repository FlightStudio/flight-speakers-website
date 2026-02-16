FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy server code only (frontend deployed separately on Vercel)
COPY server ./server

EXPOSE 3001

CMD ["node", "server/index.js"]
