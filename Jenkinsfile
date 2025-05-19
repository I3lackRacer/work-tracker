pipeline {
    agent any

    tools {
        jdk 'JDK24'
        nodejs 'Node18'
        maven 'Maven3'
    }

    environment {
        NODE_VERSION = '18.17.0'
        DOCKER_IMAGE = 'tim4308/work-tracker'
        DOCKER_TAG = "${BUILD_NUMBER}"
        DEPLOY_SCRIPT = 'deploy.sh'
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
                script {
                    sshagent(['ssh-credentials-id']) {
                        sh """
                            scp ${DEPLOY_SCRIPT} server@work.suellner.dev:~/docker/work-tracker/${DEPLOY_SCRIPT}
                            ssh server@work.suellner.dev "cd ~/docker/work-tracker/ && chmod +x ${DEPLOY_SCRIPT} && ./${DEPLOY_SCRIPT} ${DOCKER_TAG}"
                        """
                    }
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
