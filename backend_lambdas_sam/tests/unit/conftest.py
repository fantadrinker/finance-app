import os
import pytest
from moto import mock_dynamodb, mock_s3
import boto3

# All shared fixtures for unit tests

@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

@pytest.fixture(scope="function")
def activities_table(aws_credentials):
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
def s3(aws_credentials):
    with mock_s3():
        s3 = boto3.resource('s3', region_name="us-east-1")
        s3.create_bucket(Bucket="test-bucket")
        yield s3


def _query_string_to_dict(query_string):
    all_params = [paramStr for paramStr in query_string.split("&") if len(paramStr.split("=")) > 1]
    return dict(map(lambda x: x.split("="), all_params))


class TestHelpers:
    @staticmethod
    def get_base_event(user_id, method, path, queryString):
        return {
            "version": "2.0",
            "routeKey": f"{method} {path}",
            "rawPath": f"/Test{path}",
            "rawQueryString": queryString, # TODO: add query string
            "path": path,
            "queryStringParameters": _query_string_to_dict(queryString),
            "requestContext": {
                "accountId":"123197238901",
                "apiId":"1234567890",
                "domainName":"1234567890.execute-api.us-east-1.amazonaws.com",
                "domainPrefix":"1234567890",
                "http":{
                    "method": method,
                    "path": f"/Test{path}",
                    "protocol": "HTTP/1.1",
                    "sourceIp": "0.0.0.0",
                    "userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                "requestId":"pasoiufpoicjop",
                "routeKey": f"{method} {path}",
                "stage": "Test",
                "time": "4/Jan/2023:05:04:07 +0000",
                "timeEpoch": 1706331847257
            },
            "headers": {
                "authorization": user_id
            },
        }
    

@pytest.fixture()
def helpers():
    return TestHelpers