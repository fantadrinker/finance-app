import pytest
import json
from lambdas.fileCheck import app
from datetime import datetime
from tests.helpers import TestHelpers


@pytest.fixture()
def user_id():
    return "test-user-id"


@pytest.fixture()
def apigw_event_get(user_id):
    return TestHelpers.get_base_event(
        user_id,
        "GET",
        "/chksum",
        ""
    )


@pytest.fixture()
def apigw_event_get_max_2(user_id):
    return TestHelpers.get_base_event(
        user_id,
        "GET",
        "/chksum",
        "size=2"
    )


@pytest.fixture()
def mock_chksums(user_id):
    return [
        {
            "user": user_id,
            "sk": "chksum#test123",
            "date": datetime(2020, 1, 4).strftime("%Y-%m-%d"),
            "checksum": "test123"
        },
        {
            "user": user_id,
            "sk": "chksum#test234",
            "date": datetime(2020, 1, 3).strftime("%Y-%m-%d"),
            "checksum": "test234"
        },
        {
            "user": user_id,
            "sk": "chksum#test345",
            "date": datetime(2020, 1, 2).strftime("%Y-%m-%d"),
            "checksum": "test345"
        }
    ]


def test_get_chksums(activities_table, apigw_event_get, mock_chksums):
    for chksum in mock_chksums:
        activities_table.put_item(Item=chksum)

    response = app.lambda_handler(apigw_event_get, "")
    print(response["body"])
    assert response["statusCode"] == 200
    assert len(json.loads(response["body"])["data"]) == 3
    assert json.loads(response["body"])["data"][0] == {"checksum": "test123"}


def test_get_chksums_max_2(activities_table, apigw_event_get_max_2, mock_chksums):
    for chksum in mock_chksums:
        activities_table.put_item(Item=chksum)

    response = app.lambda_handler(apigw_event_get_max_2, "")
    print(response["body"])
    assert response["statusCode"] == 200
    assert len(json.loads(response["body"])["data"]) == 2
    assert json.loads(response["body"])["data"][0] == {"checksum": "test123"}
