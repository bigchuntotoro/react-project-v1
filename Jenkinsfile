pipeline {
    agent any

    environment {
        // 배포 경로 및 앱 설정
        TARGET_DIR    = '/home/totoro/Reactproject/my-board-project'
        APP_NAME      = 'my-board-project'
        FRONTEND_DIR  = "${WORKSPACE}/src/frontend"

        // Vite --outDir 설정으로 인해 생성되는 정적 자원 경로
        STATIC_OUT_DIR = "${WORKSPACE}/src/main/resources/static"

        NGINX_ROOT    = '/usr/share/nginx/html/my-board-project'

        // 실행 환경 설정 (포트 및 JAVA_HOME)
        JAVA_HOME     = '/usr/lib/jvm/java-21-openjdk-amd64'
        APP_PORT      = '8083'
        PATH          = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
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
                    echo "==> Syncing Frontend Assets to Nginx Directory"
                    sudo mkdir -p ${NGINX_ROOT}

                    # Vite 결과물이 생성된 static 디렉터리 동기화
                    if [ -d "${STATIC_OUT_DIR}" ]; then
                        echo "정적 자원 디렉터리(${STATIC_OUT_DIR}) 감지됨"
                        sudo rsync -av --delete ${STATIC_OUT_DIR}/ ${NGINX_ROOT}/
                    else
                        echo "오류: 프론트엔드 빌드 결과물 경로를 찾을 수 없습니다."
                        exit 1
                    fi

                    sudo chown -R www-data:www-data ${NGINX_ROOT}

                    echo "==> Reloading Nginx Service"
                    sudo systemctl reload nginx
                '''
            }
        }

        stage('4. Deploy Backend & Restart Application') {
            steps {
                sh '''
                    echo "==> Preparing Target Directory"
                    mkdir -p ${TARGET_DIR}
                    mkdir -p ${TARGET_DIR}/logs

                    echo "==> Copying Spring Boot Executable JAR"
                    BUILD_JAR=$(find target -name "*.jar" ! -name "*-sources.jar" | head -n 1)

                    if [ -z "$BUILD_JAR" ]; then
                        echo "오류: JAR 파일을 찾을 수 없습니다."
                        exit 1
                    fi

                    cp -f "$BUILD_JAR" ${TARGET_DIR}/${APP_NAME}.jar

                    cd ${TARGET_DIR}

                    echo "==> Restarting Backend Service via PM2"

                    if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
                        echo "Cleaning up existing PM2 process..."
                        pm2 delete ${APP_NAME}
                    fi

                    echo "==> Starting Spring Boot"

                    pm2 start java \
                      --name "${APP_NAME}" \
                      --output "${TARGET_DIR}/logs/backend-out.log" \
                      --error "${TARGET_DIR}/logs/backend-error.log" \
                      --time \
                      -- \
                      -jar \
                      -Dserver.port=${APP_PORT} \
                      ${APP_NAME}.jar

                    pm2 save

                    echo "==> Backend log files"
                    echo "OUT   : ${TARGET_DIR}/logs/backend-out.log"
                    echo "ERROR : ${TARGET_DIR}/logs/backend-error.log"
                '''
            }
        }
    }

    post {
        success {
            echo "Successfully deployed ${APP_NAME}!"
        }
        failure {
            echo "Deployment failed. Check Jenkins console logs."
        }
    }
}