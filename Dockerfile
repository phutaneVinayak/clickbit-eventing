FROM node:latest

WORKDIR /home/event

RUN mkdir -p /home/event

COPY ./server.js /home/event

COPY ./package.json /home/event

RUN npm install

EXPOSE 8080

CMD ["node", "/home/event/server.js"];