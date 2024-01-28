import pytest
import json
from lambdas.fileCheck import app
from datetime import datetime

@pytest.fixture()
def user_id():
    return "test-user-id"

@pytest.fixture()
def apigw_event_get(user_id, helpers):
    return helpers.get_base_event(
        user_id,
        "GET",
        "/chksum",
        ""
    )


@pytest.fixture()
def mock_chksums(user_id):
    base_date = datetime(2020, 1, 1)
    return [
        {
            "user": user_id,
            "sk": "chksum#test123",
            "date": base_date.strftime("%Y-%m-%d"),
            "checksum": "test123"
        }
    ]

def test_get_chksums(activities_table, apigw_event_get, mock_chksums):
    for chksum in mock_chksums:
        activities_table.put_item(Item=chksum)

    response = app.lambda_handler(apigw_event_get, "")
    print(response["body"])
    assert response["statusCode"] == 200
    assert json.loads(response["body"])["data"][0] == {"checksum": "test123"}