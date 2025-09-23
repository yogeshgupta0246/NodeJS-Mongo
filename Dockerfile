# ---------- Stage 1: Build ----------
FROM node:13-alpine AS build

# Create app directory
RUN mkdir -p /home/app

WORKDIR /home/app

# Copy only package files first for better caching
COPY ./app/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY ./app .

# ---------- Stage 2: Runtime ----------
FROM node:13-alpine AS runtime

WORKDIR /home/app

# Copy app and dependencies from build stage
COPY --from=build /home/app /home/app

ENV MONGO_DB_USERNAME=admin \
    MONGO_DB_PWD=password

# Copy app files
COPY ./app /home/app

# Set working directory
WORKDIR /home/app

# -------------------------------
# Security best practice:
# Create non-root user and group
# -------------------------------
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /home/app

# Switch to non-root user
USER appuser

# Add HEALTHCHECK (checks if app is alive)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Run the app
CMD ["node", "server.js"]
