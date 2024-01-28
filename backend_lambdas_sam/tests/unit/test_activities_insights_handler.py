import pytest
import simplejson as json
from lambdas.activityInsights import app
from tests.helpers import TestHelpers

@pytest.fixture()
def user_id():
    return "test-user-id"


@pytest.fixture()
def apigw_event_get_2022_01(user_id):
    return TestHelpers.get_base_event(
        user_id,
        "GET",
        "/activityInsights",
        "starting_date=2022-01-01&ending_date=2022-02-01&all_categories=false"
    )


@pytest.fixture()
def apigw_event_get_by_category(user_id):
    return TestHelpers.get_base_event(
        user_id,
        "GET",
        "/activityInsights",
        "starting_date=2022-01-01&ending_date=2022-02-01&all_categories=true"
    )

@pytest.fixture()
def mock_activities(user_id):
    """ Generates mock insights data"""
    return [{
        "user": user_id,
        "sk": f"2021-01-10#12344",
        "description": "SAFEWAY #2345",
        "category": "Groceries",
        "amount": "98.4",
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2022-01-10#12344",
        "description": "PAY PARKING #2345",
        "category": "Transit",
        "amount": "3.5",
        "account": "MASTERCARD4"
    }, {
        "user": user_id,
        "sk": f"2022-01-31#12344",
        "description": "MCDONALDS #4342",
        "category": "Dining",
        "amount": "32.4",
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2022-02-02#12344",
        "description": "RAMEN DANBO",
        "category": "Dining",
        "amount": "13",
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2023-01-01#12344",
        "description": "PAYROLL MSFT",
        "category": "Income",
        "amount": "-4000",
        "account": "SAVINGS123"
    }]

def test_get_activities_insights(activities_table, apigw_event_get_2022_01, mock_activities):
    # setup table and insert some activities data in there
    # also test pagination
    for item in mock_activities:
        activities_table.put_item(Item=item)
    ret = app.lambda_handler(apigw_event_get_2022_01, "")
    data = json.loads(ret["body"])
    print(data)
    assert ret["statusCode"] == 200
    assert len(data["data"]) == 1
    assert data["data"][0]['categories'][0]["category"] == "all"
    assert data["data"][0]['categories'][0]["amount"] == "35.9"


def test_get_activities_insights_by_category(activities_table, apigw_event_get_by_category, mock_activities):
    for item in mock_activities:
        activities_table.put_item(Item=item)
    ret = app.lambda_handler(apigw_event_get_by_category, "")
    data = json.loads(ret["body"])
    print(data)
    assert ret["statusCode"] == 200
    assert len(data["data"][0]["categories"]) == 3