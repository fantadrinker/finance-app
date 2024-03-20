import pytest
import simplejson as json
from decimal import Decimal
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
def apigw_event_get_exclude_negative(user_id):
    return TestHelpers.get_base_event(
        user_id,
        "GET",
        "/activityInsights",
        "starting_date=2022-01-01&ending_date=2023-02-10&all_categories=false&exclude_negative=true"
    )
    

@pytest.fixture()
def mock_activities(user_id):
    """ Generates mock insights data"""
    return [{
        "user": user_id,
        "sk": f"2021-01-10#12344",
        "date": "2021-01-10",
        "description": "SAFEWAY #2345",
        "category": "Groceries",
        "amount": Decimal("98.4"),
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2022-01-10#12344",
        "date": "2022-01-10",
        "description": "PAY PARKING #2345",
        "category": "Transit",
        "amount": Decimal("3.5"),
        "account": "MASTERCARD4"
    }, {
        "user": user_id,
        "sk": f"2022-01-31#12344",
        "date": "2022-01-31",
        "description": "MCDONALDS #4342",
        "category": "Dining",
        "amount": Decimal("32.4"),
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2022-02-02#12344",
        "date": "2022-02-02",
        "description": "RAMEN DANBO",
        "category": "Dining",
        "amount": Decimal("13"),
        "account": "VISA123"
    }, {
        "user": user_id,
        "sk": f"2023-01-01#12344",
        "date": "2023-01-01",
        "description": "PAYROLL MSFT",
        "category": "Income",
        "amount": Decimal("-4000"),
        "account": "SAVINGS123"
    }]

def test_get_activities_insights(activities_table, apigw_event_get_2022_01, mock_activities):
    # setup table and insert some activities data in there
    # also test pagination
    for item in mock_activities:
        activities_table.put_item(Item=item)
    ret = app.lambda_handler(apigw_event_get_2022_01, "")
    data = json.loads(ret["body"])
    assert ret["statusCode"] == 200
    assert len(data["data"]) == 1
    categories = data["data"][0]['categories']
    assert len(categories) == 2
    assert "Transit" in [c["category"] for c in categories]
    assert "Dining" in [c["category"] for c in categories]


def test_get_activities_insights_by_category(activities_table, apigw_event_get_by_category, mock_activities):
    for item in mock_activities:
        activities_table.put_item(Item=item)
    ret = app.lambda_handler(apigw_event_get_by_category, "")
    data = json.loads(ret["body"])

    assert ret["statusCode"] == 200
    assert len(data["data"][0]["categories"]) == 2

def test_get_activities_insights_exclude_negative(activities_table, apigw_event_get_exclude_negative, mock_activities):
    for item in mock_activities:
        activities_table.put_item(Item=item)
    ret = app.lambda_handler(apigw_event_get_exclude_negative, "")
    data = json.loads(ret["body"])
    assert ret["statusCode"] == 200
    assert len(data["data"][0]["categories"]) == 2
    assert "Income" not in [c["category"] for c in data["data"][0]["categories"]]

def test_get_insights_with_existing_mappings(activities_table, apigw_event_get_2022_01, mock_activities):
    # setup table and insert some activities data in there
    # also test pagination
    for item in mock_activities:
        activities_table.put_item(Item=item)
    
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#MCDONALDS",
        "description": "MCDONALDS",
        "category": "Food"
    }) 
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#RAMEN",
        "description": "RAMEN DANBO",
        "category": "Food" # should not match
    })

    ret = app.lambda_handler(apigw_event_get_2022_01, "")
    data = json.loads(ret["body"])
    assert ret["statusCode"] == 200
    assert len(data["data"]) == 1
    categories = data["data"][0]['categories']
    assert len(categories) == 2
    assert "Transit" in [c["category"] for c in categories]
    assert "Food" in [c["category"] for c in categories]

def test_get_insights_broken_down_by_month(activities_table, apigw_event_get_2022_01, mock_activities):
    # TODO: this is auto generated, fix test
    # setup table and insert some activities data in there
    # also test pagination
    for item in mock_activities:
        activities_table.put_item(Item=item)
    ret = app.lambda_handler(apigw_event_get_2022_01, "")
    data = json.loads(ret["body"])
    assert ret["statusCode"] == 200
    assert len(data["data"]) == 1
    assert len(data["data"][0]["categories"]) == 2