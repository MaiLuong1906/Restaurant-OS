# ====================================================================
# Stage 1: Build JAR using Maven & Temurin JDK 21
# ====================================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Build application
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ====================================================================
# Stage 2: Minimal Runtime using Temurin JRE 21
# ====================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /workspace/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
