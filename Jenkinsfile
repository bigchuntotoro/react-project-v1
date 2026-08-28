pipeline {
    agent any

    environment {
        // 배포 경로 및 앱 설정
        TARGET_DIR   = '/home/totoro/Reactproject/my-board-project'
        APP_NAME     = 'my-board-project'

        FRONTEND_DIR = "${WORKSPACE}/src/frontend"
        // Vite --outDir 설정으로 인해 생성되는 빌드 결과물 경로
        BUILD_OUT_DIR = "${WORKSPACE}/src/main/resources/static"

        NGINX_ROOT   = '/usr/share/nginx/html/my-board-project'

        // 실행 환경 설정 (포트 및 JAVA_HOME)
        JAVA_HOME    = '/usr/lib/jvm/java-21-openjdk-amd64'
        APP_PORT     = '8083'
        PATH         = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    stages {
        stage('1. Build Frontend (React - Vite)') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh '''
                        echo "==> Node/NPM Dependencies Installation"
                        npm install

                        echo "==> Building Frontend Application (Vite)"
                        npm run build
                    '''
                }
            }
        }

        stage('2. Build Backend (Spring Boot / Maven)') {
            steps {
                configFileProvider([
                    configFile(
                        fileId: 'da43d874-9a27-4a98-800f-43c01ce05318',
                        variable: 'MAVEN_GLOBAL_SETTINGS'
                    )
                ]) {
                    sh '''
                        echo "==> Building Spring Boot Application with Maven"
                        mvn clean package -DskipTests -gs $MAVEN_GLOBAL_SETTINGS
                    '''
                }
            }
        }

        stage('3. Deploy Frontend to Nginx') {
            steps {
                sh '''
                    echo "==> Syncing Frontend Assets to Nginx원인은 Vite 빌드 명령어에 설정된 **출력 경로(`--outDir`)** 때문입니다.

현재 `package.json`의 빌드 스크립트가 다음과 같이 작성되어 있습니다:

```bash
vite build --outDir ../main/resources/static --emptyOutDir