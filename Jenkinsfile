pipeline {
    agent any

    //Global Tool Configuration에서 지정한 Maven Name 매핑
    tools {
        maven 'maven-3.8.7'
    }

    environment {
        PROJECT_PATH = '/home/totoro/Reactproject/my-board-project'
        LOG_PATH     = "${PROJECT_PATH}/backend.log"
    }

    stages {
        stage('Frontend Build') {
            steps {
                dir('src/frontend') {
                    // 패키지 설치 및 빌드 (Vite/CRA 기준)
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy Frontend to Nginx') {
            steps {
                // React 빌드 결과물(dist 또는 build)을 Nginx 웹 루트로 복사
                // ※ Vite 사용 시 dist, CRA 사용 시 build 폴더로 경로 변경 필요
                sh 'sudo cp -r src/frontend/dist/* /var/www/html/'
            }
        }

        stage('Backend Build') {
            steps {
                // Maven 빌드 (테스트 제외)
                sh 'mvn clean package -DskipTests'
            }
        }

        stage('Deploy Backend with PM2') {
            steps {
                script {
                    // 배포 경로 폴더 생성
                    sh "mkdir -p ${PROJECT_PATH}"

                    // 빌드된 jar 파일을 배포 위치로 이동
                    sh "cp target/*.jar ${PROJECT_PATH}/app.jar"

                    // PM2 프로세스 재시작 또는 새로 실행
                    // backend.log 파일로 stdout / stderr 통합 기록
                    sh """
                        pm2 start "java -jar ${PROJECT_PATH}/app.jar" \
                            --name "my-board-backend" \
                            --log "${LOG_PATH}" \
                            --append || pm2 restart "my-board-backend"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Successfully deployed frontend and backend!"
        }
        failure {
            echo "Deployment failed."
        }
    }
}