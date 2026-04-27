FROM node:20-alpine

# Defence in depth — run as the built-in non-root `node` user (uid 1000).
# WORKDIR /app is created as root by default; chown so the node user can
# write to it during install.
WORKDIR /app
RUN chown node:node /app

USER node

# Install dependencies first (better layer caching)
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy server code only (frontend deployed separately on Vercel)
COPY --chown=node:node server ./server

EXPOSE 3001

CMD ["node", "server/index.js"]
