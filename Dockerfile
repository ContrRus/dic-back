FROM node:14.15.3-alpine

WORKDIR /app

ENV PORT 3001

COPY package.json /app/package.json

RUN npm install

COPY . /app

CMD ["npm", "start"]
