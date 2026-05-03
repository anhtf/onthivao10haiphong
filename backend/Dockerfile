FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
