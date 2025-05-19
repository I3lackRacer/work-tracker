pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'tim4308/work-tracker'
        DOCKER_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // stage('Frontend Build') {
        //     agent {
        //         docker {
        //             image 'node:18.17'
        //             args '-v $HOME/.npm:/root/.npm'
        //         }
        //     }
        //     steps {
        //         dir('app') {
        //             sh 'npm install'
        //             sh 'npm run build'
        //         }
        //     }
        // }

        // stage('Backend Build') {
        //     agent {
        //         docker {
        //             image 'my-maven-jdk24' // <- dein eigenes Image mit Java 24
        //             args '-v $HOME/.m2:/root/.m2'
        //         }
        //     }
        //     steps {
        //         dir('backend') {
        //             sh 'mvn clean package -DskipTests'
        //         }
        //     }
        // }

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
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-credentials') {
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
