# ------------ BUILD STAGE ------------
    FROM node:18 AS builder

    WORKDIR /app
    
    # Install dependencies (faster caching)
    COPY package*.json ./
    RUN npm install --production=false
    
    # Copy everything
    COPY . .
    RUN chmod -R +x node_modules/.bin

    # Build Next.js
    RUN npm run build
    
    
    # ------------ RUNNER STAGE ------------
    FROM node:18 AS runner
    
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    # Copy standalone build
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    
    EXPOSE 3000
    
    ENV PORT=3000
    ENV HOSTNAME=0.0.0.0
    
    CMD ["node", "server.js"]
    