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
                sshagent(['ssh-credentials-netcup-shared']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no server@work.suellner.dev 'docker stop work-tracker || true && \
                            docker rm work-tracker || true && \
                            docker run -d --name work-tracker \
                                --network proxy \
                                -v /etc/localtime:/etc/localtime:ro \
                                -v /home/server/docker/work-tracker/database.db:/app/database.db \
                                -e VITE_API_URL=work.suellner.dev \
                                -l traefik.enable=true \
                                -l traefik.http.routers.work-secure.entrypoints=websecure \
                                -l "traefik.http.routers.work-secure.rule=Host('work.suellner.dev')" \
                                -l traefik.http.routers.work-secure.tls=true \
                                -l traefik.http.routers.work-secure.tls.certresolver=netcup \
                                -l traefik.http.services.work.loadbalancer.server.port=8080 \
                                ${DOCKER_IMAGE}:${DOCKER_TAG}'
                    """
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
