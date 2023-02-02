FROM node:16

WORKDIR /app

COPY . .

RUN npm install

RUN npm install bcrypt

EXPOSE 3000

CMD ["npm", "start"]
