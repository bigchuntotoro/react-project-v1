FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN chmod +x mvnw 2>/dev/null || true

RUN if [ -f mvnw ]; then ./mvnw clean package -DskipTests; else mvn clean package -DskipTests; fi


FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8084

ENTRYPOINT ["java", "-jar", "app.jar"]