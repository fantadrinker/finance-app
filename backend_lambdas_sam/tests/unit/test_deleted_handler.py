import pytest
import json
from lambdas.deleted import app
from datetime import datetime

@pytest.fixture()
def user_id():
    return "test-user-id"

@pytest.fixture()
def apigw_event_get(user_id):
    """ Generates API GW Event"""

    return {
        "body": "",
        "resource": "/{proxy+}",
        "requestContext": {
            "resourceId": "123456",
            "apiId": "1234567890",
            "resourcePath": "/{proxy+}",
            "httpMethod": "POST",
            "requestId": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
            "accountId": "123456789012",
            "identity": {
                "apiKey": "",
                "userArn": "",
                "cognitoAuthenticationType": "",
                "caller": "",
                "userAgent": "Custom User Agent String",
                "user": "",
                "cognitoIdentityPoolId": "",
                "cognitoIdentityId": "",
                "cognitoAuthenticationProvider": "",
                "sourceIp": "127.0.0.1",
                "accountId": "",
            },
            "stage": "prod",
        },
        "routeKey": "GET /deleted",
        "queryStringParameters": {},
        "headers": {
            "Via": "1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)",
            "Accept-Language": "en-US,en;q=0.8",
            "CloudFront-Is-Desktop-Viewer": "true",
            "CloudFront-Is-SmartTV-Viewer": "false",
            "CloudFront-Is-Mobile-Viewer": "false",
            "X-Forwarded-For": "127.0.0.1, 127.0.0.2",
            "CloudFront-Viewer-Country": "US",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Upgrade-Insecure-Requests": "1",
            "X-Forwarded-Port": "443",
            "Host": "1234567890.execute-api.us-east-1.amazonaws.com",
            "X-Forwarded-Proto": "https",
            "X-Amz-Cf-Id": "aaaaaaaaaae3VYQb9jd-nvCd-de396Uhbp027Y2JvkCPNLmGJHqlaA==",
            "CloudFront-Is-Tablet-Viewer": "false",
            "Cache-Control": "max-age=0",
            "User-Agent": "Custom User Agent String",
            "CloudFront-Forwarded-Proto": "https",
            "Accept-Encoding": "gzip, deflate, sdch",
            "authorization": user_id
        },
        "pathParameters": {"proxy": "/examplepath"},
        "httpMethod": "GET",
        "stageVariables": {"baz": "qux"},
        "path": "/examplepath",
    }

@pytest.fixture()
def mock_data(user_id):
    return [{
        "user": user_id,
        "sk": "deleted#2020-01-01#test1233",
        "date": "2020-01-01",
        "checksum": "test123"
    }, {
        "user": user_id,
        "sk": "2020-01-01#test123",
        "date": "2020-01-01",
        "checksum": "test123",
    }]
    

def test_get_deleted(activities_table, apigw_event_get, mock_data):
    
    for item in mock_data:
        activities_table.put_item(Item=item)

    ret = app.lambda_handler(apigw_event_get, "")
    data = json.loads(ret["body"])
    assert ret["statusCode"] == 200
    assert len(data["data"]) == 1
    assert data["data"][0]["checksum"] == "test123"
    assert data["data"][0]["date"] == "2020-01-01"
    assert data["data"][0]["sk"] == "deleted#2020-01-01#test1233"
    assert data["data"][0]["user"] == "test-user-id"
    assert data["count"] == 1
    assert data["LastEvaluatedKey"] == {}
    