pipeline {
    agent any

    tools {
        nodejs 'NodeJS24'   // Jenkins Tools에 등록한 이름과 동일하게
    }

    environment {
        DEPLOY_DIR = '/usr/share/nginx/html/my-board-project-vue'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/bigchuntotoro/my-board-project-vue.git'
                    // private repo면 credentialsId: 'your-git-cred' 추가
            }
        }

        stage('Install & Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    rm -rf ${DEPLOY_DIR}/*
                    cp -r dist/* ${DEPLOY_DIR}/
                '''
            }
        }

        stage('Reload Nginx') {
            steps {
                sh 'sudo /bin/systemctl reload nginx'
            }
        }
    }

    post {
        success {
            echo 'Vue 배포 완료'
        }
        failure {
            echo '배포 실패 - 로그 확인 필요'
        }
    }
}