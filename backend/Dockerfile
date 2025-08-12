FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3501

CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && npm start"]