import boto3
import pytest
import requests
from base_test_case import BaseTestCase

"""
Make sure env variable AWS_SAM_STACK_NAME exists with the name of the stack we are going to test.
"""


class TestPostGetActivities(BaseTestCase):
    @pytest.fixture(scope="module")
    def activities_body_json(self):
      return {
            "data": [
                {
                    'date': '2023-01-01',
                    'account': '0123',
                    'description': 'Ramen Danbo',
                    'category': 'Dining',
                    'amount': "54.03"
                },
                {
                    'date': '2023-01-31',
                    'account': '0123',
                    'description': 'SAFEWAY',
                    'category': 'Grocery',
                    'amount': '33.9'
                },
                {
                    'date': '2023-02-01',
                    'account': '0123',
                    'description': 'ADV PARKING',
                    'category': 'Transportation',
                    'amount': '1.10'
                },
                ]
            }

    def test_get_activities(self, api_gateway_url, api_auth_token, activities_body_json):
        """ Check if basic post and get activities are working """
        # when initial set up, should return 0 activities
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

        # now insert 2 activities

        response = requests.post(
            api_gateway_url + "/activities",
            json=activities_body_json,
            headers={
                'Authorization': api_auth_token
            }
        )

        assert response.status_code == 200

        # get activities again, verify it's with 3 items
        response = requests.get(
            api_gateway_url + "/activities?size=20",
            headers={
                'Authorization': api_auth_token
            }
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["count"] == 3

        