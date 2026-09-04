# 🚀 React + Spring Boot + MyBatis + MariaDB + naverLogin 통합 게시판 프로젝트

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
* **Java**: 21
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
CREATE TABLE reactboard (
    board_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    writer VARCHAR(50) NOT NULL,
    read_cnt INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 첨부파일 테이블 (1:N 관계, 최대 5개)
CREATE TABLE reactboard_file (
    file_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    save_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reactboard_file FOREIGN KEY (board_id) REFERENCES reactboard(board_id) ON DELETE CASCADE
);

CREATE TABLE `users` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `social_id` varchar(255) NOT NULL,
    `email` varchar(100) DEFAULT NULL,
    `name` varchar(50) DEFAULT NULL,
    `provider` varchar(20) DEFAULT 'NAVER',
    `role` varchar(20) DEFAULT 'ROLE_USER',
    `created_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `social_id` (`social_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE DATABASE IF NOT EXISTS board_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

CREATE USER IF NOT EXISTS 'board_user'@'%' IDENTIFIED BY 'board_pass';
GRANT ALL PRIVILEGES ON board_db.* TO 'board_user'@'%';
FLUSH PRIVILEGES;
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
mvn wrapper:wrapper

터미널 대신 IntelliJ GUI로 바로 실행하는 팁
터미널 명령어 문제가 지속된다면 IntelliJ의 Maven GUI 버튼을 이용하는 게 가장 편합니다.
IntelliJ 우측 사이드바의 Maven 탭을 클릭합니다.
Plugins ➔ spring-boot ➔ spring-boot:run 항목을 찾습니다.
더블클릭하면 터미널 명령어 에러 없이 바로 Spring Boot가 실행됩니다!

#### Frontend (React)
```bash
cd src/frontend
npm install
npm run dev

npm -v 에러날때
관리자 권한으로 스크립트 실행 허용 (추천)
한 번만 설정해 두면 앞으로 PowerShell에서 npm이나 npx 명령어를 쓸 때 오류가 뜨지 않습니다.
PowerShell을 관리자 권한으로 실행합니다.
Windows 키 ➔ PowerShell 검색 ➔ 마우스 우클릭 후 [관리자로 실행]
아래 명령어를 복사해서 붙여넣고 엔터를 만듭니다.
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
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
sudo systemctl start my-board-project
```
* 브라우저에서 `http://100.88.187.37:83/` 접속 시 통합된 게시판 애플리케이션을 확인할 수 있습니다.

---

## 🙈 Git 관리 규칙 (.gitignore)
```bash
다음 경로 및 파일은 GitHub에 커밋되지 않도록 `.gitignore`에 등록되어 있습니다:
* Node modules 및 Frontend 빌드 파일 (`/src/frontend/node_modules`, `/src/main/resources/static/`)
* Java 빌드 결과물 (`/target/`, `/*.jar`)
* IDE 및 OS 설정 파일 (`.mvn/`, `.idea/`, `.DS_Store`)

##.gitignore

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

이미 커밋되어 추적 중인 파일이 있다면?
.gitignore에 뒤늦게 등록하더라도, 이미 Git에 커밋되어 올라간 파일은 계속 추적됩니다. 이 경우 Git 캐시에서 삭제해 주어야 합니다.

# 1. jar 파일 및 target 폴더 지정 삭제

git rm -rf --cached .idea
git rm -rf --cached .mvn
git rm -rf --cached src/frontend/node_modules
git rm -rf --cached src/main/resources/static

# 2. 커밋 및 푸시
git commit -m "Chore: Force remove ignored files"
git push origin main

```

## 🔐 네이버 OAuth 2.0 소셜 로그인 설정 (Naver Login)

본 프로젝트는 **OAuth 2.0** 및 **JWT**를 활용하여 네이버 소셜 로그인 기능을 제공합니다.

---

### 1. 네이버 개발자 센터 (Naver Developers) 설정

1. [네이버 개발자 센터](https://developers.naver.com/) 로그인 후 **Application > 애플리케이션 등록**으로 이동합니다.
2. 애플리케이션 정보를 입력합니다.
   * **애플리케이션 이름**: `프로젝트명`
   * **사용 API**: `네이버 로그인` (이름, 이메일, 프로필 사진 필수/선택 체크)
   * **로그인 Open API 서비스 환경**: `WEB`
   * **서비스 URL**: `http://localhost:3000` (React 개발 서버)
   * **네이버 로그인 Callback URL**: `http://localhost:8080/login/oauth2/code/naver` (Spring Boot OAuth 엔드포인트)
3. 등록 완료 후 발급된 **Client ID**와 **Client Secret**을 확인합니다.

---

### 2. MariaDB 유저 테이블 스키마 (`users`)

소셜 로그인 사용자 정보를 저장하기 위한 테이블 구조입니다.


CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    social_id VARCHAR(255) NOT NULL UNIQUE, -- 네이버 제공 고유 ID
    email VARCHAR(100),
    name VARCHAR(50),
    provider VARCHAR(20) DEFAULT 'NAVER',   -- 로그인 출처 (NAVER)
    role VARCHAR(20) DEFAULT 'ROLE_USER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

### 3. 의존성 추가
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-oauth2-client</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
```bash

### 4. Spring Boot 백엔드 설정
# =========================================================
# MariaDB 데이터베이스 설정
# =========================================================
spring.datasource.url=jdbc:mariadb://localhost:3306/your_db_name
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver

# =========================================================
# Spring Security OAuth2 Client 설정 (네이버 소셜 로그인)
# =========================================================

# 1. Registration (클라이언트 등록 정보)
# 발급받은 네이버 Client ID 및 Client Secret을 입력합니다.
spring.security.oauth2.client.registration.naver.client-id=YOUR_NAVER_CLIENT_ID
spring.security.oauth2.client.registration.naver.client-secret=YOUR_NAVER_CLIENT_SECRET
spring.security.oauth2.client.registration.naver.client-name=Naver
spring.security.oauth2.client.registration.naver.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.naver.redirect-uri=http://localhost:8080/login/oauth2/code/naver
spring.security.oauth2.client.registration.naver.scope=name,email,profile_image

# 2. Provider (네이버 OAuth2 엔드포인트 정보)
spring.security.oauth2.client.provider.naver.authorization-uri=https://nid.naver.com/oauth2.0/authorize
spring.security.oauth2.client.provider.naver.token-uri=https://nid.naver.com/oauth2.0/token
spring.security.oauth2.client.provider.naver.user-info-uri=https://openapi.naver.com/v1/nid/me
# 네이버 응답 JSON 데이터 중 최상위 객체 이름이 'response'입니다.
spring.security.oauth2.client.provider.naver.user-name-attribute=response


### 4. 로그인 인증 흐름 (Authentication Flow)
[React (Frontend)] ──(1) 네이버 로그인 클릭──> [Spring Boot (Backend)]
       ▲                                               │
       │                                       (2) OAuth 인증 요청
       │                                               ▼
       │                                       [Naver Auth Server]
       │                                               │
       │                                       (3) Callback & 유저 정보 제공
       │                                               ▼
       │                                       [Spring Boot & MariaDB]
       │                                       - 유저 DB 저장/업데이트
       │                                       - 자체 JWT 발급
       │                                               │
       └────(4) JWT 토큰과 함께 Redirect ──────────────┘
       
       
 src/main/java/com/example/board/
 ├── config/
 │    └── oauth/
 │         ├── CustomOAuth2UserService.java
 │         ├── OAuth2SuccessHandler.java
 │         └── dto/
 │              └── OAuthAttributes.java
 ├── entity/
 │    ├── User.java
 │    └── Role.java
 └── repository/
      └── UserRepository.java      
       
       
사용자 요청: React에서 http://localhost:8080/oauth2/authorization/naver로 이동

소셜 인증: 네이버 로그인 페이지에서 사용자 인증 진행

토큰 발행: Spring Boot에서 네이버 유저 정보를 확인 후 MariaDB에 저장, 자체 JWT Access Token 발행

프론트 전달: http://localhost:3000/oauth/redirect?token=YOUR_JWT_TOKEN으로 리다이렉트하여 localStorage에 토큰 저장

React 프로젝트 구조

src/
├── api/
│    └── axiosInstance.js               # Axios 인스턴스 (Request/Response Interceptor)
├── components/
│    ├── ProtectedRoute.jsx             # 로그인 권한 보호 컴포넌트
│    └── OAuthRedirectHandler.jsx      # JWT 수신 및 Storage 저장 핸들러
├── pages/
│    ├── BoardList.jsx                  # 게시글 목록 (페이징/검색)
│    ├── BoardDetail.jsx                # 게시글 상세 (파일 다운로드/이미지 표시)
│    ├── BoardWrite.jsx                 # 게시글 작성 (파일 업로드)
│    └── BoardEdit.jsx                  # 게시글 수정
├── App.jsx                             # Router 설정
└── main.jsx
```

## 🔐 Authentication & Authorization Architecture

본 프로젝트는 **OAuth2 (Naver)**와 **JWT (JSON Web Token)**를 결합하여 **Stateless(무상태성)** 인증 구조로 구현되었습니다.

### 1. OAuth2 로그인 및 JWT 발급 흐름 (로그인 과정)

```sequence
[사용자 (Browser)]           [React (Frontend)]            [Spring Boot (Backend)]             [Naver OAuth Server]
        |                             |                              |                                   |
1. 로그인 버튼 클릭 -------------------->|                              |                                   |
        |                             | 2. Redirect 요청 ----------->|                                   |
        |                             |    (/oauth2/authorization/naver)                                 |
        |                             |                              | 3. 네이버 로그인 페이지로 이동 ----->|
        |<----------------------------+------------------------------+-----------------------------------|
4. 네이버 로그인 및 동의 ---------------+------------------------------+---------------------------------->|
        |                             |                              |                                   |
        |                             |                              | 5. Authorization Code 전달       |
        |                             |                              |<----------------------------------|
        |                             |                              |                                   |
        |                             |                              | 6. Access Token 요청 & 프로필 조회 |
        |                             |                              |<=================================>|
        |                             |                              |   (CustomOAuth2UserService)       |
        |                             |                              |                                   |
        |                             |                              | 7. JWT Access Token 생성          |
        |                             |                              |    (JwtTokenProvider)             |
        |                             |                              |                                   |
        | 8. Redirect (URL 뒤에 토큰 첨부)                              | 8. Frontend로 Redirect            |
        |<-----------------------------------------------------------+    (OAuth2SuccessHandler)          |
        |  (http://localhost:5173/oauth/redirect?token=eyJhbG...)  |                                   |
        |                             |                              |                                   |
9. React 콜백 페이지 이동 ------------->|                              |                                   |
        |                             | 10. URL 쿼리에서 token 추출   |                                   |
        |                             |     및 localStorage에 저장    |                                   |


API 인증 및 보호된 자원 요청 흐름 (로그인 후)

[React (Frontend)]                                 [Spring Boot (Backend)]
        |                                                     |
        | 1. API 요청 (글쓰기, 수정, 삭제 등)                   |
        |    Header: Authorization: Bearer <JWT_TOKEN>        |
        |---------------------------------------------------->|
        |                                                     | 2. JwtAuthenticationFilter 통과
        |                                                     |    - Request Header에서 토큰 추출
        |                                                     |    - JwtTokenProvider.validateToken() 검증
        |                                                     |    - SecurityContextHolder에 Authentication 저장
        |                                                     |
        |                                                     | 3. SecurityConfig 권한 검증
        |                                                     |    - .authenticated() 라우트 확인
        |                                                     |
        |                                                     | 4. Controller & Service 로직 실행
        |                                                     |
        | 5. API 응답 (JSON Data)                             |
        |<----------------------------------------------------|


### 🛠️ Backend Core Components

| Component | Class Name | Description |
| :--- | :--- | :--- |
| **Security Config** | `SecurityConfig` | 전체 Security 필터 체인 관리, URL별 접근 권한 제어, `JwtAuthenticationFilter` 상위 필터 등록 |
| **OAuth2 Service** | `CustomOAuth2UserService` | 네이버 프로필 API 응답(`response` JSON) 파싱 및 사용자 DB 저장/업데이트 |
| **JWT Provider** | `JwtTokenProvider` | Secret Key 기반 JWT 생성, 유효성 검증(`validateToken`), `Authentication` 객체 추출 |
| **Success Handler** | `OAuth2SuccessHandler` | 네이버 인증 성공 시 JWT 발급 후, React 리다이렉트 URL(`?token=...`)로 이동 |
| **JWT Filter** | `JwtAuthenticationFilter` | API 요청 시 Header의 JWT를 검증하여 Spring Security 인증 상태(`SecurityContext`)로 등록 |


# 🛡️ Spring Boot & React JWT 인증 / CORS 및 토큰 재발급(Reissue) 모듈

Spring Boot(Security)와 React(Axios) 기반의 풀스택 애플리케이션에서 **CORS 이슈 해결**, **JWT 기반 인증**, 그리고 **Access Token 자동 재발급(Reissue)**을 구현한 전체 아키텍처 및 작업 내역 정리 문서입니다.

---

## 📌 1. 주요 기능 및 작업 요약

* **CORS (Cross-Origin Resource Sharing) 허용**: 백엔드 API 및 프론트엔드 간의 교차 출처 리소스 공유 정책 설정
* **JWT 기반 인증 (Bearer Token)**: 모든 HTTP 요청 헤더에 Access Token 자동 주입
* **토큰 자동 재발급 (Automatic Token Refresh)**: Access Token 만료(401 Unauthorized) 시 Interceptor를 통해 백그라운드에서 `/reissue` 요청 수행 후 기존 실패 요청 재시도
* **동시성 처리 (Queue Lock)**: 동시에 발생하는 여러 401 에러 시 중복 재발급 요청 방지
* **컴포넌트 리팩토링**: React 주요 게시판 컴포넌트에 Interceptor 적용 및 사용자 권한(작성자 본인 확인) 제어

---

## 🏗️ 2. 아키텍처 및 토큰 재발급 흐름
[React Client]                           [Spring Boot Server]
|                                           |
| --- (1) API 요청 (Authorization Header) ---> |
| <--- (2) 401 Unauthorized (Token Expired) - |
|                                           |
[Interceptor]                                   |
| --- (3) POST /api/auth/reissue ---------> | (Refresh Token 검증)
| <--- (4) 200 OK (New Access/Refresh) ---- |
|                                           |
[Token 갱신]                                    |
| --- (5) 기존 실패했던 API 요청 재시도 ------> |
| <--- (6) 200 OK (정상 응답) --------------- |

---

## 🛠️ 3. 세부 구현 내역

### 1) 백엔드 (Spring Boot & Security)
- **CORS Configuration**
  - `allowedOrigins`: `http://localhost:3000` 등 프론트엔드 출처 허용
  - `allowedMethods`: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
  - `exposedHeaders`: `Authorization` (클라이언트에서 응답 헤더 읽기 허용)
  - `allowCredentials`: `true` (쿠키 및 인증 정보 전송 허용)
- **Token Reissue Endpoint (`/reissue` or `/api/auth/reissue`)**
  - 클라이언트로부터 `refreshToken`을 전달받아 유효성 및 DB/Storage 일치 여부 검증
  - 검증 성공 시 새로운 Access Token (및 Refresh Token) 재발급

---

### 2) 프론트엔드 (React & Axios Interceptor)

`axiosInstance.js`를 중앙집중형 HTTP 클라이언트로 구축하여 모든 요청 및 응답을 관리합니다.

#### 🔹 Request Interceptor
```js
// localStorage에서 Access Token을 읽어와 Header에 자동 주입
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

