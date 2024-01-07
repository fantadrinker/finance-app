# All shared fixtures for unit tests

import pytest
from moto import mock_dynamodb, mock_s3
import boto3

@pytest.fixture(scope="function")
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


@pytest.fixture(scope="function")
def s3():
    with mock_s3():
        s3 = boto3.resource('s3', region_name="us-east-1")
        s3.create_bucket(Bucket="test-bucket")
        yield s3