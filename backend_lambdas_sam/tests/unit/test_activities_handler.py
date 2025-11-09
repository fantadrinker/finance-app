import pytest
import json
from lambdas.activities import app
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key
from tests.helpers import TestHelpers

@pytest.fixture()
def user_id():
    return "test-user-id"

@pytest.fixture()
def cap1_file_raw():
    return 'Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\n2023-02-25,2023-02-27,0733,RAMEN DANBO ROBSON,Dining,20.47,\n2023-02-24,2023-02-27,0733,SAFEWAY #4931,Merchandise,26.73,\n'


@pytest.fixture()
def rbc_file_raw():
    return '"Account Type","Account Number","Transaction Date","Cheque Number","Description 1","Description 2","CAD$","USD$"\nSavings,07702-5084629,7/5/2023,,"FIND&SAVE FROM PDA",,69.00,,\nSavings,07702-5084629,7/6/2023,,"FIND&SAVE FROM PDA",,65.00,,\nSavings,07702-4526828,6/1/2023,,"DEPOSIT INTEREST",,,1.09,\nSavings,07702-4526828,7/4/2023,,"DEPOSIT INTEREST",,,1.09,\n'


@pytest.fixture()
def td_file_raw():
    return '11/18/2024,PAYMENT - THANK YOU,,1000.00,\n11/17/2024,SAVE ON FOODS #2225,23.48,,\n11/14/2024,PETRO CANADA 77978,92.13,,\n'


@pytest.fixture()
def activities_body_json():
    return json.dumps({
            "data": [
                {
                    'date': '2023-01-01',
                    'account': '0123',
                    'description': 'Ramen Danbo',
                    'category': 'Dining',
                    'amount': "54.03"
                },
                {
                    'date': '2023-01-31',
                    'account': '0123',
                    'description': 'SAFEWAY',
                    'category': 'Grocery',
                    'amount': '33.9'
                },
                {
                    'date': '2023-02-01',
                    'account': '0123',
                    'description': 'ADV PARKING',
                    'category': 'Transportation',
                    'amount': '1.10'
                },
                ]
            })

@pytest.fixture()
def activity_item_patch_category_json():
    return json.dumps({
        "category": "NewCategory"
    })

@pytest.fixture()
def apigw_event_post_cap1(user_id, cap1_file_raw):
    """ Generates API GW Event"""
    return TestHelpers.get_base_event(user_id, "POST", "/activity", "format=cap1", body=cap1_file_raw)

@pytest.fixture()
def apigw_event_post_cap1_preview(user_id, cap1_file_raw):
    return TestHelpers.get_base_event(user_id, "POST", "/activity", "format=cap1&type=preview", body=cap1_file_raw)

@pytest.fixture()
def apigw_event_post_td_preview(user_id, td_file_raw):
    return TestHelpers.get_base_event(
        user_id, 
        "POST", 
        "/activity", 
        "format=td&type=preview", 
        body=td_file_raw
    )


@pytest.fixture()
def apigw_event_post_rbc(user_id, rbc_file_raw):
    """ Generates API GW Event"""
    return TestHelpers.get_base_event(user_id, "POST", "/activity", "format=rbc", body=rbc_file_raw)

@pytest.fixture()
def apigw_get_activities_base(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "")


@pytest.fixture()
def apigw_event_get_max_5(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "size=5")


@pytest.fixture()
def apigw_event_get_by_category_size_5(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "category=test_odd&size=5")

@pytest.fixture()
def apigw_event_get_by_category_size_3(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "category=test_odd&size=3")

@pytest.fixture()
def apigw_event_get_by_category_multiple(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "category=test_odd&category=test_even&orderByAmount=true")

@pytest.fixture()
def apigw_event_get_by_category_mapped(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "category=test_odd_mapped&orderByAmount=true")


@pytest.fixture()
def apigw_event_get_by_account(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "account=acct_1_visa")


@pytest.fixture()
def apigw_event_delete(user_id):
    """ Generates API GW Event"""
    return TestHelpers.get_base_event(user_id, "DELETE", "/activity", "sk=2019-12-266")

@pytest.fixture()
def apigw_event_get_dirty_activities(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "isDirty=true")

@pytest.fixture()
def apigw_event_get_non_dirty_activities(user_id):
    return TestHelpers.get_base_event(user_id, "GET", "/activity", "isDirty=false")

@pytest.fixture()
def apigw_event_patch_activity(user_id, activity_item_patch_category_json):
    return TestHelpers.get_base_event(user_id, "PATCH", "/activity", "sk=2019-12-266", body=activity_item_patch_category_json)

@pytest.fixture()
def mock_activities(user_id):
    base_date = datetime(2020, 1, 1)
    return [
        {
            "user": user_id,
            # ranging from 2019-12-23 to 2020-01-01
            "sk": (base_date - timedelta(days=i)).strftime("%Y-%m-%d") + str(i),
            "date": (base_date - timedelta(days=i)).strftime("%Y-%m-%d"),
            "description": f"test activity {i}",
            "category": "test_odd" if i % 2 != 0 else "test_even",
            "amount": 10 + i,
            "account": "acct_1_visa" if i % 2 != 0 else "acct_2_visa",
            "search_term": f"test activity {i}"
        }
        for i in range(10)
    ]

@pytest.fixture()
def mock_activities_with_different_amount(user_id):
    amounts = [10, 20, 30, 40, 50]
    return [{
        "user": user_id,
        "sk": f"2020-01-01#{value}",
        "description": "test activity",
        "category": "test_cat",
        "amount": value,
        "search_term": "test activity"
    } for value in amounts]

@pytest.fixture()
def mock_activities_with_descriptions(user_id):
    return [{
        "user": user_id,
        "sk": f"2020-01-01#1",
        "description": "SAFEWAY #2345",
        "search_term": "safeway #2345",
        "category": "SAFEWAY",
        "amount": 10,
    }, {
        "user": user_id,
        "sk": f"2020-01-01#2",
        "description": "SAFEWAY #3456",
        "search_term": "safeway #3456",
        "category": "SAFEWAY1",
        "amount": 20,
    }, {
        "user": user_id,
        "sk": f"2020-01-01#4",
        "description": "safeway #3456",
        "search_term": "safeway #3456",
        "category": "SAFEWAY",
        "amount": 20,
    },{
        "user": user_id,
        "sk": f"2020-01-01#3",
        "description": "LONDON DRUGS #2345",
        "search_term": "london drugs #2345",
        "category": "Groceries",
        "amount": 30,
    }]


def test_post_activities_cap1_preview(activities_table, s3, user_id, apigw_event_post_cap1_preview):
    app.s3 = s3
    app.activities_table = activities_table
    # insert some mappings
    activities_table.put_item(Item={
        "user": user_id,
        "sk": "mapping#RAMEN DANBO ROBSON",
        "description": "RAMEN DANBO ROBSON",
        "category": "Ramen",
    })
    ret = app.lambda_handler(apigw_event_post_cap1_preview, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    body = json.loads(ret["body"])
    items = body["data"]["items"]
    assert len(items) == 2
    assert items[0]["description"] == "RAMEN DANBO ROBSON"
    assert items[0]["category"] == "Ramen"
    assert items[0]["account"] == "0733"
    assert items[0]["predicted"] == ["Ramen"]
    assert items[1]["description"] == "SAFEWAY #4931"
    assert items[1]["category"] == "Merchandise"
    assert items[1]["account"] == "0733"
    assert items[1]["predicted"] == []

    # make sure the files are not uploaded to s3 yet
    bucket = s3.Bucket('test-bucket')
    all_objs = list(bucket.objects.filter(
        Prefix=f"{user_id}/cap1/"
    ))
    assert len(all_objs) == 0
    # connect to activities table to make sure the items were added
    activities_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key(
            'sk').between("0000-00-00", "9999-99-99")
    )
    chksum_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").begins_with("chksum#")
    )
    assert len(activities_response["Items"]) == 0
    assert len(chksum_response["Items"]) == 0


def test_post_activities_td_preview(activities_table, s3, user_id, apigw_event_post_td_preview):
    app.s3 = s3
    app.activities_table = activities_table
    # insert some mappings
    activities_table.put_item(Item={
        "user": user_id,
        "sk": "mapping#PETRO CANADA",
        "description": "PETRO CANADA",
        "category": "Gas",
    })
    ret = app.lambda_handler(apigw_event_post_td_preview, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    body = json.loads(ret["body"])
    items = body["data"]["items"]
    assert len(items) == 3
    assert items[0]["description"] == "PAYMENT - THANK YOU"
    assert items[0]["category"] == "PAYMENT - THANK YOU"
    assert items[1]["description"] == "SAVE ON FOODS #2225"
    assert items[1]["category"] == "SAVE ON FOODS #2225"
    assert items[2]["description"] == "PETRO CANADA 77978"
    assert items[2]["category"] == "Gas"


def test_post_activities_cap1(activities_table, s3, user_id, apigw_event_post_cap1):

    app.s3 = s3
    app.activities_table = activities_table
    ret = app.lambda_handler(apigw_event_post_cap1, "")
    assert ret is not None
    assert ret["statusCode"] == 200

    bucket = s3.Bucket('test-bucket')
    all_objs = list(bucket.objects.filter(
        Prefix=f"{user_id}/cap1/"
    ))
    assert len(all_objs) == 1
    # TODO: assert the content of the file in database
    # connect to activities table to make sure the items were added
    activities_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key(
            'sk').between("0000-00-00", "9999-99-99")
    )
    chksum_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").begins_with("chksum#")
    )
    assert len(activities_response["Items"]) == 2
    assert activities_response["Items"][0]["description"] == "SAFEWAY #4931"
    assert activities_response["Items"][0]["search_term"] == "safeway #4931"
    assert activities_response["Items"][0]["category"] == "Merchandise"
    assert activities_response["Items"][0]["account"] == "0733"
    assert activities_response["Items"][1]["description"] == "RAMEN DANBO ROBSON"
    assert activities_response["Items"][1]["category"] == "Dining"
    assert len(chksum_response["Items"]) == 1
    item = chksum_response["Items"][0]
    # TODO: check if start and end date are correct
    # TODO: use regex to fix this line
    # assert item["file"] == f"{user_id}/cap1/2021-01-01.csv"
    assert item["start_date"] == "2023-02-24"
    assert item["end_date"] == "2023-02-25"

def test_post_activities_rbc(activities_table, s3, user_id, apigw_event_post_rbc):
    app.s3 = s3
    app.activities_table = activities_table
    ret = app.lambda_handler(apigw_event_post_rbc, {})
    assert ret is not None
    assert ret["statusCode"] == 200

    bucket = s3.Bucket('test-bucket')
    all_objs = list(bucket.objects.filter(
        Prefix=f"{user_id}/rbc/"
    ))
    assert len(all_objs) == 1

    activities_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key(
            'sk').between("0000-00-00", "9999-99-99")
    )
    chksum_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").begins_with("chksum#")
    )
    assert len(activities_response["Items"]) == 2
    assert activities_response["Items"][0]["description"] == "FIND&SAVE FROM PDA"
    assert activities_response["Items"][0]["search_term"] == "find&save from pda"
    assert activities_response["Items"][0]["account"] == "4629-Savings"
    assert len(chksum_response["Items"]) == 1
    chksum_item = chksum_response["Items"][0]
    # TODO: check start end date
    # TODO: use regex to fix this line
    # assert chksum_item["file"] == f"{user_id}/rbc/2021-01-01.csv"
    assert chksum_item["start_date"] == "2023-07-05"
    assert chksum_item["end_date"] == "2023-07-06"



def test_post_activities(activities_table, s3, user_id, activities_body_json):
    app.s3 = s3
    app.activities_table = activities_table
    evt = TestHelpers.get_base_event(user_id, "POST", "/activity", "", body=activities_body_json)
    ret = app.lambda_handler(evt, {})

    assert ret is not None
    assert ret["statusCode"] == 200

    activities_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key(
            'sk').between("0000-00-00", "9999-99-99")
    )

    assert len(activities_response["Items"]) == 3
    assert activities_response["Items"][0]["description"] == "Ramen Danbo"
    assert activities_response["Items"][0]["search_term"] == "ramen danbo"
    assert activities_response["Items"][0]["account"] == "0123"

def test_get_activities(activities_table, user_id, apigw_event_get_max_5, mock_activities):
    # setup table and insert some activities data in there
    # also test pagination
    for item in mock_activities:
        activities_table.put_item(Item=item)
    # also insert some insights and chksums data to make sure they are not returned
    activities_table.put_item(
        Item={
            "user": user_id,
            "sk": "chksum#2020-01-02",
            "chksum": "6e2771e4bc4ec7dec643ebcf627419af",
        }
    )
    activities_table.put_item(
        Item={
            "user": user_id,
            "sk": "insights#2020-01-02",
            "category": "test insight",
            "amount": 10,
            "date": "2020-01",
        }
    )
    ret = app.lambda_handler(apigw_event_get_max_5, "")

    assert ret is not None
    data = json.loads(ret["body"])
    nextKey = data["LastEvaluatedKey"]
    assert ret["statusCode"] == 200
    assert data["count"] == 5
    assert data["data"][0]["sk"] == "2020-01-010"
    assert nextKey["sk"] == "2019-12-284"

    next_ret = app.lambda_handler({
        **apigw_event_get_max_5,
        "queryStringParameters": {"size": "10", "nextDate": nextKey["sk"]},
    }, "")

    assert next_ret is not None

    data = json.loads(next_ret["body"])

    assert next_ret["statusCode"] == 200
    assert data["count"] == 5
    assert data["data"][0]["sk"] == "2019-12-275"
    assert data["data"][0]["dirty"] == False
    assert data["LastEvaluatedKey"] == {}

def test_get_activities_dirty_flag(activities_table, apigw_event_get_dirty_activities, mock_activities):
    for item in mock_activities:
        activities_table.put_item(Item=item)

    # add mappings
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#test activity 1",
        "description": "test activity 1",
        "category": "test_odd_mapped",
    })

    ret = app.lambda_handler(apigw_event_get_dirty_activities, "")

    assert ret is not None
    assert ret["statusCode"] == 200

    data = json.loads(ret["body"])
    assert data["count"] == 1
    assert data["data"][0]["description"] == "test activity 1"
    assert data["data"][0]["dirty"] == True


def test_get_activities_dirty_flag_false(activities_table, apigw_event_get_non_dirty_activities, mock_activities):
    for item in mock_activities:
        activities_table.put_item(Item=item)

    # add mappings
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#test activity 1",
        "description": "test activity 1",
        "category": "test_odd_mapped",
    })

    ret = app.lambda_handler(apigw_event_get_non_dirty_activities, "")

    assert ret is not None
    assert ret["statusCode"] == 200

    data = json.loads(ret["body"])
    assert data["count"] == 9
    assert len(data["data"]) == 9
    assert not any([item for item in data["data"] if item["description"] == "test activity 1"])
    assert not any([item for item in data["data"] if item["dirty"] == True])

def test_delete_activities(
        activities_table,
        user_id,
        apigw_event_delete,
        mock_activities):
    # setup table and insert some activities data in there
    for item in mock_activities:
        activities_table.put_item(Item=item)

    ret = app.lambda_handler(apigw_event_delete, "")
    assert ret is not None
    assert ret["statusCode"] == 200

    remaining_items = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("20"),
    )
    assert remaining_items["Count"] == 9
    deleted = activities_table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("deleted"),
    )
    assert deleted["Count"] == 1
    assert deleted["Items"][0]["sk"] == "deleted#2019-12-266"

def test_get_activities_by_category(
        activities_table,
        apigw_event_get_by_category_size_5,
        apigw_event_get_by_category_size_3,
        apigw_event_get_by_category_multiple,
        mock_activities):
    # setup table and insert some activities data in there
    for item in mock_activities:
        activities_table.put_item(Item=item)

    ret = app.lambda_handler(apigw_event_get_by_category_size_5, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 5
    assert all([item["category"] == "test_odd" for item in data["data"]])
    assert int(data["data"][0]["amount"]) == 19

    ret = app.lambda_handler(apigw_event_get_by_category_size_3, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 5
    assert all([item["category"] == "test_odd" for item in data["data"]])
    assert int(data["data"][0]["amount"]) == 19

    ret = app.lambda_handler(apigw_event_get_by_category_multiple, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 10
    assert all([item["category"] in ["test_odd", "test_even"] for item in data["data"]])
    assert int(data["data"][0]["amount"]) == 19


def test_get_activities_by_category_with_mappings(
        activities_table,
        apigw_event_get_by_category_mapped,
        mock_activities):
    # setup table and insert some activities data in there
    for item in mock_activities:
        activities_table.put_item(Item=item)

    # add mappings
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#test activity 1",
        "description": "test activity 1",
        "category": "test_odd_mapped",
    })
    # add mappings
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#test activity 7",
        "description": "test activity 7",
        "category": "test_odd_mapped",
    })

    ret = app.lambda_handler(apigw_event_get_by_category_mapped, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 2
    assert "test activity 1" in [item["description"] for item in data["data"]]
    assert "test activity 7" in [item["description"] for item in data["data"]]

    assert all([item["dirty"] for item in data["data"]]) == True

def test_get_activities_by_category_with_mappings_partial(
        activities_table,
        user_id,
        mock_activities):
    # setup table and insert some activities data in there
    for item in mock_activities:
        activities_table.put_item(Item=item)

    # add mappings that matches all
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#test activity",
        "description": "test activity",
        "category": "test_category_mapped",
    })

    ret = app.lambda_handler(TestHelpers.get_base_event(user_id, "GET", "/activities", "category=test_category_mapped"), "")
    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 10

def test_get_activities_by_category_with_start_end_date(
        user_id,
        activities_table,
        mock_activities):
    for item in mock_activities:
        activities_table.put_item(Item=item)

    event = TestHelpers.get_base_event(user_id, "GET", "/activity", "category=test_odd&startDate=2019-12-28&endDate=2020-01-01")
    ret = app.lambda_handler(event, "")

    assert ret is not None

    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 2
    assert all([item["category"] == "test_odd" for item in data["data"]])
    assert all([item["sk"] == "2019-12-293" or item["sk"] == "2019-12-311" for item in data["data"]])

def test_get_activities_exclude_categories(user_id, activities_table, mock_activities):
    # setup table and insert some activities data in there
    for item in mock_activities:
        activities_table.put_item(Item=item)
    event = TestHelpers.get_base_event(user_id, "GET", "/activity", "category=test_odd")

    ret = app.lambda_handler(event, "")

    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 5
    assert all([item["category"] == "test_odd" for item in data["data"]])


def test_get_activities_by_account(activities_table, apigw_event_get_by_account, mock_activities):

    for items in mock_activities:
        activities_table.put_item(Item=items)

    ret = app.lambda_handler(apigw_event_get_by_account, "")

    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 5
    assert all([item["account"] == "acct_1_visa" for item in data["data"]])


def test_get_activities_by_amount_upper_lower(activities_table, apigw_get_activities_base, mock_activities_with_different_amount):

    for items in mock_activities_with_different_amount:
        activities_table.put_item(Item=items)

    # max 30
    ret = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"amountMax": "30"},
    }, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 3
    assert all([int(item["amount"]) <= 30 for item in data["data"]])

    # min 20
    ret = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"amountMin": "20"},
    }, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 4
    assert all([int(item["amount"]) >= 20 for item in data["data"]])

    # min 20 max 40
    ret = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"amountMin": "20", "amountMax": "40"},
    }, "")
    assert ret is not None
    assert ret["statusCode"] == 200
    data = json.loads(ret["body"])
    assert data["count"] == 3
    assert all([int(item["amount"]) >= 20 and int(item["amount"]) <= 40 for item in data["data"]])


def test_get_activities_by_description(activities_table, apigw_get_activities_base, mock_activities_with_descriptions):
    for items in mock_activities_with_descriptions:
        activities_table.put_item(Item=items)

    # first should match everything that starts with key
    resposne_match_start = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"description": "SAFEWAY"},
    }, "")

    assert resposne_match_start is not None
    assert resposne_match_start["statusCode"] == 200
    data = json.loads(resposne_match_start["body"])
    assert data["count"] == 3
    keys = [item["sk"] for item in data["data"]]
    assert "2020-01-01#1" in keys
    assert "2020-01-01#2" in keys
    assert "2020-01-01#4" in keys

    # second should match everything that ends with key
    resposne_match_end = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"description": "2345"},
    }, "")

    assert resposne_match_end is not None
    assert resposne_match_end["statusCode"] == 200
    data = json.loads(resposne_match_end["body"])
    assert data["count"] == 2
    keys = [item["sk"] for item in data["data"]]
    assert "2020-01-01#1" in keys
    assert "2020-01-01#3" in keys

    # third should match everything that exactly matches the key
    resposne_match_exact = app.lambda_handler({
        **apigw_get_activities_base,
        "queryStringParameters": {"description": "SAFEWAY #2345"},
    }, "")

    assert resposne_match_exact is not None
    assert resposne_match_exact["statusCode"] == 200
    data = json.loads(resposne_match_exact["body"])
    assert data["count"] == 1
    assert data["data"][0]["sk"] == "2020-01-01#1"

def test_get_activities_with_mappings(activities_table, apigw_get_activities_base, mock_activities_with_descriptions):
    for items in mock_activities_with_descriptions:
        activities_table.put_item(Item=items)

    # add mappings
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#SAFEWAY",
        "description": "SAFEWAY",
        "category": "Grocery Safeway", # override the category
    })
    activities_table.put_item(Item={
        "user": "test-user-id",
        "sk": "mapping#LONDON DRUGS #2345",
        "description": "LONDON DRUGS #2345",
        "category": "Groceries",
    })

    # first should match everything that starts with key
    resposne_match_start = app.lambda_handler(apigw_get_activities_base, "")

    assert resposne_match_start is not None
    assert resposne_match_start["statusCode"] == 200
    data = json.loads(resposne_match_start["body"])
    assert data["count"] == 4

    first_item_category = next((x["category"] for x in data["data"] if x["sk"] == "2020-01-01#1"), None)
    assert first_item_category == "Grocery Safeway" # mapped

    second_item_category = next((x["category"] for x in data["data"] if x["sk"] == "2020-01-01#2" ), None)
    assert second_item_category == "Grocery Safeway" # mapped

    third_item_category = next((x["category"] for x in data["data"] if x["sk"] == "2020-01-01#3"), None)
    assert third_item_category == "Groceries" # not mapped

    fourth_item_category = next((x["category"] for x in data["data"] if x["sk"] == "2020-01-01#4"), None)
    assert fourth_item_category == "SAFEWAY" # not mapped


def test_patch_activity(user_id, activities_table, apigw_event_patch_activity, mock_activities):
    for item in mock_activities:
        activities_table.put_item(Item=item)
    
    response = app.lambda_handler(apigw_event_patch_activity, "")

    assert response is not None
    assert response["statusCode"] == 200

    getItemResponse = activities_table.get_item(
        Key={
            'user':  user_id,
            'sk':  '2019-12-266'
        },
        ProjectionExpression="category"
    )
    assert getItemResponse["Item"]["category"] == "NewCategory"
