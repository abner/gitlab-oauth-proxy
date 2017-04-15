FROM node:6.10.0-alpine

COPY . /service/node-app

EXPOSE 8080

WORKDIR /service/node-app

RUN yarn

ENTRYPOINT ["/bin/sh", "-c"]


CMD ["/service/node-app/start.sh"]