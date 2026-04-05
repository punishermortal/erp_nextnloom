pipeline {
    agent any

    environment {
        PROJECT_DIR = "${WORKSPACE}"
        BACKEND_DIR = "${PROJECT_DIR}/backend"
        FRONTEND_DIR = "${PROJECT_DIR}/frontend"
        DOCKER_COMPOSE = "docker-compose -f docker-compose.prod.yml"
        SERVER_USER = "nbgecdpsvr"
        SERVER_HOST = "localhost"
        DEPLOY_DIR = "/home/nbgecdpsvr/nextbloom"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo "Building Docker images..."
                    sh """
                        cd ${PROJECT_DIR}
                        docker-compose -f docker-compose.prod.yml build --no-cache
                    """
                }
            }
        }

        stage('Test Backend') {
            steps {
                script {
                    echo "Running backend tests..."
                    sh """
                        cd ${BACKEND_DIR}
                        docker-compose -f ${PROJECT_DIR}/docker-compose.prod.yml run --rm backend python manage.py check || true
                    """
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                script {
                    echo "Deploying to production server..."
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'nextbloom_server_ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )]) {
                        sh """
                            # Create deployment directory if it doesn't exist
                            ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "
                                mkdir -p ${DEPLOY_DIR}
                            "
                            
                            # Copy files to server
                            rsync -avz --exclude='.git' --exclude='node_modules' --exclude='venv' --exclude='.next' \
                                -e "ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no" \
                                ${PROJECT_DIR}/ ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_DIR}/
                            
                            # Deploy on server
                            ssh -i \${SSH_KEY} -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "
                                cd ${DEPLOY_DIR}
                                
                                # Load environment variables
                                if [ -f .env.prod ]; then
                                    export \$(cat .env.prod | grep -v '^#' | xargs)
                                fi
                                
                                # Stop existing containers
                                docker-compose -f docker-compose.prod.yml down || true
                                
                                # Pull/build images
                                docker-compose -f docker-compose.prod.yml build
                                
                                # Run migrations
                                docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate --noinput
                                
                                # Collect static files
                                docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput
                                
                                # Start services
                                docker-compose -f docker-compose.prod.yml up -d
                                
                                # Clean up old images
                                docker image prune -f
                            "
                        """
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "Performing health checks..."
                    sleep(time: 10, unit: 'SECONDS')
                    sh """
                        # Check backend health
                        curl -f http://${SERVER_HOST}:8000/api/products/ || exit 1
                        
                        # Check frontend health
                        curl -f http://${SERVER_HOST}:3000 || exit 1
                        
                        echo "✅ Health checks passed!"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ NextBloom deployed successfully to ${SERVER_HOST}!"
            emailext (
                subject: "✅ NextBloom Deployment Successful",
                body: "Deployment to ${SERVER_HOST} completed successfully.\n\nBackend: http://${SERVER_HOST}:8000\nFrontend: http://${SERVER_HOST}:3000",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        failure {
            echo "❌ Deployment failed. Please check logs."
            emailext (
                subject: "❌ NextBloom Deployment Failed",
                body: "Deployment to ${SERVER_HOST} failed. Please check Jenkins logs.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        always {
            cleanWs()
        }
    }
}
