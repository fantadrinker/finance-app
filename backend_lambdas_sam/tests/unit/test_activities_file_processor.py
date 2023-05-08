import pytest
import json
from lambdas.activitiesFilesProcessor import app
import boto3
from boto3.dynamodb.conditions import Key, Attr
from moto import mock_dynamodb, mock_s3


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
def s3(user_id):
    with mock_s3():
        s3 = boto3.resource('s3', region_name="us-east-1")
        s3.create_bucket(Bucket="test-bucket")
        s3.Object("test-bucket", f"{user_id}/cap1/2021-01-01.csv").put(Body=b'Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\n2023-02-25,2023-02-27,0733,RAMEN DANBO ROBSON,Dining,20.47,\n2023-02-24,2023-02-27,0733,SAFEWAY #4931,Merchandise,26.73,\n')
        yield s3

@pytest.fixture()
def event(user_id):
    return {
        "Records": [
            {
                "s3": {
                    "bucket": {
                        "name": "test-bucket"
                    },
                    "object": {
                        "key": f"{user_id}/cap1/2021-01-01.csv"
                    }
                }
            }
        ]
    }

def test_event_processing(activities_table, user_id, s3, event):
    # add some existing mappings
    activities_table.put_item(
        Item={
            "user": user_id,
            "sk": "mapping#SAFEWAY",
            "description": "SAFEWAY",
            "category": "Grocery",
        }
    )
    app.activities_table = activities_table
    app.s3 = s3
    app.lambda_handler(event, {})
    # connect to activities table to make sure the items were added
    activities_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key('sk').between("0000-00-00", "9999-99-99")
    )
    chksum_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("chksum#")
    )
    assert len(activities_response["Items"]) == 2
    assert activities_response["Items"][0]["description"] == "SAFEWAY #4931"
    assert activities_response["Items"][0]["category"] == "Grocery"
    assert activities_response["Items"][1]["description"] == "RAMEN DANBO ROBSON"
    assert activities_response["Items"][1]["category"] == "Dining"
    assert len(chksum_response["Items"]) == 1
    assert chksum_response["Items"][0]["file"] == f"{user_id}/cap1/2021-01-01.csv"