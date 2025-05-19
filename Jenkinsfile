pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'work-tracker'
        DOCKER_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend Build') {
            agent {
                docker {
                    image 'node:18.17'
                    args '-v $HOME/.npm:/root/.npm' // optional: caching
                }
            }
            steps {
                dir('app') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Build') {
            agent {
                docker {
                    image 'maven:3.9-eclipse-temurin-21'
                    args '-v $HOME/.m2:/root/.m2' // optional: caching
                }
            }
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        stage('Docker Push') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry('https://your-registry-url', 'docker-credentials-id') {
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push()
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push('latest')
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sshagent(['ssh-credentials-id']) {
                    sh '''
                        ssh user@your-server "cd /app && \
                        docker pull ${DOCKER_IMAGE}:${DOCKER_TAG} && \
                        docker stop work-tracker || true && \
                        docker rm work-tracker || true && \
                        docker run -d --name work-tracker \
                            -p 8080:8080 \
                            -v /data/work-tracker:/app/data \
                            ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
