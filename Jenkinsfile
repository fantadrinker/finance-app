pipeline {
  agent any
  stages {
    stage('Build') {
      parallel {
        stage('Build Frontend') {
          agent {
            docker { image 'node:20.11.1-alpine3.19' }
          }
          steps {
            dir(path: 'frontend') {
              sh 'pwd'
              sh 'node --version'
              sh 'npm --version'
            }
          }
        }

        stage('Build Backend') {
          agent {
            docker { image 'python:3.9' }
          }
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
