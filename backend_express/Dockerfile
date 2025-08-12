FROM node:20.11-alpine
ENV NODE_VERSION 20.11

# todo: set environment variables

COPY . /app

WORKDIR /app

RUN npm install

EXPOSE 3123

CMD ["node", "app.js"]

