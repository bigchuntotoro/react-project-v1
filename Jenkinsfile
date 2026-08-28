pipeline {
    agent any

    environment {
        // 배포 경로 및 앱 설정
        TARGET_DIR   = '/home/totoro/Reactproject/my-board-project'
        APP_NAME     = 'my-board-project'
        FRONTEND_DIR = "${WORKSPACE}/frontend" // 경로 수정 (src/frontend -> frontend)
        NGINX_ROOT   = '/usr/share/nginx/html/my-board-project'

        // 실행 환경 설정
        JAVA_HOME    = '/usr/lib/jvm/java-21-openjdk-amd64'
        APP_PORT     = '8083'
        PATH         = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    stages {
        stage('1. Build Frontend (React)') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh '''
                        echo "==> Node/NPM Dependencies Installation"
                        npm install

                        echo "==> Building Frontend Application"
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

                    # 빌드 결과물 경로 탐색 및 복사
                    if [ -d "${FRONTEND_DIR}/dist" ]; then
                        echo "dist 디렉터리 감지됨"
                        sudo chmod -R 755 ${FRONTEND_DIR}/dist
                        sudo rsync -av --delete ${FRONTEND_DIR}/dist/ ${NGINX_ROOT}/
                    elif [ -d "${FRONTEND_DIR}/build" ]; then
                        echo "build 디렉터리 감지됨"
                        sudo chmod -R 755 ${FRONTEND_DIR}/build
                        sudo rsync -av --delete ${FRONTEND_DIR}/build/ ${NGINX_ROOT}/
                    else
                        echo "오류: 프론트엔드 빌드 결과물(dist 또는 build)을 찾을 수 없습니다."
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