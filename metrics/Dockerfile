FROM node:latest

# if we do this before setting WORKDIR it's part of the build step
# not sure why we can't just do it in /opt/metrics instead of /tmp? idk I'm just following the blog post
COPY package*.json /tmp/
RUN cd /tmp && npm install
RUN mkdir -p /opt/metrics
RUN cp -a /tmp/node_modules /opt/metrics

RUN cd /opt/metrics && wget https://download.ip2location.com/lite/IP2LOCATION-LITE-DB1.CSV.ZIP && unzip -p IP2LOCATION-LITE-DB1.CSV.ZIP IP2LOCATION-LITE-DB1.CSV > IP2LOCATION-LITE-DB1.CSV && rm IP2LOCATION-LITE-DB1.CSV.ZIP
RUN cd /opt/metrics && wget https://download.ip2location.com/lite/IP2LOCATION-LITE-DB1.IPV6.CSV.ZIP && unzip -p IP2LOCATION-LITE-DB1.IPV6.CSV.ZIP IP2LOCATION-LITE-DB1.IPV6.CSV > IP2LOCATION-LITE-DB1.IPV6.CSV && rm IP2LOCATION-LITE-DB1.IPV6.CSV.ZIP

WORKDIR /opt/metrics

COPY . /opt/metrics
EXPOSE 6774

CMD [ "node", "index.js" ]