pipeline {
    agent any

    tools {
        jdk 'JDK24'
        nodejs 'Node18'
        maven 'Maven3'
    }

    environment {
        NODE_VERSION = '18.17.0'
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
            steps {
                dir('app') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Build') {
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
                    // Add your docker registry credentials and URL
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
                // Add your deployment steps here
                // Example: Deploy to a server using SSH
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