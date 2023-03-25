# finance-app

This is a webapp to handle tracking my finance, categorizing spending and keep track of how much I spend on what kinds of stuff each month.

# How to build

run this command to build

    npm install

run this command to run test server on local

    npm run start

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



