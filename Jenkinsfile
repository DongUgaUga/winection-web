pipeline {
    agent any

    environment {
        VITE_SERVER_URL = credentials('vite_server_url')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', credentialsId: 'github_token', url: 'https://github.com/DongUgaUga/winection-web.git'
            }
        }

        stage('Setup') {
            steps {
                script {
                    sh '''
                    echo "VITE_SERVER_URL=$VITE_SERVER_URL" > .env
                    chmod 600 .env
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sh "docker-compose down"
                    sh "docker-compose up -d --build web"
                }
            }
        }
    }
}