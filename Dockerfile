FROM node:20-alpine

# yt-dlp (YouTube sizzle-reel downloads) + ffmpeg (merges separate video/audio streams yt-dlp returns for >720p). Both live in Alpine's community repo and are arch-agnostic. Installed as root before dropping to the `node` user.
RUN apk add --no-cache yt-dlp ffmpeg

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
