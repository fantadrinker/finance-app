import pytest
import json
from lambdas.mappings import app
from tests.helpers import TestHelpers
"""
    Tests mapping handler's get, post, and delete methods
"""


@pytest.fixture()
def user_id():
    return "test-user-id"


@pytest.fixture()
def apigw_event_post(user_id):
    """ Generates API GW Event"""
    return TestHelpers.get_base_event(
        user_id,
        "POST",
        "/mappings",
        "",
        "{\"description\": \"testDescription\", \"category\": \"testCategory\", \"priority\": \"1\"}"
    )


@pytest.fixture()
def apigw_event_get(user_id):
    return TestHelpers.get_base_event(
        user_id,
        "GET",
        "/mappings",
        ""
    )


@pytest.fixture()
def apigw_event_delete(user_id):
    """ Generates API GW Event"""

    return TestHelpers.get_base_event(
        user_id,
        "DELETE",
        "/mappings",
        "id=mapping#testDescription1"
    )

@pytest.fixture()
def mock_mappings_items(user_id):
    return [
        {
            "user": user_id,
            "sk": f"mapping#testDescription{i}",
            "category": f"testCategory{i % 4}",
            "description": f"testDescription{i}",
        }
        for i in range(10)
    ]

def test_post_mapping(apigw_event_post, activities_table):
    """ Test post mapping """
    # Call our lambda function and compare the result
    response = app.lambda_handler(apigw_event_post, "")
    assert response["statusCode"] == 201

    mappings = activities_table.scan()["Items"]

    assert len(mappings) == 1
    assert mappings[0]["category"] == "testCategory"

def test_post_update_mapping(user_id, apigw_event_post, activities_table):
    activities_table.put_item(
        Item={
            "user": user_id,
            "sk": "mapping#testDescription",
            "category": "oldCategory",
            "description": "testDescription",
        }
    )
    response = app.lambda_handler(apigw_event_post, "")
    assert response["statusCode"] == 201

    mappings = activities_table.scan()["Items"]

    assert len(mappings) == 1
    assert mappings[0]["category"] == "testCategory"

def test_get_mapping(apigw_event_get, activities_table, mock_mappings_items):
    """ Test get mapping """

    # Add mock mappings to the table
    for item in mock_mappings_items:
        activities_table.put_item(Item=item)

    # Call our lambda function and compare the result
    response = app.lambda_handler(apigw_event_get, "")
    assert response["statusCode"] == 200

    body = json.loads(response["body"])

    assert len(body["data"]) == 4
    first_item = body["data"][0]
    assert first_item["category"]
    assert first_item["descriptions"]
    assert first_item["descriptions"][0]["description"]
    assert first_item["descriptions"][0]["priority"]
    assert first_item["descriptions"][0]["sk"]


def test_delete_mapping(apigw_event_delete, activities_table, mock_mappings_items):
    """ Test delete mapping """

    # Add mock mappings to the table
    for item in mock_mappings_items:
        activities_table.put_item(Item=item)

    # Call our lambda function and compare the result
    response = app.lambda_handler(apigw_event_delete, "")
    assert response["statusCode"] == 200

    mappings = activities_table.scan()["Items"]

    assert len(mappings) == 9