# 1. Use node light image
FROM node:20-slim

# 2. Set working directory
WORKDIR /app

# 3. Copy package configuration files
COPY package*.json ./

# 4. Install Node packages
RUN npm ci

# 5. Copy frontend source code
COPY . .

# 6. Expose the Vite dev server port
EXPOSE 5173

# 7. Start Vite in host mode (so requests outside the container can resolve)
CMD ["npm", "run", "dev", "--", "--host"]
