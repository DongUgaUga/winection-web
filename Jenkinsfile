pipeline {
    agent any
    environment {
        VITE_SERVER_URL = credentials('vite_server_url')
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/DongUgaUga/winection-web.git'
            }
        }

stage('Set up Environment Variables') {
            steps {
                script {
                    sh """
                    echo "VITE_SERVER_URL=${VITE_SERVER_URL}" > .env
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                script {
                    sh "echo "VITE_SERVER_URL=${VITE_SERVER_URL}" > .env"
                    sh "docker-compose down"
                    sh "docker-compose up -d --build web"
                }
            }
        }
    }
}