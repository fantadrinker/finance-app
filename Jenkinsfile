pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps {
        sh 'git checkout https://github.com/fantadrinker/myBlogApp.git'
      }
    }

    stage('Build Frontend') {
      parallel {
        stage('Build Frontend') {
          steps {
            dir(path: 'frontend')
          }
        }

        stage('Build Backend') {
          steps {
            dir(path: 'backend_lambdas_sam')
          }
        }

      }
    }

  }
}