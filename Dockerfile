FROM node:20-alpine

WORKDIR /app

# Cache dependency installation layer for faster rebuilds
COPY package.json package-lock.json ./
RUN npm ci

# App source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "docker:dev"]
