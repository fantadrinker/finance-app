import boto3
import json
import re

stack_name = "backendLambdasSamTest"

def isResourcePartOfTestStack(acct_number: str, resource: str):
  return re.match(f"arn:aws:logs:us-east-1:{acct_number}:log-group:{stack_name}", resource)

def processStatement(acct_number: str, statement: dict):
  statement["Resource"] = [resource for resource in statement["Resource"] if not isResourcePartOfTestStack(acct_number, resource)]
  return statement

def __main__():
  try:
    sts_client = boto3.client("sts")
    acct_identity = sts_client.get_caller_identity()
    acct_number = acct_identity["Account"]
    # first get resource policies
    logs_client = boto3.client("logs")
    response = logs_client.describe_resource_policies()
    policyDocs = [policy["policyDocument"] for policy in response["resourcePolicies"]]
    for policy in response["resourcePolicies"]:
      policyName = policy["policyName"]
      oldPolicyDoc = policy["policyDocument"]
      # do something
      docJson = json.loads(oldPolicyDoc)

      docJson["Statement"] = [processStatement(acct_number, statement) for statement in docJson["Statement"]]

      response = logs_client.put_resource_policy(
        policyName=policyName,
        policyDocument=json.dumps(docJson)
      )

      print(response)
  except:
    print("something went wrong when deleting the s3 objects")


if __name__ == "__main__":
  __main__()