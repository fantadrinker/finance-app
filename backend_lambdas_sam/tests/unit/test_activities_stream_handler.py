import pytest
import json
from lambdas.activitiesStreams import app
from datetime import datetime, timedelta
import boto3
from boto3.dynamodb.conditions import Key


@pytest.fixture()
def user_id():
    return "test-user-id"


@pytest.fixture()
def apigw_event_new_mapping(user_id):
    return {
        "Records": [{
            "eventID": "f8a4fc12b206d371ee7a6491b27e4af4",
            "eventName": "INSERT",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1680927252.0,
                "Keys": {
                    "sk": {
                        "S": "mapping#1111111"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "NewImage": {
                    "sk": {
                        "S": "mapping#"
                    },
                    "description": {
                        "S": "test activity 1"
                    },
                    "category": {
                        "S": "testCategory"
                    },
                    "priority": {
                        "N": "0"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "NEW_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:962861289619:table/backendLambdasSam-ActivitiesTable-37ZDBRHT7AY3/stream/2023-04-05T20:16:32.035"
        }]
    }


@pytest.fixture()
def apigw_event_new_activities(user_id):
    return {
        "Records": [{
            "eventID": "f8a4fc12b206d371ee7a6491b27e4af4",
            "eventName": "INSERT",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1680927252.0,
                "Keys": {
                    "sk": {
                        "S": "2022-11-01"
                    },
                    "user": {
                        "S": user_id
                    },
                },
                "NewImage": {
                    "sk": {
                        "S": "2022-11-01"
                    },
                    "date": {
                        "S": "2022-11-01"
                    },
                    "description": {
                        "S": "test activity 1"
                    },
                    "category": {
                        "S": "some_existing_category"
                    },
                    "amount": {
                        "N": "10"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "NEW_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:962861289619:table/backendLambdasSam-ActivitiesTable-37ZDBRHT7AY3/stream/2023-04-05T20:16:32.035"
        }, {
            "eventID": "f8a4fc12b206d371ee7a6491b27e4af4",
            "eventName": "INSERT",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1680927252.0,
                "Keys": {
                    "sk": {
                        "S": "2022-11-01"
                    },
                    "user": {
                        "S": user_id
                    },
                },
                "NewImage": {
                    "sk": {
                        "S": "2022-11-01"
                    },
                    "date": {
                        "S": "2022-11-01"
                    },
                    "description": {
                        "S": "test activity 1"
                    },
                    "category": {
                        "S": "some_new_category"
                    },
                    "amount": {
                        "N": "10"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "NEW_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:962861289619:table/backendLambdasSam-ActivitiesTable-37ZDBRHT7AY3/stream/2023-04-05T20:16:32.035"
        }, {
            "eventID": "f8a4fc12b206d371ee7a6491b27e4af4",
            "eventName": "INSERT",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1680927252.0,
                "Keys": {
                    "sk": {
                        "S": f"2022-12-01"
                    },
                    "user": {
                        "S": user_id
                    },
                },
                "NewImage": {
                    "sk": {
                        "S": "2022-12-01"
                    },
                    "date": {
                        "S": "2022-12-01"
                    },
                    "description": {
                        "S": "test activity 1"
                    },
                    "category": {
                        "S": "some_existing_category"
                    },
                    "amount": {
                        "N": "10"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "NEW_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:962861289619:table/backendLambdasSam-ActivitiesTable-37ZDBRHT7AY3/stream/2023-04-05T20:16:32.035"
        }]
    }


@pytest.fixture()
def apigw_event_delete_activities(user_id):
    return {
        "Records": [{
            "eventID": "f8a4fc12b206d371ee7a6491b27e4af4",
            "eventName": "REMOVE",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1680927252.0,
                "Keys": {
                    "sk": {
                        "S": f"2022-10-01"
                    },
                    "user": {
                        "S": user_id
                    },
                },
                "OldImage": {
                    "sk": {
                        "S": f"2022-10-01"
                    },
                    "date": {
                        "S": f"2022-10-01"
                    },
                    "description": {
                        "S": f"test activity 1"
                    },
                    "category": {
                        "S": f"delete_categories"
                    },
                    "amount": {
                        "N": "5"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "OLD_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:962861289619:table/backendLambdasSam-ActivitiesTable-37ZDBRHT7AY3/stream/2023-04-05T20:16:32.035"
        }, {
            "eventID": "f8a4fc12b206d371ee7a6491b27e4af4",
            "eventName": "REMOVE",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1680927252.0,
                "Keys": {
                    "sk": {
                        "S": f"2022-11-01"
                    },
                    "user": {
                        "S": user_id
                    },
                },
                "OldImage": {
                    "sk": {
                        "S": f"2022-11-01"
                    },
                    "date": {
                        "S": f"2022-11-01"
                    },
                    "description": {
                        "S": f"test activity 1"
                    },
                    "category": {
                        "S": f"some_existing_category"
                    },
                    "amount": {
                        "N": "4"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "OLD_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:962861289619:table/backendLambdasSam-ActivitiesTable-37ZDBRHT7AY3/stream/2023-04-05T20:16:32.035"
        }]
    }


@pytest.fixture()
def apigw_event_modify_activities(user_id):
    return {
        "Records": [{
            "eventID": "f8a4fc12b206d371ee7a6491b27e4af4",
            "eventName": "MODIFY",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1680927252.0,
                "Keys": {
                    "sk": {
                        "S": f"2022-11-01"
                    },
                    "user": {
                        "S": user_id
                    },
                },
                "OldImage": {
                    "sk": {
                        "S": f"2022-11-01"
                    },
                    "date": {
                        "S": f"2022-11-01"
                    },
                    "description": {
                        "S": f"test activity 1"
                    },
                    "category": {
                        "S": f"some_existing_category"
                    },
                    "amount": {
                        "N": "5"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "NewImage": {
                    "sk": {
                        "S": f"2022-11-01"
                    },
                    "date": {
                        "S": f"2022-11-01"
                    },
                    "description": {
                        "S": f"test activity 1"
                    },
                    "category": {
                        "S": f"some_new_category"
                    },
                    "amount": {
                        "N": "5"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "OLD_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:962861289619:table/backendLambdasSam-ActivitiesTable-37ZDBRHT7AY3/stream/2023-04-05T20:16:32.035"
        }]
    }


@pytest.fixture()
def api_gw_event_new_related_activities(user_id):
    return {
        "Records": [{
            "eventName": "INSERT",
            "dynamodb": {
                "Keys": {
                    "sk": {
                        "S": "2022-11-01#parking1"
                    },
                    "user": {
                        "S": user_id
                    },
                },
                "NewImage": {
                    "sk": {
                        "S": "2022-11-01#parking1"
                    },
                    "date": {
                        "S": "2022-11-01"
                    },
                    "description": {
                        "S": "parking"
                    },
                    "category": {
                        "S": "transportation"
                    },
                    "amount": {
                        "N": "5"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "NEW_IMAGE"
            },
        }, {
            "eventName": "INSERT",
            "dynamodb": {
                "Keys": {
                    "sk": {
                        "S": "2022-11-05#payment2"
                    },
                    "user": {
                        "S": user_id
                    },
                },
                "NewImage": {
                    "sk": {
                        "S": "2022-11-05#payment2"
                    },
                    "date": {
                        "S": "2022-11-05"
                    },
                    "description": {
                        "S": "payment"
                    },
                    "category": {
                        "S": "payment"
                    },
                    "amount": {
                        "N": "-500"
                    },
                    "user": {
                        "S": user_id
                    }
                },
                "StreamViewType": "NEW_IMAGE"
            },
        }]
    }


@ pytest.fixture()
def mock_activities(user_id):
    base_date = datetime(2020, 1, 1)
    return [
        {
            "user": user_id,
            "sk": (base_date - timedelta(days=i)).strftime("%Y-%m-%d") + str(i),
            "description": f"test activity {i}",
            "category": "test_odd" if i % 2 != 0 else "test_even",
            "amount": 10,
        }
        for i in range(10)
    ]


@ pytest.fixture()
def mock_activities_for_related(user_id):
    return [
        {
            "user": user_id,
            "sk": "2022-11-01#parking1",
            "description": "parking",
            "category": "transportation",
            "amount": 5,
        },
        {
            "user": user_id,
            "sk": "2022-11-01#parking2",
            "description": "parking",
            "category": "transportation",
            "amount": 5,
        },
        {
            "user": user_id,
            "sk": "2022-11-03#payment1",
            "description": "payment",
            "category": "payment",
            "amount": 500,
        },
        {
            "user": user_id,
            "sk": "2022-11-05#payment2",
            "description": "payment",
            "category": "payment",
            "amount": -500,
        }
    ]


@ pytest.fixture()
def mock_insights(user_id):
    return [
        {
            "user": user_id,
            "sk": f"insights#2022-11",
            "categories": json.dumps({
                "some_existing_category": 5,
            }),
            "date": "2022-11"
        },
        {
            "user": user_id,
            "sk": f"insights#2022-10",
            "categories": json.dumps({
                "delete_categories": 5,
            }),
            "date": "2022-10"
        },
    ]


def test_new_update_delete_activities(activities_table, apigw_event_new_activities, user_id, mock_insights):
    for item in mock_insights:
        activities_table.put_item(Item=item)

    app.table = activities_table
    ret = app.lambda_handler(apigw_event_new_activities, "")
    assert ret["statusCode"] == 200
    # check that the activities insights are created or updated
    all_insights = activities_table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").begins_with("insights#")
    )["Items"]
    assert len(all_insights) == 3
    assert all_insights[0] == {
        "user": user_id,
        "sk": f"insights#2022-10",
        "categories": json.dumps({
            "delete_categories": 5
        }),
        "date": "2022-10",
    }
    assert all_insights[1] == {
        "user": user_id,
        "sk": f"insights#2022-11",
        "categories": json.dumps({
            "some_existing_category": 15,
            "some_new_category": 10,
        }),
        "date": "2022-11",
    }
    assert all_insights[2] == {
        "user": user_id,
        "sk": f"insights#2022-12",
        "categories": json.dumps({
            "some_existing_category": 10
        }),
        "date": "2022-12",
    }


def test_delete_activities(activities_table, apigw_event_delete_activities, user_id, mock_insights):
    for item in mock_insights:
        activities_table.put_item(Item=item)

    app.table = activities_table
    ret = app.lambda_handler(apigw_event_delete_activities, "")
    assert ret["statusCode"] == 200
    # check that the activities insights are created or updated
    all_insights = activities_table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").begins_with("insights#")
    )["Items"]
    assert len(all_insights) == 2
    assert all_insights[0] == {
        "user": user_id,
        "sk": f"insights#2022-10",
        "categories": json.dumps({
            "delete_categories": 0
        }),
        "date": "2022-10",
    }
    assert all_insights[1] == {
        "user": user_id,
        "sk": f"insights#2022-11",
        "categories": json.dumps({
            "some_existing_category": 1,
        }),
        "date": "2022-11",
    }


def test_modify_activities(activities_table, apigw_event_modify_activities, user_id, mock_insights):
    for item in mock_insights:
        activities_table.put_item(Item=item)

    app.table = activities_table
    ret = app.lambda_handler(apigw_event_modify_activities, "")
    assert ret["statusCode"] == 200
    # check that the activities insights are created or updated
    all_insights = activities_table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").begins_with("insights#")
    )["Items"]
    assert len(all_insights) == 2
    assert all_insights[0] == {
        "user": user_id,
        "sk": f"insights#2022-10",
        "categories": json.dumps({
            "delete_categories": 5
        }),
        "date": "2022-10",
    }
    assert all_insights[1] == {
        "user": user_id,
        "sk": f"insights#2022-11",
        "categories": json.dumps({
            "some_existing_category": 0,
            "some_new_category": 5,
        }),
        "date": "2022-11",
    }


def test_new_related_activities(
        activities_table,
        api_gw_event_new_related_activities,
        user_id,
        mock_activities_for_related):
    # have some random activities in the table
    # pass in new event that has duplicate or opposite activities_table
    # check that the new related activities are in the table
    for item in mock_activities_for_related:
        activities_table.put_item(Item=item)

    app.table = activities_table
    ret = app.lambda_handler(api_gw_event_new_related_activities, "")
    assert ret["statusCode"] == 200

    related_activities = activities_table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").begins_with("related_activity#")
    )["Items"]
    assert len(related_activities) == 2
