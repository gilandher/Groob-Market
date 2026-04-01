# === Stage 1: Instalación de dependencias ===
FROM node:20-alpine AS deps
# Alpine requiere apk para dependencias que usan C++ u OS de fondo
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
# Usamos ci para una instalacion limpia e identica al package-lock
RUN npm ci

# === Stage 2: Construcción (Build) ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Seteamos entorno a produccion para el build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# === Stage 3: Ejecución en Producción ===
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Solo copiamos los archivos construidos y la carpeta pública
COPY --from=builder /app/public ./public
# Copiamos la carpeta oculta generada y asignamos permisos
# Nota: Si activas "output: standalone" en next.config.ts, podrías usar la carpeta standalone en vez de esta.
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

CMD ["npm", "run", "start"]
