import pytest
import json
from lambdas.activities import app
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key

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
def apigw_get_activities_base(user_id, helpers):
    return helpers.get_base_event(user_id, "GET", "/activity", "")


@pytest.fixture()
def apigw_event_get_max_5(user_id, helpers):
    return helpers.get_base_event(user_id, "GET", "/activity", "size=5")


@pytest.fixture()
def apigw_event_get_by_category(user_id, helpers):
    return helpers.get_base_event(user_id, "GET", "/activity", "category=test_odd&orderByAmount=true")

@pytest.fixture()
def apigw_event_get_by_account(user_id, helpers):
    return helpers.get_base_event(user_id, "GET", "/activity", "account=acct_1_visa")


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
            "account": "acct_1_visa" if i % 2 != 0 else "acct_2_visa",
        }
        for i in range(10)
    ]

@pytest.fixture()
def mock_activities_with_different_amount(user_id):
    amounts = [10, 20, 30, 40, 50]
    return [{
        "user": user_id,
        "sk": f"2020-01-01#{value}",
        "description": "test activity",
        "category": "test_cat",
        "amount": value,
    } for value in amounts]

@pytest.fixture()
def mock_activities_with_descriptions(user_id):
    return [{
        "user": user_id,
        "sk": f"2020-01-01#1",
        "description": "SAFEWAY #2345",
        "category": "SAFEWAY",
        "amount": 10,
    }, {
        "user": user_id,
        "sk": f"2020-01-01#2",
        "description": "SAFEWAY #3456",
        "category": "SAFEWAY1",
        "amount": 20,
    }, {
        "user": user_id,
        "sk": f"2020-01-01#4",
        "description": "safeway #3456",
        "category": "SAFEWAY",
        "amount": 20,
    },{
        "user": user_id,
        "sk": f"2020-01-01#3",
        "description": "LONDON DRUGS #2345",
        "category": "Groceries",
        "amount": 30,
    }]

def test_post_activities(s3, user_id, apigw_event_post):
    
    app.s3 = s3
    ret = app.lambda_handler(apigw_event_post, "")
    assert ret["statusCode"] == 200

    bucket = s3.Bucket('test-bucket')
    all_objs = list(bucket.objects.filter(
        Prefix=f"{user_id}/cap1/"
    ))
    assert len(all_objs) == 1
    

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
            "sk": "insights#2020-01-02",
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
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("deleted"),
    )
    assert deleted["Count"] == 1
    assert deleted["Items"][0]["sk"] == "deleted#2019-12-266"

def test_get_activities_by_category(
        activities_table,
        apigw_event_get_by_category,
        mock_activities):
    # setup table and insert some activities data in there
    for item in mock_activities:
        activities_table.put_item(Item=item)
    
    ret = app.lambda_handler(apigw_event_get_by_category, "")
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 5
    assert data["data"][0]["category"] == "test_odd"
    assert data["data"][1]["category"] == "test_odd"
    assert data["data"][2]["category"] == "test_odd"
    assert data["data"][3]["category"] == "test_odd"
    assert data["data"][4]["category"] == "test_odd"
    # TODO: assert ordering by amount
    

def test_get_activities_by_account(activities_table, apigw_event_get_by_account, mock_activities):

    for items in mock_activities:
        activities_table.put_item(Item=items)
    
    ret = app.lambda_handler(apigw_event_get_by_account, "")
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 5
    assert all([item["account"] == "acct_1_visa" for item in data["data"]])


def test_get_activities_by_amount_upper_lower(activities_table, apigw_get_activities_base, mock_activities_with_different_amount):

    for items in mock_activities_with_different_amount:
        activities_table.put_item(Item=items)
    
    # max 30
    ret = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"amountMax": "30"},
    }, "")
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 3
    assert all([int(item["amount"]) <= 30 for item in data["data"]])

    # min 20
    ret = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"amountMin": "20"},
    }, "")
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 4
    assert all([int(item["amount"]) >= 20 for item in data["data"]])

    # min 20 max 40
    ret = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"amountMin": "20", "amountMax": "40"},
    }, "")
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 3
    assert all([int(item["amount"]) >= 20 and int(item["amount"]) <= 40 for item in data["data"]])


def test_get_activities_by_description(activities_table, apigw_get_activities_base, mock_activities_with_descriptions):
    for items in mock_activities_with_descriptions:
        activities_table.put_item(Item=items)

    # first should match everything that starts with key
    resposne_match_start = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"description": "SAFEWAY"},
    }, "")
    assert resposne_match_start["statusCode"] == 200
    data = json.loads(resposne_match_start["body"])
    assert data["count"] == 2
    keys = [item["sk"] for item in data["data"]]
    assert "2020-01-01#1" in keys
    assert "2020-01-01#2" in keys
    # below line fails b/c of case sensitivity
    assert "2020-01-01#4" not in keys

    # second should match everything that ends with key
    resposne_match_end = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"description": "2345"},
    }, "")
    assert resposne_match_end["statusCode"] == 200
    data = json.loads(resposne_match_end["body"])
    assert data["count"] == 2
    keys = [item["sk"] for item in data["data"]]
    assert "2020-01-01#1" in keys
    assert "2020-01-01#3" in keys

    # third should match everything that exactly matches the key
    resposne_match_exact = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"description": "SAFEWAY #2345"},
    }, "")
    assert resposne_match_exact["statusCode"] == 200
    data = json.loads(resposne_match_exact["body"])
    assert data["count"] == 1
    assert data["data"][0]["sk"] == "2020-01-01#1"

def test_get_activities_with_mappings(activities_table, apigw_get_activities_base, mock_activities_with_descriptions):
    for items in mock_activities_with_descriptions:
        activities_table.put_item(Item=items)
    
    # add mappings
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#SAFEWAY",
        "description": "SAFEWAY",
        "category": "Grocery Safeway", # override the category
    })
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#LONDON DRUGS #2345",
        "description": "LONDON DRUGS #2345",
        "category": "Groceries",
    })

    # first should match everything that starts with key
    resposne_match_start = app.lambda_handler(apigw_get_activities_base, "")
    assert resposne_match_start["statusCode"] == 200
    data = json.loads(resposne_match_start["body"])
    assert data["count"] == 4

    first_item_category = next((x["category"] for x in data["data"] if x["sk"] == "2020-01-01#1"), None)
    assert first_item_category == "Grocery Safeway" # mapped

    second_item_category = next((x["category"] for x in data["data"] if x["sk"] == "2020-01-01#2" ), None)
    assert second_item_category == "Grocery Safeway" # mapped

    third_item_category = next((x["category"] for x in data["data"] if x["sk"] == "2020-01-01#3"), None)
    assert third_item_category == "Groceries" # not mapped

    fourth_item_category = next((x["category"] for x in data["data"] if x["sk"] == "2020-01-01#4"), None)
    assert fourth_item_category == "SAFEWAY" # not mapped 
