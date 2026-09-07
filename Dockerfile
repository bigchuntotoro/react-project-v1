FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Maven Wrapper 관련 파일 및 설정 복사
COPY .mvn/ .mvn
COPY mvnw .
COPY pom.xml .

# 실행 권한 부여 및 빌드
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

# Spring Boot 실행 포트에 맞춰 설정 (기본값: 8080)
EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]