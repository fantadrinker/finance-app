pipeline {
  agent any
  stages {
    stage('Build') {
      parallel {
        stage('Build Frontend') {
          steps {
            dir(path: 'frontend') {
              sh 'pwd'
            }
          }
        }

        stage('Build Backend') {
          steps {
            dir(path: 'backend_lambdas_sam') {
              sh 'pwd'
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