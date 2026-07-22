# 🚀 React + Spring Boot + MyBatis + MariaDB 통합 게시판 프로젝트

React 프론트엔드와 Spring Boot 백엔드가 단일 저장소(Single Repository) 구조로 구성된 게시판 프로젝트입니다. 
빌드 시 React 애플리케이션이 Spring Boot 정적 자원(`src/main/resources/static`)으로 패키징되어 하나의 JAR 실행 파일로 배포할 수 있습니다.

---

## 📌 주요 기능

* **게시글 CRUD**: 게시글 작성, 상세 조회, 수정, 삭제
* **화면 분리**: 리스트 (`/`), 글쓰기 (`/write`), 상세 (`/detail/:id`), 글수정 (`/edit/:id`) 화면 분리
* **첨부파일 관리**: 게시글당 **최대 5개** 파일 첨부, 기존 파일 삭제 및 신규 파일 추가
* **페이징 & 검색**: 동적 검색 조건(제목, 내용, 작성자) 및 페이징 처리
* **단일 프로젝트 배포**: React 빌드 결과물을 Spring Boot static 폴더로 자동안동화

---

## 🛠 기술 스택 (Tech Stack)

### Backend
* **Java**: 17
* **Framework**: Spring Boot 3.x
* **Persistence**: MyBatis 3.x
* **Database**: MariaDB
* **Build Tool**: Maven / Gradle

### Frontend
* **Library**: React 18
* **Routing**: React Router v6
* **HTTP Client**: Axios

---

## 📁 프로젝트 구조 (Directory Structure)

```text
my-board-project/
├── .gitignore
├── README.md
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/example/board/
    │   │   ├── BoardApplication.java
    │   │   ├── controller/
    │   │   │   └── BoardController.java
    │   │   ├── dto/
    │   │   │   ├── BoardDto.java
    │   │   │   ├── BoardFileDto.java
    │   │   │   └── SearchDto.java
    │   │   ├── mapper/
    │   │   │   └── BoardMapper.java
    │   │   └── service/
    │   │       └── BoardService.java
    │   └── resources/
    │       ├── application.yml
    │       ├── mapper/
    │       │   └── BoardMapper.xml
    │       └── static/            # React 빌드 결과물 자동 생성 위치
    └── frontend/                  # React 프로젝트
        ├── package.json
        ├── public/
        └── src/
            ├── App.js
            ├── index.js
            └── pages/
                ├── BoardDetail.js
                ├── BoardEdit.js
                ├── BoardList.js
                └── BoardWrite.js
```

---

## 🗄 DB 스키마 (MariaDB)

```sql
-- 게시글 테이블
CREATE TABLE board (
    board_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    writer VARCHAR(50) NOT NULL,
    read_cnt INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 첨부파일 테이블 (1:N 관계, 최대 5개)
CREATE TABLE board_file (
    file_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    save_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_board_file FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE
);
```

---

## ⚙️ 설정 및 빌드 가이드 (Setup & Build)

### 1. 환경 설정 (`src/main/resources/application.properties`)
```properties
spring.application.name=demo
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
spring.datasource.url=jdbc:mariadb://localhost:3306/board_db
spring.datasource.username=root
spring.datasource.password=totoro

mybatis.mapper-locations=classpath:mappers/**/*.xml
mybatis.configuration.map-underscore-to-camel-case=true

logging.level.com.example.demo.mapper=debug
logging.level.org.mybatis=debug
logging.level.java.sql.Connection=debug
logging.level.java.sql.Statement=debug
logging.level.java.sql.PreparedStatement=debug
```

### 2. 개발 환경 실행 (Development Mode)

#### Backend (Spring Boot)
```bash
./mvnw spring-boot:run
```
github 연결후 mvnw spring-boot:run 실행안될때
1. IntelliJ 우측 상단/우측 탭에서 Maven 탭을 클릭하여 엽니다.
2. 툴바 상단의 m 아이콘 (Execute Maven Goal) 또는 돌아가는 아이콘을 클릭합니다.
3. 입력창에 아래 명령어를 그대로 입력하고 Enter를 누릅니다.

#### Frontend (React)
```bash
cd src/frontend
npm install
npm run dev
```

---

## 📦 통합 빌드 및 배포 (Production Build)

React 빌드 결과물이 Spring Boot static 폴더로 출력되도록 설정되어 있습니다.

### 1. React 빌드
```bash
cd src/frontend
npm run build
```
*(결과물이 `src/main/resources/static` 경로로 자동 생성됩니다.)*

### 2. Spring Boot JAR 생성
```bash
# 프로젝트 루트 디렉토리로 이동
cd ../..
./mvnw clean package
```

### 3. 단일 JAR 실행
```bash
java -jar target/board-0.0.1-SNAPSHOT.jar
```
* 브라우저에서 `http://localhost:8080` 접속 시 통합된 게시판 애플리케이션을 확인할 수 있습니다.

---

## 🙈 Git 관리 규칙 (.gitignore)

다음 경로 및 파일은 GitHub에 커밋되지 않도록 `.gitignore`에 등록되어 있습니다:
* Node modules 및 Frontend 빌드 파일 (`/src/frontend/node_modules`, `/src/main/resources/static/`)
* Java 빌드 결과물 (`/target/`, `/*.jar`)
* IDE 및 OS 설정 파일 (`.mvn/`, `.idea/`, `.DS_Store`)

##.gitignore
```bash
# ==========================================
# 1. Node modules 및 Frontend 빌드 파일
# ==========================================
src/frontend/node_modules/
src/main/resources/static/
src/frontend/build/
src/frontend/dist/

# ==========================================
# 2. Java / Maven 빌드 결과물
# ==========================================
target/
*.jar
*.war
.mvn/
mvnw
mvnw.cmd

# ==========================================
# 3. IDE (IntelliJ) 및 OS 설정 파일
# ==========================================
# IntelliJ 기본 설정 및 캐시
.idea/
*.iml
*.iws
*.ipr

# 디폴트 무시된 파일
/shelf/
/workspace.xml

# 쿼리 파일을 포함한 무시된 디폴트 폴더
/queries/

# Datasource local storage ignored files
/dataSources/
/dataSources.local.xml

# 에디터 기반 HTTP 클라이언트 요청
/httpRequests/

# Eclipse 및 기타 IDE
.settings/
.classpath
.project

# OS / System
.DS_Store
Thumbs.db
---


이미 커밋되어 추적 중인 파일이 있다면?
.gitignore에 뒤늦게 등록하더라도, 이미 Git에 커밋되어 올라간 파일은 계속 추적됩니다. 이 경우 Git 캐시에서 삭제해 주어야 합니다.

git rm -r --cached .


# 삭제 상태를 커밋
git commit -m "Chore: .gitignore 적용 및 불필요한 빌드/설정 파일 추적 제거"

git push origin main


