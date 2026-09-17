FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --chown=node:node . .
USER node
EXPOSE 8080
CMD ["node", "src/index.js"]
