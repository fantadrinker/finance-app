pipeline {
  agent any
  stages {
    stage('Build') {
      parallel {
        stage('Build Frontend') {
          steps {
            dir(path: 'frontend') {
              pwd
            }
          }
        }

        stage('Build Backend') {
          steps {
            dir(path: 'backend_lambdas_sam') {
              pwd
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