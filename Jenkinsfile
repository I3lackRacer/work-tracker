pipeline {
    agent any

    environment {
        NODE_VERSION = '18.17.0'  // LTS version
        DOCKER_IMAGE = 'work-tracker'
        DOCKER_TAG = 'latest'
    }

    stages {
        stage('Setup') {
            steps {
                // Clean workspace
                cleanWs()
                // Checkout code
                checkout scm
                // Setup Node.js
                nodejs(nodeJSInstallationName: 'Node ' + NODE_VERSION) {
                    sh 'npm install -g pnpm'
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                nodejs(nodeJSInstallationName: 'Node ' + NODE_VERSION) {
                    sh 'pnpm install'
                }
            }
        }

        stage('Lint') {
            steps {
                nodejs(nodeJSInstallationName: 'Node ' + NODE_VERSION) {
                    sh 'pnpm run lint'
                }
            }
        }

        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: 'Node ' + NODE_VERSION) {
                    // Build frontend
                    sh 'pnpm run build'
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    // Build Docker image
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Stop existing container if running
                    sh '''
                        if docker ps -a | grep -q ${DOCKER_IMAGE}; then
                            docker stop ${DOCKER_IMAGE}
                            docker rm ${DOCKER_IMAGE}
                        fi
                    '''
                    
                    // Run new container
                    sh '''
                        docker run -d \
                            --name ${DOCKER_IMAGE} \
                            -p 3000:3000 \
                            -e VITE_API_URL=\${API_URL} \
                            --restart unless-stopped \
                            ${DOCKER_IMAGE}:${DOCKER_TAG}
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
        always {
            // Clean up old images
            sh '''
                docker image prune -f
            '''
        }
    }
} 