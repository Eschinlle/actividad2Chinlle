FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración primero para aprovechar el caché de capas
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install --production

# Copiar el código fuente
COPY . .

# Puerto por defecto
EXPOSE 3000

# Variables de entorno por defecto (serán sobrescritas en producción)
ENV PORT=3000
ENV DB_HOST=db
ENV DB_USER=fintech_user
ENV DB_PASSWORD=password
ENV DB_NAME=fintech_db

# Comando para iniciar la aplicación
CMD ["node", "app.js"]