pipeline {
    agent any

    environment {
        // =========================================================
        // 프로젝트 / 배포 경로
        // =========================================================
        TARGET_DIR      = '/home/totoro/Reactproject/my-board-project'
        APP_NAME        = 'my-board-project'
        FRONTEND_DIR    = "${WORKSPACE}/src/frontend"

        // Vite build 결과물
        STATIC_OUT_DIR  = "${WORKSPACE}/src/main/resources/static"

        // Nginx
        NGINX_ROOT      = '/usr/share/nginx/html/my-board-project'

        // =========================================================
        // 실행 환경
        // =========================================================
        JAVA_HOME       = '/usr/lib/jvm/java-21-openjdk-amd64'
        APP_PORT        = '8083'
        PATH            = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    stages {

        // =========================================================
        // 1. React Frontend Build
        // =========================================================
        stage('1. Build Frontend (React - Vite)') {
            steps {
                dir("${FRONTEND_DIR}") {

                        echo "================================================="
                        echo "==> Checking Node/NPM Dependencies"
                        echo "================================================="

                        if [ -f "node_modules/.package-lock.hash" ] && \
                           cmp -s package-lock.json node_modules/.package-lock.hash; then

                            echo "--> package-lock.json 변경 없음"
                            echo "--> npm install 스킵"

                        else

                            echo "--> package-lock.json 변경 또는 node_modules 없음"
                            echo "--> npm ci 실행"

                            npm ci --prefer-offline

                            cp package-lock.json node_modules/.package-lock.hash
                        fi

                        echo "================================================="
                        echo "==> Building React Frontend"
                        echo "================================================="

                        npm run build

                }
            }
        }

        // =========================================================
        // 2. Spring Boot Build
        // =========================================================
        stage('2. Build Backend (Spring Boot / Maven)') {
            steps {
                configFileProvider([
                    configFile(
                        fileId: 'da43d874-9a27-4a98-800f-43c01ce05318',
                        variable: 'MAVEN_GLOBAL_SETTINGS'
                    )
                ]) {

                        echo "================================================="
                        echo "==> Building Spring Boot Application"
                        echo "================================================="

                        mvn clean package \
                            -DskipTests \
                            -gs $MAVEN_GLOBAL_SETTINGS

                }
            }
        }

        // =========================================================
        // 3. React → Nginx Deploy
        // =========================================================
        stage('3. Deploy Frontend to Nginx') {
            steps {

                    echo "================================================="
                    echo "==> Deploying React Frontend to Nginx"
                    echo "================================================="

                    sudo mkdir -p ${NGINX_ROOT}

                    if [ -d "${STATIC_OUT_DIR}" ]; then

                        echo "--> React build directory:"
                        echo "    ${STATIC_OUT_DIR}"

                        sudo rsync -av --delete \
                            ${STATIC_OUT_DIR}/ \
                            ${NGINX_ROOT}/

                    else

                        echo "ERROR: React build 결과물을 찾을 수 없습니다."
                        exit 1

                    fi

                    echo "==> Setting Nginx permissions"

                    sudo chown -R www-data:www-data ${NGINX_ROOT}

                    echo "==> Testing Nginx configuration"

                    sudo nginx -t

                    echo "==> Reloading Nginx"

                    sudo systemctl reload nginx

            }
        }

        // =========================================================
        // 4. Spring Boot Deploy
        // =========================================================
        stage('4. Deploy Backend & Restart Application') {
            steps {
                    echo "================================================="
                    echo "==> Preparing Spring Boot Deployment"
                    echo "================================================="

                    mkdir -p ${TARGET_DIR}
                    mkdir -p ${TARGET_DIR}/logs

                    echo "================================================="
                    echo "==> Finding Spring Boot JAR"
                    echo "================================================="

                    BUILD_JAR=$(find target \
                        -maxdepth 1 \
                        -type f \
                        -name "*.jar" \
                        ! -name "*-sources.jar" \
                        ! -name "*-plain.jar" \
                        | head -n 1)

                    if [ -z "$BUILD_JAR" ]; then
                        echo "ERROR: JAR 파일을 찾을 수 없습니다."
                        exit 1
                    fi

                    echo "--> BUILD_JAR = $BUILD_JAR"

                    echo "================================================="
                    echo "==> Copying JAR"
                    echo "================================================="

                    cp -f "$BUILD_JAR" \
                        ${TARGET_DIR}/${APP_NAME}.jar

                    cd ${TARGET_DIR}

                    // =================================================
                    // 기존 Spring Boot 종료
                    // =================================================
                    echo "================================================="
                    echo "==> Stopping Existing Spring Boot Application"
                    echo "================================================="

                    if [ -f "${APP_NAME}.pid" ]; then

                        OLD_PID=$(cat "${APP_NAME}.pid")

                        echo "--> PID file found: ${OLD_PID}"

                        if kill -0 "$OLD_PID" 2>/dev/null; then

                            echo "--> Stopping PID: ${OLD_PID}"

                            kill "$OLD_PID"

                            for i in $(seq 1 10); do

                                if kill -0 "$OLD_PID" 2>/dev/null; then
                                    echo "--> Waiting for process termination... ${i}/10"
                                    sleep 1
                                else
                                    echo "--> Process stopped."
                                    break
                                fi

                            done

                            if kill -0 "$OLD_PID" 2>/dev/null; then

                                echo "--> Process did not stop."
                                echo "--> Force killing PID: ${OLD_PID}"

                                kill -9 "$OLD_PID"

                                sleep 1
                            fi

                        else

                            echo "--> PID ${OLD_PID} is not running."

                        fi

                        rm -f "${APP_NAME}.pid"

                    else

                        echo "--> PID file not found."

                    fi

                    // =================================================
                    // 8083 포트를 사용하는 기존 프로세스 확인
                    // =================================================
                    echo "================================================="
                    echo "==> Checking Port ${APP_PORT}"
                    echo "================================================="

                    EXISTING_PID=$(lsof -ti:${APP_PORT} 2>/dev/null || true)

                    if [ -n "$EXISTING_PID" ]; then

                        echo "--> Existing process on port ${APP_PORT}:"
                        echo "$EXISTING_PID"

                        echo "--> Stopping existing process..."

                        kill $EXISTING_PID || true

                        sleep 2

                        EXISTING_PID=$(lsof -ti:${APP_PORT} 2>/dev/null || true)

                        if [ -n "$EXISTING_PID" ]; then
                            echo "--> Force killing process..."
                            kill -9 $EXISTING_PID || true
                            sleep 1
                        fi

                    else

                        echo "--> Port ${APP_PORT} is free."

                    fi

                    // =================================================
                    // Spring Boot 실행
                    // =================================================
                    echo "================================================="
                    echo "==> Starting Spring Boot Application"
                    echo "================================================="

                    nohup ${JAVA_HOME}/bin/java \
                        -Dserver.port=${APP_PORT} \
                        -jar ${APP_NAME}.jar \
                        > ${TARGET_DIR}/logs/backend-out.log \
                        2> ${TARGET_DIR}/logs/backend-error.log \
                        < /dev/null &

                    APP_PID=$!

                    echo ${APP_PID} > ${APP_NAME}.pid

                    echo "--> Spring Boot PID : ${APP_PID}"
                    echo "--> Spring Boot PORT: ${APP_PORT}"
                    echo "--> Spring Boot JAR : ${TARGET_DIR}/${APP_NAME}.jar"

                    // =================================================
                    // Spring Boot 기동 확인
                    // =================================================
                    echo "================================================="
                    echo "==> Waiting for Spring Boot"
                    echo "================================================="

                    STARTED=false

                    for i in $(seq 1 30); do

                        if curl -s \
                            --connect-timeout 1 \
                            http://127.0.0.1:${APP_PORT}/api/boards \
                            > /dev/null 2>&1; then

                            echo ""
                            echo "================================================="
                            echo "==> Spring Boot is running"
                            echo "================================================="

                            STARTED=true
                            break

                        fi

                        echo "--> Waiting for Spring Boot... ${i}/30"

                        sleep 1

                    done

                    // =================================================
                    // 기동 실패
                    // =================================================
                    if [ "$STARTED" != "true" ]; then

                        echo ""
                        echo "================================================="
                        echo "ERROR: Spring Boot failed to start"
                        echo "================================================="

                        echo ""
                        echo "===== Process ====="

                        ps -ef | grep "${APP_NAME}.jar" | grep -v grep || true

                        echo ""
                        echo "===== Port ${APP_PORT} ====="

                        lsof -i:${APP_PORT} || true

                        echo ""
                        echo "===== backend-error.log ====="

                        tail -100 \
                            ${TARGET_DIR}/logs/backend-error.log || true

                        echo ""
                        echo "===== backend-out.log ====="

                        tail -100 \
                            ${TARGET_DIR}/logs/backend-out.log || true

                        echo ""

                        exit 1
                    fi

                    // =================================================
                    // 배포 완료
                    // =================================================
                    echo ""
                    echo "================================================="
                    echo "==> Backend Deployment Completed"
                    echo "================================================="

                    echo "PID  : ${APP_PID}"
                    echo "PORT : ${APP_PORT}"
                    echo "JAR  : ${TARGET_DIR}/${APP_NAME}.jar"
                    echo "LOG  : ${TARGET_DIR}/logs/backend-out.log"
                    echo "ERROR: ${TARGET_DIR}/logs/backend-error.log"

                    echo ""
                    echo "==> Backend Health Check"

                    curl -i \
                        --connect-timeout 5 \
                        http://127.0.0.1:${APP_PORT}/api/boards || true
            }
        }
    }

    post {

        success {
            echo "================================================="
            echo "Successfully deployed ${APP_NAME}!"
            echo "================================================="
            echo "Frontend : Nginx :83"
            echo "Backend  : Spring Boot :8083"
        }

        failure {
            echo "================================================="
            echo "Deployment failed."
            echo "================================================="
            echo "Check Jenkins console logs."
        }
    }
}