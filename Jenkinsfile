pipeline {
    agent any

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
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy Frontend to Nginx') {
            steps {
                sh 'sudo cp -r src/frontend/dist/* /var/www/html/'
            }
        }

        stage('Backend Build') {
            steps {
                // Config File Provider 플러그인을 활용한 글로벌 settings.xml 적용
                configFileProvider([
                    configFile(
                        fileId: 'da43d874-9a27-4a98-800f-43c01ce05318',
                        variable: 'MAVEN_GLOBAL_SETTINGS'
                    )
                ]) {
                    // -gs 옵션으로 제공된 글로벌 settings.xml 파일 경로 지정
                    sh 'mvn clean package -DskipTests -gs $MAVEN_GLOBAL_SETTINGS'
                }
            }
        }

        stage('Deploy Backend with PM2') {
            steps {
                script {
                    sh "mkdir -p ${PROJECT_PATH}"
                    sh "cp target/*.jar ${PROJECT_PATH}/app.jar"

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
}