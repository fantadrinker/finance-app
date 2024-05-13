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
        stack_outputs = stacks[0]["Outputs"]
        api_outputs = [
            output for output in stack_outputs if output["OutputKey"] == "ApiUrl"]

        if not api_outputs:
            raise KeyError(f"Api not found in stack {stack_name}")

        return api_outputs[0]["OutputValue"]  # Extract url from stack outputs

    @pytest.fixture(scope='module')
    def api_auth_token(self):
        # we will be running the api in skip auth mode so this is not needed
        return "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ind2ZTllRXgwaXdlV3RHQnY3UlBoOCJ9.eyJpc3MiOiJodHRwczovL2Rldi01NW0xaHprcXQzNXRhNnR4LnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJ3TktTVWRyY2JHNFFGdHR0MWVUdUZqNThHazJBakpwakBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9qMnF0ajhibnM5LmV4ZWN1dGUtYXBpLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL1Rlc3QvIiwiaWF0IjoxNzE0OTI2OTAyLCJleHAiOjE3MTUwMTMzMDIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyIsImF6cCI6IndOS1NVZHJjYkc0UUZ0dHQxZVR1Rmo1OEdrMkFqSnBqIn0.Sw3_PO7lNQuoG7ld-3dbSJxYIghKddO0pq_H5Gu2g_J9XtfajMVhl2V1MKNOgkQGelrw58fV2RO6X2bM2KKeCDXZ-rD7q6M_Z5Hm6xonl_DK8_Yhm4pUoc26i2oBwaDwCNq9biHPXirAlsTSqqG2xhfseU1XKx9jIBVzE40i4XT_IWp9BOib2qx8iIlth33-Tr5giiiZ5Gzx6hnaPhGR-OoVt7n4gNsg1aXxkS55Jy_FIxBN1TTNJh-1AaJPHY5u97Bqr5CMUF_ZBZyfCHZW6_4NuwdbV9omMBazsnxoJbT0IGVGON-NKCw6AVHA884SDrgEcQeSQetr_FpHbnYVqA"

    def test_api_gateway_get_activities(self, api_gateway_url, api_auth_token):
        """ Call the API Gateway endpoint and check the response """
        response = requests.get(
            api_gateway_url + "/activities?size=20",
            headers={
                'Authorization': api_auth_token
            }
        )

        print(api_auth_token)
        print(response.text)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["count"] == 0
        assert response_data["data"] == []
