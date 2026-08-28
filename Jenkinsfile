pipeline {
    agent any

    // Global Tool Configuration에서 지정한 Maven Name 매핑
    tools {
        maven 'maven-3.8.7'
    }

    environment {
        PROJECT_PATH = '/home/totoro/Reactproject/my-board-project'
        LOG_PATH     = "${PROJECT_PATH}/backend.log"
        // M2 캐시 경로를 지정하여 빌드 속도 최적화
        M2_REPO      = '/var/jenkins_home/.m2/repository'
    }

    stages {
        stage('Frontend Build') {
            steps {
                dir('src/frontend') {
                    // 패키지 설치 및 빌드 (Vite 기준)
                    sh 'npm ci || npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy Frontend to Nginx') {
            steps {
                // 기존 /var/www/html 파일 비우고 최신 dist 파일 복사 (rsync 권장)
                // 만약 rsync가 없다면: sh 'sudo rm -rf /var/www/html/* && sudo cp -r src/frontend/dist/* /var/www/html/'
                sh 'sudo rsync -av --delete src/frontend/dist/ /var/www/html/'
            }
        }

        stage('Backend Build') {
            steps {
                // Maven 로컬 레포지토리 캐시 활용 및 진척도 로그 생략(-ntp)으로 속도 개선
                sh "mvn clean package -DskipTests -Dmaven.repo.local=${M2_REPO} -ntp"
            }
        }

        stage('Deploy Backend with PM2') {
            steps {
                script {
                    // 배포 경로 폴더 생성
                    sh "mkdir -p ${PROJECT_PATH}"

                    // Plain jar를 제외한 실행 가능한 main jar 파일만 이동
                    sh "cp target/*[!plain].jar ${PROJECT_PATH}/app.jar"

                    // PM2 안정적 재시작
                    // 기존 동일 이름의 프로세스가 존재하면 정지 후 삭제하고 새로 실행
                    sh """
                        pm2 delete my-board-backend || true
                        pm2 start "java -jar ${PROJECT_PATH}/app.jar" \
                            --name "my-board-backend" \
                            --log "${LOG_PATH}" \
                            --append
                        pm2 save
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