# Stage 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as environment variables so Vite can access them
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend code
COPY . .

# Build the frontend (outputs to /app/dist)
RUN npm run build

# Debug: List what was built
RUN ls -la /app/dist && ls -la /app/dist/assets


# Stage 2: Setup the Production Server
FROM node:20-alpine

WORKDIR /app

# Copy server package.json to root
COPY server/package.json ./package.json

# Install only production dependencies for the server
RUN npm install --production

# Copy the built frontend assets from Stage 1 to /app/public
COPY --from=build /app/dist ./public

# Copy the server source code
COPY server ./server

# Debug: Verify files are in place
RUN ls -la /app/public && ls -la /app/public/assets

# Expose the port
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]
