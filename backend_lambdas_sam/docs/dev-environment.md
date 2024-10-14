

Documents steps to try and set up dev environments.


### Goals:
- [done] dedicated environment for main branch and application
- [todo] when a dev branch is created, I can run a script/command to set up a blank dev environment
  - [todo] when the environment is created, the output of api gateway urls are stored in a config file
  - [optional] local frontend can then use the output dev api gateway url to fetch data.
  - [optional] another script to pre-populate database with dummy data
- [todo] when I am done with the branch, I can run a script/command to delete the dev environment I created
- [todo] when everything above works as expected, consider moving it to the ci/cd chain

### Creating new dev environment for branch
- use `sam build --use-container` and `sam deploy --stack-name={branch_name}-backendLambdasSam --parameter-overrides='BranchPrefix={branch_name}' --s3-prefix=backendLambdasSam/{branch_name}` to create a custom stack with the branch name stamped on it.

- when deploying to dev (same as prod for now) use `sam deploy --stack-name=main-backendLambdasSam --parameter-overrides='BranchPrefix=main' --s3-prefix=backendLambdasSam/main`

- when done with the branch (merged, closed) run `sam delete --stack-name={branch_name}-backendLambdasSam`


### Update

This is all just a dream, I moved the default config in `samconfig.toml` to prod, and renamed everything in default config to add `Dev` suffix so I can create a dev stack that I can just keep using.
