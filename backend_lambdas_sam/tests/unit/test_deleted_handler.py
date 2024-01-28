import pytest
import json
from lambdas.deleted import app
from tests.helpers import TestHelpers

@pytest.fixture()
def user_id():
    return "test-user-id"

@pytest.fixture()
def apigw_event_get(user_id):
    return TestHelpers.get_base_event(
        user_id,
        "GET",
        "/deleted",
        ""
    )


@pytest.fixture()
def mock_data(user_id):
    return [{
        "user": user_id,
        "sk": "deleted#2020-01-01#test1233",
        "date": "2020-01-01",
        "checksum": "test123"
    }, {
        "user": user_id,
        "sk": "2020-01-01#test123",
        "date": "2020-01-01",
        "checksum": "test123",
    }]
    

def test_get_deleted(activities_table, apigw_event_get, mock_data):
    
    for item in mock_data:
        activities_table.put_item(Item=item)

    ret = app.lambda_handler(apigw_event_get, "")
    data = json.loads(ret["body"])
    assert ret["statusCode"] == 200
    assert len(data["data"]) == 1
    assert data["data"][0]["checksum"] == "test123"
    assert data["data"][0]["date"] == "2020-01-01"
    assert data["data"][0]["sk"] == "deleted#2020-01-01#test1233"
    assert data["data"][0]["user"] == "test-user-id"
    assert data["count"] == 1
    assert data["LastEvaluatedKey"] == {}
    