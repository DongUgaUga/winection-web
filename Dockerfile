FROM --platform=linux/amd64 node:20-alpine

WORKDIR /src

COPY /package.json .

RUN pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "run", "preview"]