FROM node:latest

WORKDIR /home/trigger

RUN mkdir -p /home/trigger

COPY ./trigger-poller.js /home/trigger

COPY ./package.json /home/trigger

RUN npm install

#EXPOSE 8080

CMD ["node", "/home/trigger/trigger-poller.js"];