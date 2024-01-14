import os

import boto3
import pytest
import requests

"""
Make sure env variable AWS_SAM_STACK_NAME exists with the name of the stack we are going to test. 
"""


class TestApiGateway:

    @pytest.fixture()
    def api_gateway_url(self):
        """ Get the API Gateway URL from Cloudformation Stack outputs """
        stack_name = os.environ.get("AWS_SAM_STACK_NAME")

        if stack_name is None:
            raise ValueError('Please set the AWS_SAM_STACK_NAME environment variable to the name of your stack')

        client = boto3.client("cloudformation")

        try:
            response = client.describe_stacks(StackName=stack_name)
        except Exception as e:
            raise Exception(
                f"Cannot find stack {stack_name} \n" f'Please make sure a stack with the name "{stack_name}" exists'
            ) from e

        stacks = response["Stacks"]
        stack_outputs = stacks[0]["Outputs"]
        api_outputs = [output for output in stack_outputs if output["OutputKey"] == "ApiUrl"]

        if not api_outputs:
            raise KeyError(f"Api not found in stack {stack_name}")

        return api_outputs[0]["OutputValue"]  # Extract url from stack outputs

    @pytest.fixture(scope='module')
    def api_auth_token(self):
        # we will be running the api in skip auth mode so this is not needed
        return "testtoken"


    def test_api_gateway_multiply(self, api_gateway_url):
        """ Call the API Gateway endpoint and check the response """
        response = requests.get(f"{api_gateway_url}/multiply?a=2&b=3")

        assert response.status_code == 200
        assert response.json() == { "product": 6 }
    
    def test_api_gateway_get_activities(self, api_gateway_url, api_auth_token):
        """ Call the API Gateway endpoint and check the response """
        response = requests.get(
            api_gateway_url + "/activities?size=20",
            headers={
                'Authorization': api_auth_token
            }
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["count"] == 0
        assert response_data["data"] == []