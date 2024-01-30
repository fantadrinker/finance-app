import pytest
from lambdas.activitiesFilesProcessor import app # pylint: disable=import-error
import boto3
from boto3.dynamodb.conditions import Key
from moto import mock_s3

@pytest.fixture()
def user_id():
    """ test user id """
    return "test-user-id"


@pytest.fixture()
def cap1_file_raw():
    """ raw file cap 1 style """
    return b'Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\n2023-02-25,2023-02-27,0733,RAMEN DANBO ROBSON,Dining,20.47,\n2023-02-24,2023-02-27,0733,SAFEWAY #4931,Merchandise,26.73,\n'


@pytest.fixture()
def rbc_file_raw():
    """ raw file rbc style """
    return b'"Account Type","Account Number","Transaction Date","Cheque Number","Description 1","Description 2","CAD$","USD$"\nSavings,07702-5084629,7/5/2023,,"FIND&SAVE FROM PDA",,69.00,,\nSavings,07702-5084629,7/6/2023,,"FIND&SAVE FROM PDA",,65.00,,\nSavings,07702-4526828,6/1/2023,,"DEPOSIT INTEREST",,,1.09,\nSavings,07702-4526828,7/4/2023,,"DEPOSIT INTEREST",,,1.09,\n'


@pytest.fixture()
def s3(user_id, cap1_file_raw):
    with mock_s3():
        s3 = boto3.resource('s3', region_name="us-east-1")
        s3.create_bucket(Bucket="test-bucket")
        s3.Object("test-bucket",
                  f"{user_id}/cap1/2021-01-01.csv").put(Body=cap1_file_raw)
        yield s3


@pytest.fixture()
def s3_rbc(user_id, rbc_file_raw):
    with mock_s3():
        s3 = boto3.resource('s3', region_name="us-east-1")
        s3.create_bucket(Bucket="test-bucket")
        s3.Object("test-bucket",
                  f"{user_id}/rbc/2021-01-01.csv").put(Body=rbc_file_raw)
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


@pytest.fixture()
def event_rbc(user_id):
    return {
        "Records": [
            {
                "s3": {
                    "bucket": {
                        "name": "test-bucket"
                    },
                    "object": {
                        "key": f"{user_id}/rbc/2021-01-01.csv"
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
        KeyConditionExpression=Key("user").eq(user_id) & Key(
            'sk').between("0000-00-00", "9999-99-99")
    )
    chksum_response = activities_table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").begins_with("chksum#")
    )
    assert len(activities_response["Items"]) == 2
    assert activities_response["Items"][0]["description"] == "SAFEWAY #4931"
    assert activities_response["Items"][0]["category"] == "Grocery"
    assert activities_response["Items"][1]["description"] == "RAMEN DANBO ROBSON"
    assert activities_response["Items"][1]["category"] == "Dining"
    assert len(chksum_response["Items"]) == 1
    item = chksum_response["Items"][0]
    # TODO: check if start and end date are correct
    assert item["file"] == f"{user_id}/cap1/2021-01-01.csv"
    assert item["start_date"] == "2023-02-24"
    assert item["end_date"] == "2023-02-25"


def test_event_processing_rbc(activities_table, user_id, s3_rbc, event_rbc):
    app.activities_table = activities_table
    app.s3 = s3_rbc
    app.lambda_handler(event_rbc, {})
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
    assert activities_response["Items"][0]["description"] == "FIND&SAVE FROM PDA"
    assert len(chksum_response["Items"]) == 1
    chksum_item = chksum_response["Items"][0]
    # TODO: check start end date
    assert chksum_item["file"] == f"{user_id}/rbc/2021-01-01.csv"
    assert chksum_item["start_date"] == "2023-07-05"
    assert chksum_item["end_date"] == "2023-07-06"
