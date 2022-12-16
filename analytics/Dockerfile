FROM node:latest

WORKDIR /opt/metrics

COPY . /opt/metrics

RUN npm install
# todo: do this in a way that makes building not suck

CMD [ "node", "ingest_into_postgres.js" ]
