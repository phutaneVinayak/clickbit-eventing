FROM node:latest

WORKDIR /home/engine

RUN mkdir -p /home/engine

COPY ./engine.js /home/engine

COPY ./package.json /home/engine

RUN npm install

#EXPOSE 8080

CMD ["node", "/home/engine/engine.js"];