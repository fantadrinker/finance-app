import pytest
import json
from lambdas.mappings import app
from tests.helpers import TestHelpers
"""
    Tests mapping handler's get, post, and delete methods
"""


@pytest.fixture()
def user_id():
    return "test-user-id"


@pytest.fixture()
def apigw_event_post(user_id):
    """ Generates API GW Event"""

    return {
        "body": "{\"description\": \"testDescription\", \"category\": \"testCategory\", \"priority\": \"1\"}",
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
        "routeKey": "POST /mappings",
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
        "httpMethod": "POST",
        "stageVariables": {"baz": "qux"},
        "path": "/examplepath",
    }

@pytest.fixture()
def apigw_event_get(user_id):
    return TestHelpers.get_base_event(
        user_id,
        "GET",
        "/mappings",
        ""
    )


@pytest.fixture()
def apigw_event_delete(user_id):
    """ Generates API GW Event"""

    return {
        "body": "{\"description\": \"testDescription\", \"category\": \"testCategory\", \"priority\": \"1\"}",
        "resource": "/{proxy+}",
        "requestContext": {
            "resourceId": "123456",
            "apiId": "1234567890",
            "resourcePath": "/{proxy+}",
            "httpMethod": "DELETE",
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
        "routeKey": "DELETE /mappings",
        "queryStringParameters": {
            "id": "mapping#testDescription1"
        },
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
        "httpMethod": "DELETE",
        "stageVariables": {"baz": "qux"},
        "path": "/examplepath",
    }

@pytest.fixture()
def mock_mappings_items(user_id):
    return [
        {
            "user": user_id,
            "sk": f"mapping#testDescription{i}",
            "category": f"testCategory{i % 4}",
            "description": f"testDescription{i}",
        }
        for i in range(10)
    ]

def test_post_mapping(apigw_event_post, activities_table):
    """ Test post mapping """
    # Call our lambda function and compare the result
    response = app.lambda_handler(apigw_event_post, "")
    assert response["statusCode"] == 201

    mappings = activities_table.scan()["Items"]

    assert len(mappings) == 1
    assert mappings[0]["category"] == "testCategory"

def test_post_update_mapping(user_id, apigw_event_post, activities_table):
    activities_table.put_item(
        Item={
            "user": user_id,
            "sk": "mapping#testDescription",
            "category": "oldCategory",
            "description": "testDescription",
        }
    )
    response = app.lambda_handler(apigw_event_post, "")
    assert response["statusCode"] == 201

    mappings = activities_table.scan()["Items"]

    assert len(mappings) == 1
    assert mappings[0]["category"] == "testCategory"

def test_get_mapping(apigw_event_get, activities_table, mock_mappings_items):
    """ Test get mapping """

    # Add mock mappings to the table
    for item in mock_mappings_items:
        activities_table.put_item(Item=item)

    # Call our lambda function and compare the result
    response = app.lambda_handler(apigw_event_get, "")
    assert response["statusCode"] == 200

    body = json.loads(response["body"])

    assert len(body["data"]) == 4
    first_item = body["data"][0]
    assert first_item["category"]
    assert first_item["descriptions"]
    assert first_item["descriptions"][0]["description"]
    assert first_item["descriptions"][0]["priority"]
    assert first_item["descriptions"][0]["sk"]


def test_delete_mapping(apigw_event_delete, activities_table, mock_mappings_items):
    """ Test delete mapping """

    # Add mock mappings to the table
    for item in mock_mappings_items:
        activities_table.put_item(Item=item)

    # Call our lambda function and compare the result
    response = app.lambda_handler(apigw_event_delete, "")
    assert response["statusCode"] == 200

    mappings = activities_table.scan()["Items"]

    assert len(mappings) == 9