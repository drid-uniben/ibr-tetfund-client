# Use Node version 20
FROM node:20

# Enable pnpm via corepack
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy only dependency files first
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of your code
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["pnpm", "dev"]