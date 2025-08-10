# Development Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./
COPY bun.lockb* ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the development server with hot reloading
CMD ["npm", "start"]