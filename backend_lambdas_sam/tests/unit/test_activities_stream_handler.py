import pytest
from lambdas.activitiesStreams import app
from datetime import datetime, timedelta
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
def apigw_event_new_mapping(user_id):
    return {
        "Records":[{
            "eventID":"f8a4fc12b206d371ee7a6491b27e4af4",
            "eventName":"INSERT",
            "eventVersion":"1.1",
            "eventSource":"aws:dynamodb",
            "awsRegion":"us-east-1",
            "dynamodb":{
                "ApproximateCreationDateTime":1680927252.0,
                "Keys":{
                    "sk":{
                        "S":f"mapping#1111111"
                    },
                    "user":{
                        "S": user_id
                    }
                },
                "NewImage":{
                    "sk":{
                        "S":f"mapping#"
                    },
                    "description":{
                        "S": f"test activity 1"
                    },
                    "category":{
                        "S": f"testCategory"
                    },
                    "priority":{
                        "N":"0"
                    },
                    "user":{
                        "S": user_id
                    }
                },
                "StreamViewType":"NEW_IMAGE"
            },
            "eventSourceARN":"arn:aws:dynamodb:us-east-1:962861289619:table/backendLambdasSam-ActivitiesTable-37ZDBRHT7AY3/stream/2023-04-05T20:16:32.035"
        }]
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

def test_new_mapping(activities_table, apigw_event_new_mapping, user_id, mock_activities):
    # insert some activities with description names
    # pass in new event
    # check that the new mapping is in the table
    for item in mock_activities:
        activities_table.put_item(Item=item)

    app.table = activities_table
    ret = app.lambda_handler(apigw_event_new_mapping, "")
    print(ret)
    assert ret["statusCode"] == 200
    # check that the activities category is updated
    item = activities_table.get_item(Key={"user": user_id, "sk": "2019-12-311"})
    assert item["Item"]["category"] == "testCategory"
