import pytest
import json
from lambdas.activities import app
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
def apigw_event_post(user_id):
    """ Generates API GW Event"""

    return {
        "body": "Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\n2023-02-25,2023-02-27,0733,RAMEN DANBO ROBSON,Dining,20.47,\n2023-02-24,2023-02-27,0733,SAFEWAY #4931,Merchandise,26.73,\n",
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
        "routeKey": "POST /activity",
        "queryStringParameters": {"format": "cap1"},
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
def apigw_event_get_max_5(user_id):
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
        "routeKey": "GET /activity",
        "queryStringParameters": {"size": "5"},
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
def apigw_event_delete(user_id):
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
        "routeKey": "DELETE /activity",
        "queryStringParameters": {"sk": "2019-12-266"},
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
    base_date = datetime(2020, 1, 1)
    return [
        {
            "user": user_id,
            "sk": (base_date - timedelta(days=i)).strftime("%Y-%m-%d") + str(i),
            "description": f"test activity {i}",
            "category": "test_odd" if i % 2 != 0 else "test_even",
            "amount": 10,
        }
        for i in range(10)
    ]

def test_post_activities(activities_table, user_id, apigw_event_post):
    # add some existing mappings
    activities_table.put_item(
        Item={
            "user": user_id,
            "sk": "mapping#SAFEWAY",
            "description": "SAFEWAY",
            "category": "Grocery",
        }
    )

    ret = app.lambda_handler(apigw_event_post, "")
    # data = json.loads(ret["body"])
    assert ret["statusCode"] == 200
    # first check if the correct # of activities data is inserted

    activities_results = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("20"),
    )
    assert activities_results["Count"] == 2
    grocery_result = [item for item in activities_results["Items"] if item["category"] == "Grocery"]
    assert len(grocery_result) == 1

    # then check if checksums is inserted

    chksums_results = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("chksum#"),
    )
    assert chksums_results["Count"] == 1
    assert chksums_results["Items"][0]["chksum"] == "6e2771e4bc4ec7dec643ebcf627419af"

def test_get_activities(activities_table, user_id, apigw_event_get_max_5, mock_activities):
    # setup table and insert some activities data in there
    # also test pagination
    for item in mock_activities:
        activities_table.put_item(Item=item)
    # also insert some insights and chksums data to make sure they are not returned
    activities_table.put_item(
        Item={
            "user": user_id,
            "sk": "chksum#2020-01-02",
            "chksum": "6e2771e4bc4ec7dec643ebcf627419af",
        }
    )
    activities_table.put_item(
        Item={
            "user": user_id,
            "sk": "insight#2020-01-02",
            "category": "test insight",
            "amount": 10,
            "date": "2020-01",
        }
    )
    ret = app.lambda_handler(apigw_event_get_max_5, "")
    data = json.loads(ret["body"])
    nextKey = data["LastEvaluatedKey"]
    assert ret["statusCode"] == 200
    assert data["count"] == 5
    assert data["data"][0]["sk"] == "2020-01-010"
    assert nextKey["sk"] == "2019-12-284"

    next_ret = app.lambda_handler({
        **apigw_event_get_max_5,
        "queryStringParameters": {"size": "10", "nextDate": nextKey["sk"]},
    }, "")

    data = json.loads(next_ret["body"])
    assert next_ret["statusCode"] == 200
    assert data["count"] == 5
    assert data["data"][0]["sk"] == "2019-12-275"
    assert data["LastEvaluatedKey"] == {}
    

def test_delete_activities(
        activities_table, 
        user_id,
        apigw_event_delete, 
        mock_activities):
    # setup table and insert some activities data in there
    for item in mock_activities:
        activities_table.put_item(Item=item)
    
    ret = app.lambda_handler(apigw_event_delete, "")
    assert ret["statusCode"] == 200
    
    remaining_items = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("20"),
    )
    assert remaining_items["Count"] == 9
    deleted = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").eq("2019-12-266"),
    )
    assert deleted["Count"] == 0