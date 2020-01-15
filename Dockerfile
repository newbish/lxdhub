FROM node:latest

WORKDIR /var/lib/lxdhub

COPY package.json yarn.lock lerna.json ./
RUN yarn --pure-lockfile
COPY . .
RUN yarn bootstrap

ENTRYPOINT [ "yarn", "run" ]
CMD [ "start" ]
