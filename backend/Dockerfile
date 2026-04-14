FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm install typescript tsx --save-dev

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc --build

EXPOSE 3001

CMD ["node", "dist/index.js"]
