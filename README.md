# finance-app

This is a webapp to handle tracking my finance, categorizing spending and keep track of how much I spend on what kinds of stuff each month.

# Frontend - How to build

first cd to frontend

    cd frontend

run this command to build

    npm install

run this command to run test server on local

    npm run start

# Backend - How to build

requirements:

- sam cli [installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

first cd to backend

    cd backend_lambdas_sam

then validate template.yaml

    sam validate

then build local python code

    sam build --use-container

then deploy to cloud

    sam deploy --guided



# Dev Plans

today added auth0 integration, next steps:
1. Set up auto deployment to github pages (done 03/08/2023)
2. Rewrite django backend with lambda and dynamoDB
3. Prettify UI


### API draft

    POST /activities?format=<format>
    param:
      - format: cap1 or rbc
    body: csv file exported from either cap1 or RBC
    response: body: formatted data with following columns 
    date, account, description, category, amount


Processes and stores user data in activities database table. Returns formatted data.

    GET /activities
    returns all user activities in standard format

no side effects

    POST /category?desc={key}&newcat={value}
    updates category mapping from key to value

store in database



