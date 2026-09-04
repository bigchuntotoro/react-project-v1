pipeline {
    agent any

    environment {
        // =================================================
        // 프로젝트 / 배포 경로
        // =================================================
        TARGET_DIR      = '/home/totoro/Reactproject/my-board-project'
        APP_NAME        = 'my-board-project'

        FRONTEND_DIR    = "${WORKSPACE}/src/frontend"

        // Vite build 결과물
        STATIC_OUT_DIR  = "${WORKSPACE}/src/main/resources/static"

        // Nginx
        NGINX_ROOT      = '/usr/share/nginx/html/my-board-project'

        // =================================================
        // 실행 환경
        // =================================================
        JAVA_HOME       = '/usr/lib/jvm/java-21-openjdk-amd64'
        APP_PORT        = '8083'

        PATH            = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    stages {

        // =================================================
        // 1. React Frontend Build
        // =================================================
        stage('1. Build Frontend (React - Vite)') {

            steps {

                dir("${FRONTEND_DIR}") {

                    sh """
                        set -e

                        echo "================================================="
                        echo "==> Checking Node / NPM"
                        echo "================================================="

                        node -v
                        npm -v

                        echo ""
                        echo "================================================="
                        echo "==> Installing NPM Dependencies"
                        echo "================================================="

                        if [ ! -d "node_modules" ]; then
                            echo "--> node_modules not found"
                            echo "--> Running npm ci"
                            npm ci --prefer-offline
                        else
                            echo "--> node_modules already exists"
                            if [ -f "package-lock.json" ] && [ -f "node_modules/.package-lock.json" ]; then
                                echo "--> package-lock.json found"
                                echo "--> Checking dependency state"
                                npm ci --prefer-offline
                            else
                                echo "--> Dependency lock information not found"
                                echo "--> Running npm ci"
                                npm ci --prefer-offline
                            fi
                        fi

                        echo ""
                        echo "================================================="
                        echo "==> Building React Frontend"
                        echo "================================================="

                        npm run build

                        echo ""
                        echo "================================================="
                        echo "==> React Build Completed"
                        echo "================================================="

                        if [ ! -d "${STATIC_OUT_DIR}" ]; then
                            echo ""
                            echo "ERROR: React build output directory not found."
                            echo "Expected: ${STATIC_OUT_DIR}"
                            echo ""
                            exit 1
                        fi

                        echo ""
                        echo "==> React build output:"
                        echo ""
                        ls -lah "${STATIC_OUT_DIR}"
                    """
                }
            }
        }

        // =================================================
        // 2. Spring Boot Maven Build
        // =================================================
        stage('2. Build Backend (Spring Boot / Maven)') {

            steps {

                configFileProvider([
                    configFile(
                        fileId: 'da43d874-9a27-4a98-800f-43c01ce05318',
                        variable: 'MAVEN_GLOBAL_SETTINGS'
                    )
                ]) {

                    sh """
                        set -e

                        echo "================================================="
                        echo "==> Checking Java"
                        echo "================================================="

                        ${JAVA_HOME}/bin/java -version

                        echo ""
                        echo "================================================="
                        echo "==> Checking Maven"
                        echo "================================================="

                        mvn -version

                        echo ""
                        echo "================================================="
                        echo "==> Building Spring Boot Application"
                        echo "================================================="

                        mvn clean package \\
                            -DskipTests \\
                            -gs "\$MAVEN_GLOBAL_SETTINGS"

                        echo ""
                        echo "================================================="
                        echo "==> Maven Build Completed"
                        echo "================================================="

                        echo ""
                        echo "==> target directory:"
                        ls -lah target/

                        echo ""
                        echo "==> Spring Boot JAR files:"
                        find target \\
                            -maxdepth 1 \\
                            -type f \\
                            -name "*.jar" \\
                            -print
                    """
                }
            }
        }

        // =================================================
        // 3. Deploy React to Nginx
        // =================================================
        stage('3. Deploy Frontend to Nginx') {

            steps {

                sh """
                    set -e

                    echo "================================================="
                    echo "==> Deploying React Frontend to Nginx"
                    echo "================================================="

                    if [ ! -d "${STATIC_OUT_DIR}" ]; then
                        echo ""
                        echo "ERROR: React build output directory not found."
                        echo "${STATIC_OUT_DIR}"
                        exit 1
                    fi

                    echo ""
                    echo "Source: ${STATIC_OUT_DIR}"
                    echo "Target: ${NGINX_ROOT}"

                    echo ""
                    echo "================================================="
                    echo "==> Creating Nginx directory"
                    echo "================================================="

                    sudo mkdir -p "${NGINX_ROOT}"

                    echo ""
                    echo "================================================="
                    echo "==> Syncing React files"
                    echo "================================================="

                    sudo rsync -av --delete \\
                        "${STATIC_OUT_DIR}/" \\
                        "${NGINX_ROOT}/"

                    echo ""
                    echo "================================================="
                    echo "==> Setting Nginx permissions"
                    echo "================================================="

                    sudo chown -R www-data:www-data \\
                        "${NGINX_ROOT}"

                    echo ""
                    echo "================================================="
                    echo "==> Testing Nginx configuration"
                    echo "================================================="

                    sudo nginx -t

                    echo ""
                    echo "================================================="
                    echo "==> Reloading Nginx"
                    echo "================================================="

                    sudo systemctl reload nginx

                    echo ""
                    echo "================================================="
                    echo "==> Frontend Deployment Completed"
                    echo "================================================="
                """
            }
        }

        // =================================================
        // 4. Deploy Spring Boot JAR
        // =================================================
        stage('4. Deploy Backend JAR') {

            steps {

                sh """
                    set -e

                    echo "================================================="
                    echo "==> Preparing Spring Boot Deployment"
                    echo "================================================="

                    echo ""
                    echo "==> Target directory: ${TARGET_DIR}"

                    echo ""
                    echo "================================================="
                    echo "==> Creating deployment directories"
                    echo "================================================="

                    mkdir -p "${TARGET_DIR}"
                    mkdir -p "${TARGET_DIR}/logs"

                    echo ""
                    echo "================================================="
                    echo "==> Finding Spring Boot JAR"
                    echo "================================================="

                    BUILD_JAR=\$(find target \\
                        -maxdepth 1 \\
                        -type f \\
                        -name "*.jar" \\
                        ! -name "*-sources.jar" \\
                        ! -name "*-plain.jar" \\
                        -print \\
                        | head -n 1)

                    if [ -z "\$BUILD_JAR" ]; then
                        echo ""
                        echo "ERROR: Spring Boot JAR file not found."
                        echo ""
                        echo "===== target directory ====="
                        ls -lah target/
                        exit 1
                    fi

                    echo ""
                    echo "BUILD_JAR: \$BUILD_JAR"

                    echo ""
                    echo "================================================="
                    echo "==> Copying Spring Boot JAR"
                    echo "================================================="

                    cp -f \\
                        "\$BUILD_JAR" \\
                        "${TARGET_DIR}/${APP_NAME}.jar"

                    chmod 755 \\
                        "${TARGET_DIR}/${APP_NAME}.jar"

                    echo ""
                    echo "Deployment JAR: ${TARGET_DIR}/${APP_NAME}.jar"

                    echo ""
                    ls -lh "${TARGET_DIR}/${APP_NAME}.jar"

                    echo ""
                    echo "================================================="
                    echo "==> Backend JAR Deployment Completed"
                    echo "================================================="
                """
            }
        }

        // =================================================
        // 5. Restart Spring Boot using systemd
        // =================================================
        stage('5. Restart Backend (systemd)') {

            steps {

                sh """
                    set -e

                    echo "================================================="
                    echo "==> Spring Boot systemd Deployment"
                    echo "================================================="

                    SERVICE_NAME="my-board-project"

                    echo ""
                    echo "Service: \${SERVICE_NAME}"
                    echo "Port: ${APP_PORT}"

                    echo ""
                    echo "================================================="
                    echo "==> Reloading systemd"
                    echo "================================================="

                    sudo systemctl daemon-reload

                    echo ""
                    echo "================================================="
                    echo "==> Stopping Existing Application"
                    echo "================================================="

                    sudo systemctl stop "\${SERVICE_NAME}" || true
                    sleep 2

                    echo ""
                    echo "================================================="
                    echo "==> Starting Spring Boot"
                    echo "================================================="

                    sudo systemctl start "\${SERVICE_NAME}"

                    echo ""
                    echo "================================================="
                    echo "==> systemd Status"
                    echo "================================================="

                    sudo systemctl --no-pager \\
                        -l status "\${SERVICE_NAME}" || true

                    echo ""
                    echo "================================================="
                    echo "==> Waiting for Spring Boot"
                    echo "================================================="

                    STARTED=false

                    for i in \$(seq 1 30); do
                        HTTP_CODE=\$(curl \\
                            -s \\
                            -o /dev/null \\
                            -w "%{http_code}" \\
                            --connect-timeout 1 \\
                            "http://127.0.0.1:${APP_PORT}/api/boards" \\
                            || true)

                        if [ "\$HTTP_CODE" != "000" ]; then
                            echo ""
                            echo "Spring Boot responded."
                            echo "HTTP Status: \${HTTP_CODE}"
                            STARTED=true
                            break
                        fi

                        echo "--> Waiting for Spring Boot... \${i}/30"
                        sleep 1
                    done

                    if [ "\$STARTED" != "true" ]; then
                        echo ""
                        echo "================================================="
                        echo "ERROR: Spring Boot failed to start"
                        echo "================================================="

                        echo ""
                        echo "===== systemctl status ====="
                        sudo systemctl --no-pager -l status "\${SERVICE_NAME}" || true

                        echo ""
                        echo "===== systemctl is-active ====="
                        sudo systemctl is-active "\${SERVICE_NAME}" || true

                        echo ""
                        echo "===== systemctl is-enabled ====="
                        sudo systemctl is-enabled "\${SERVICE_NAME}" || true

                        echo ""
                        echo "===== Port ${APP_PORT} ====="
                        lsof -i:${APP_PORT} || true

                        echo ""
                        echo "===== Process ====="
                        ps -ef | grep "${APP_NAME}.jar" | grep -v grep || true

                        echo ""
                        echo "===== Journalctl ====="
                        sudo journalctl -u "\${SERVICE_NAME}" -n 100 --no-pager || true

                        echo ""
                        echo "===== backend-error.log ====="
                        tail -100 "${TARGET_DIR}/logs/backend-error.log" || true

                        echo ""
                        echo "===== backend-out.log ====="
                        tail -100 "${TARGET_DIR}/logs/backend-out.log" || true

                        exit 1
                    fi

                    echo ""
                    echo "================================================="
                    echo "==> Backend Health Check"
                    echo "================================================="

                    HTTP_CODE=\$(curl \\
                        -s \\
                        -o /dev/null \\
                        -w "%{http_code}" \\
                        --connect-timeout 5 \\
                        "http://127.0.0.1:${APP_PORT}/api/boards" \\
                        || true)

                    echo ""
                    echo "Backend HTTP Status: \${HTTP_CODE}"

                    if [ "\$HTTP_CODE" = "000" ]; then
                        echo ""
                        echo "ERROR: Backend health check failed."
                        exit 1
                    fi

                    echo ""
                    echo "================================================="
                    echo "==> Backend Deployment Completed"
                    echo "================================================="

                    echo ""
                    echo "Service : \${SERVICE_NAME}"
                    echo "Port    : ${APP_PORT}"
                    echo "JAR     : ${TARGET_DIR}/${APP_NAME}.jar"
                    echo "Log     : ${TARGET_DIR}/logs/backend-out.log"
                    echo "Error   : ${TARGET_DIR}/logs/backend-error.log"

                    echo ""
                    echo "================================================="
                    echo "==> Final systemd Status"
                    echo "================================================="

                    sudo systemctl --no-pager -l status "\${SERVICE_NAME}" || true
                """
            }
        }
    }

    // =====================================================
    // POST ACTIONS
    // =====================================================
    post {
        success {
            echo """
=================================================
Successfully deployed ${APP_NAME}!
=================================================

Frontend
  Nginx          :83

Backend
  systemd        : my-board-project
  Spring Boot    :8083

=================================================
"""
        }

        failure {
            echo """
=================================================
Deployment FAILED
=================================================

Application : ${APP_NAME}
Frontend    : Nginx :83
Backend     : systemd / Spring Boot :8083

Check Jenkins console logs.

=================================================
"""
        }

        always {
            echo "================================================="
            echo "==> Jenkins Pipeline Finished"
            echo "================================================="
        }
    }
}