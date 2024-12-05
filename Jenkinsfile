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
              sh 'npm ci'
              sh 'npx jest'
              sh 'PUBLIC_URL=https://fantadrinker.github.io/finance-app/ node scripts/build.js'
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
              sh 'pip install ruff pytest'
              sh 'if [ -f tests/requirements.txt ]; then pip install -r tests/requirements.txt; fi'
              sh 'pytest tests/unit -v -rP'
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
