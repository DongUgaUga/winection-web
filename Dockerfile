FROM --platform=linux/amd64 node:20-alpine

WORKDIR /src

# 1. pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# 2. 의존성 설치
COPY package.json ./
# COPY pnpm-lock.yaml ./
RUN pnpm install

# 3. 전체 복사
COPY . .

# 4. 빌드
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "preview"]