# =========================================================
# Stage 1. React Build
# =========================================================
FROM node:24-alpine AS frontend-builder

WORKDIR /app

# package.json 복사
COPY src/frontend/package*.json ./src/frontend/

# React dependency 설치
WORKDIR /app/src/frontend
RUN npm install

# React 소스 복사
COPY src/frontend/ .

# React 빌드
# 결과:
# /app/src/main/resources/static
RUN npm run build


# =========================================================
# Stage 2. Spring Boot Build
# =========================================================
FROM maven:3.9-eclipse-temurin-21 AS backend-builder

WORKDIR /app

# Maven 프로젝트 파일
COPY pom.xml .

# dependency 다운로드 캐시
RUN mvn dependency:go-offline -B

# Backend 소스 복사
COPY src/main ./src/main

# Stage 1에서 생성된 React 빌드 결과 복사
COPY --from=frontend-builder \
     /app/src/main/resources/static \
     /app/src/main/resources/static

# Spring Boot 빌드
RUN mvn clean package -DskipTests


# =========================================================
# Stage 3. Run
# =========================================================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Spring Boot JAR
COPY --from=backend-builder \
     /app/target/*.jar \
     app.jar

# Upload 디렉터리
RUN mkdir -p /upload

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
