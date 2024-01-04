import pytest
import simplejson as json
from lambdas.activityInsights import app
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key
import boto3
from moto import mock_dynamodb

@pytest.fixture()
def activities_table():
    """ Creates a dynamodb table for testing purposes"""
    with mock_dynamodb():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        table = dynamodb.create_table(
            TableName="activities",
            KeySchema=[
                {"AttributeName": "user", "KeyType": "HASH"},
                {"AttributeName": "sk", "KeyType": "RANGE"}
            ],
            AttributeDefinitions=[
                {"AttributeName": "user", "AttributeType": "S"},
                {"AttributeName": "sk", "AttributeType": "S"},
            ],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
        table.meta.client.get_waiter("table_exists").wait(TableName="activities")
        yield table

@pytest.fixture()
def user_id():
    return "test-user-id"


@pytest.fixture()
def apigw_event_get_2022_01(user_id):
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
        "routeKey": "GET /activityInsights",
        "queryStringParameters": {"starting_date": "2022-01-01", "ending_date": "2022-02-01"},
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
def mock_activities(user_id):
    """ Generates mock insights data"""
    return [{
        "user": user_id,
        "sk": f"2021-01-10#12344",
        "description": "SAFEWAY #2345",
        "category": "Groceries",
        "amount": "98.4",
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2022-01-10#12344",
        "description": "PAY PARKING #2345",
        "category": "Transit",
        "amount": "3.5",
        "account": "MASTERCARD4"
    }, {
        "user": user_id,
        "sk": f"2022-01-31#12344",
        "description": "MCDONALDS #4342",
        "category": "Dining",
        "amount": "32.4",
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2022-02-02#12344",
        "description": "RAMEN DANBO",
        "category": "Dining",
        "amount": "13",
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2023-01-01#12344",
        "description": "PAYROLL MSFT",
        "category": "Income",
        "amount": "-4000",
        "account": "SAVINGS123"
    }]

def test_get_activities_insights(activities_table, apigw_event_get_2022_01, mock_activities):
    # setup table and insert some activities data in there
    # also test pagination
    for item in mock_activities:
        activities_table.put_item(Item=item)
    ret = app.lambda_handler(apigw_event_get_2022_01, "")
    data = json.loads(ret["body"])
    print(data)
    assert ret["statusCode"] == 200
    assert data["totalAmount"] == "35.9"
    assert data["activitiesCount"] == 2

    
