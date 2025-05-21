# Build frontend
FROM node:18-alpine as frontend-build
WORKDIR /app
COPY app/package*.json ./
# Install typescript globally and project dependencies
RUN npm install -g typescript vite && npm ci
COPY app/ .
# Ensure proper permissions and run build
RUN chmod +x node_modules/.bin/* && npm run build

# Build backend
FROM maven:3.9-eclipse-temurin-24-alpine as backend-build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
# Copy frontend build to static resources
COPY --from=frontend-build /app/dist/ ./src/main/resources/static/
RUN mvn clean package -DskipTests

# Final stage
FROM eclipse-temurin:24-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"] 