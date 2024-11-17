import requests
from base_test_case import BaseTestCase

class TestApiGateway(BaseTestCase):

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
