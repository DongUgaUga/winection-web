FROM --platform=linux/amd64 node:20-alpine

WORKDIR /src

COPY /package.json .

#     RUN npm install -g pnpm && \
#     pnpm install
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build
#RUN pnpm build

EXPOSE 3000
CMD ["npm", "run", "preview"]