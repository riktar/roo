FROM node:16
EXPOSE 3000
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run create:db
RUN npm start