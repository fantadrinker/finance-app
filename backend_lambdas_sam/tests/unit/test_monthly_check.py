import pytest
import json
from lambdas.monthlyCheck import app
import boto3
from boto3.dynamodb.conditions import Key
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
def mock_activities_data(user_id):
    jan = [
        {
            "user": user_id,
            "sk": f"2022-01-01#{i}",
            "date": "2022-01-01",
            "category": f"category{1 if i % 2 == 0 else 2}",
            "description": f"description{i}",
            "amount": 10,
        }
        for i in range(10)
    ]
    feb = [
        {
            "user": user_id,
            "sk": "2022-02-01#1",
            "date": "2022-02-01",
            "category": "category1",
            "description": "description1",
            "amount": 1
        }
    ]
    return jan + feb

@pytest.fixture()
def mock_mappings_data(user_id):
    # forces description2 to be mapped to category2
    return [
        {
            "user": user_id,
            "sk": f"mapping#1",
            "description": "description2",
            "category": "category2",
        }
    ]

@pytest.fixture()
def mock_insights_data(user_id):
    return [
        {
            "user": user_id,
            "sk": f"insights#2022-01",
            "date": "2022-01-01",
            "categories": json.dumps({
                "category1": 49,
                "category2": 49,
            })
        },
        {
            "user": user_id,
            "sk": f"insights#2022-02",
            "date": "2022-02",
            "categories": json.dumps({
                "category1": 1,
            })
        },
    ]


def test_lambda_handler(activities_table, mock_insights_data, mock_activities_data, mock_mappings_data, user_id):
    for item in mock_activities_data:
        activities_table.put_item(Item=item)
    for item in mock_mappings_data:
        activities_table.put_item(Item=item)
    for item in mock_insights_data:
        activities_table.put_item(Item=item)
    
    app.table = activities_table
    response = app.lambda_handler({}, {})

    assert response["statusCode"] == 200
    mapped_activity = activities_table.get_item(
        Key={"user": user_id, "sk": "2022-01-01#2"}
    )["Item"]
    assert mapped_activity["category"] == "category2"

    insights = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("insights#")
    )["Items"]
    assert len(insights) == 2
    jan_categories = json.loads(insights[0]["categories"])
    assert jan_categories["category1"] == 50
    assert jan_categories["category2"] == 50