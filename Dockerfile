FROM node:20-alpine
WORKDIR /app
COPY dist ./dist
COPY server.js ./
EXPOSE 8000
CMD ["node", "server.js"]
