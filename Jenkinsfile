pipeline {
    agent any

    environment {
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

        // Optional: baue das Image lokal
        stage('Docker Build') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        // Push nur auf main
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

        // Deployment über Skript
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sshagent(['ssh-credentials-netcup-shared']) {
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
