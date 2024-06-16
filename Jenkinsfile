pipeline {
  agent {
    docker { image 'node:20.11.1-alpine3.19' }
  }
  stages {
    stage('Build') {
      parallel {
        stage('Build Frontend') {
          steps {
            dir(path: 'frontend') {
              sh 'pwd'
              sh 'node --version'
              sh 'npm --version'
            }
          }
        }

        stage('Build Backend') {
          steps {
            dir(path: 'backend_lambdas_sam') {
              sh 'pwd'
              sh 'python --version'
              sh 'python3 --version'
            }
          }
        }
      }
    }
    stage('Test') {
      steps {
        echo 'testing'
      }
    }
  }
}