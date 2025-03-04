import boto3
import pytest
from boto3.dynamodb.conditions import Key
import requests
from dotenv import load_dotenv
import os
from auth0.authentication import GetToken


stack_name = "backendLambdasSamDev"

def get_stack_outputs(stack_name):
  if stack_name is None:
      raise ValueError(
          'Please set the AWS_SAM_STACK_NAME environment variable to the name of your stack')

  client = boto3.client("cloudformation")

  try:
      response = client.describe_stacks(StackName=stack_name)
  except Exception as e:
      raise Exception(
          f"Cannot find stack {stack_name} \n" f'Please make sure a stack with the name "{stack_name}" exists'
      ) from e

  stacks = response["Stacks"]
  return stacks[0]["Outputs"] 


def delete_all_activities(activities_table, user_id):
  all_activities = activities_table.query(KeyConditionExpression=Key('user').eq(user_id) & Key('sk').between("0000-00-00", "9999-99-99"))
  while True:
      with activities_table.batch_writer() as batch:
          for each in all_activities['Items']:
              batch.delete_item(
                  Key={
                      'user': user_id,
                      'sk': each['sk']
                  }
              )
      if 'LastEvaluatedKey' in all_activities:
          all_activities = activities_table.query(
              KeyConditionExpression=Key('user').eq(user_id) & Key(
                  'sk').between("0000-00-00", "9999-99-99"),
              ExclusiveStartKey=all_activities['LastEvaluatedKey']
          )
      else:
          break

class BaseTestCase:
  # base test case that sets up some shared code such as table name, clean up and set up code
  
  @pytest.fixture(scope="class")
  def api_gateway_url(self):
    """ Get the API Gateway URL from Cloudformation Stack outputs """
    stack_outputs = get_stack_outputs(stack_name)
    api_outputs = [
        output for output in stack_outputs if output["OutputKey"] == "ApiUrl"]

    if not api_outputs:
        raise KeyError(f"Api not found in stack {stack_name}")

    return api_outputs[0]["OutputValue"]  # Extract url from stack outputs
      
  
  @pytest.fixture(scope="class")
  def api_auth_token(self):
    # unique token for each test
    load_dotenv()
    test_token_response = requests.post(
        'https://dev-55m1hzkqt35ta6tx.us.auth0.com/oauth/token',
        json={
            "client_id": os.getenv('ENV_AUTH0_TEST_CLIENT_ID'),
            "client_secret": os.getenv('ENV_AUTH0_TEST_CLIENT_SECRET'),
            "audience": os.getenv('ENV_AUTH0_TEST_CLIENT_AUD'),
            "grant_type": "client_credentials"
        },
        headers={
           'content-type': 'application/json'
        }
    )
    assert test_token_response.status_code == 200
    test_token = test_token_response.json()["access_token"]

    yield test_token
    # todo: think about how to destroy all the test data with this token
