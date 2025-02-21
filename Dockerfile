FROM node:latest AS base

FROM base AS build

COPY package*.json ./
RUN npm ci

COPY index.mjs ./
RUN node_modules/.bin/esbuild index.mjs --bundle --platform=node --outfile=dist/index.js

FROM base AS dist

WORKDIR /opt/action
COPY --from=build /dist/index.js ./
CMD [ "-e", "require('/opt/action/index').run()" ]