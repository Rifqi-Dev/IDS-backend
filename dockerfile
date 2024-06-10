FROM oven/bun

WORKDIR /app

COPY package.json .
COPY bun.lockb .

RUN bun install --production

COPY src src
COPY ./ ./
# COPY prisma prisma
# COPY tsconfig.json .
# COPY .env .
# COPY public public

RUN bunx prisma generate

ENV NODE_ENV production
ENV APP_PORT 3002
CMD ["bun", "src/index.ts"]

EXPOSE 3002