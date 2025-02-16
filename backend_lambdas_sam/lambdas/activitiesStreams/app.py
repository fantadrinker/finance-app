import os
import boto3
import simplejson as json
import uuid
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
from datetime import datetime, timedelta

# first set up activity table
table = None

# how does stream work? https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html


def check_record_type(record, event_type, sk_prefix):
    return record["eventName"] == event_type and record["dynamodb"]["Keys"]["sk"]["S"].startswith(sk_prefix)


def process_new_activity(record, existing_mapping):
    global table
    # try to sum changes up by category and then update insights
    user_id = record["dynamodb"]["Keys"]["user"]["S"]
    category = record["dynamodb"]["NewImage"]["category"]["S"]
    amount = Decimal(record["dynamodb"]["NewImage"]["amount"]["N"])
    month = datetime.strptime(
        record["dynamodb"]["NewImage"]["date"]["S"], "%Y-%m-%d").strftime("%Y-%m")
    if user_id not in existing_mapping:
        existing_mapping[user_id] = {}
    per_user_mapping = existing_mapping[user_id]
    if month not in per_user_mapping:
        per_user_mapping[month] = {}
    per_month_mapping = per_user_mapping[month]
    if category not in per_month_mapping:
        per_month_mapping[category] = Decimal(0)
    per_month_mapping[category] += amount

    try:
        related_activities = find_related_activities(record)
        print(len(related_activities))
        for activity in related_activities:
            item = {
                "user": user_id,
                "sk": "related_activity#" + str(uuid.uuid4()),
                "related": activity["activity"]["sk"],
                "activity": record["dynamodb"]["Keys"]["sk"]["S"],
                "opposite": activity.get("opposite", False),
                "duplicate": activity.get("duplicate", False)
            }
            print("inserting related activity", item)
            # for insights we're using batch writer
            table.put_item(Item=item)
    except Exception as e:
        print("error", e)


def process_modified_activity(record, existing_mapping):
    # try to sum changes up by category and then update insights
    user_id = record["dynamodb"]["Keys"]["user"]["S"]
    old_category = record["dynamodb"]["OldImage"]["category"]["S"]
    new_category = record["dynamodb"]["NewImage"]["category"]["S"]
    amount = Decimal(record["dynamodb"]["NewImage"]["amount"]["N"])
    month = datetime.strptime(
        record["dynamodb"]["NewImage"]["date"]["S"], "%Y-%m-%d").strftime("%Y-%m")
    if old_category != new_category:
        if user_id not in existing_mapping:
            existing_mapping[user_id] = {}
        per_user_mapping = existing_mapping[user_id]
        if month not in per_user_mapping:
            per_user_mapping[month] = {}
        per_month_mapping = per_user_mapping[month]
        if old_category in per_month_mapping:
            per_month_mapping[old_category] -= amount
        else:
            per_month_mapping[old_category] = -amount
        if new_category in per_month_mapping:
            per_month_mapping[new_category] += amount
        else:
            per_month_mapping[new_category] = amount


def process_deleted_activity(record, existing_mapping):
    # try to sum changes up by category and then update insights
    user_id = record["dynamodb"]["Keys"]["user"]["S"]
    category = record["dynamodb"]["OldImage"]["category"]["S"]
    amount = Decimal(record["dynamodb"]["OldImage"]["amount"]["N"])
    month = datetime.strptime(
        record["dynamodb"]["OldImage"]["date"]["S"], "%Y-%m-%d").strftime("%Y-%m")
    if user_id not in existing_mapping:
        existing_mapping[user_id] = {}
    per_user_mapping = existing_mapping[user_id]
    if month not in per_user_mapping:
        per_user_mapping[month] = {}
    per_month_mapping = per_user_mapping[month]
    if category not in per_month_mapping:
        per_month_mapping[category] = Decimal(0)
    per_month_mapping[category] -= amount


def process_activity_insights(records):
    insights = {}
    for record in records:
        if check_record_type(record, "INSERT", "20"):
            print("processing new activity", record)
            process_new_activity(record, insights)
        elif check_record_type(record, "MODIFY", "20"):
            print("processing modified activity", record)
            process_modified_activity(
                record, insights)
        elif check_record_type(record, "REMOVE", "20"):
            print("processing deleted activity", record)
            process_deleted_activity(record, insights)
    return insights


RELATED_ACTIVITY_TIMEDELTA = 7


def find_related_activities(record):
    global table
    user_id = record["dynamodb"]["Keys"]["user"]["S"]
    sk = record["dynamodb"]["Keys"]["sk"]["S"]
    amount = Decimal(record["dynamodb"]["NewImage"]["amount"]["N"])
    date = datetime.strptime(
        record["dynamodb"]["NewImage"]["date"]["S"], "%Y-%m-%d")
    begin_find_date = (date - timedelta(days=RELATED_ACTIVITY_TIMEDELTA)).strftime(
        "%Y-%m-%d")
    end_find_date = (date + timedelta(days=RELATED_ACTIVITY_TIMEDELTA)).strftime(
        "%Y-%m-%d")
    duplicate_responses = table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").between(begin_find_date, end_find_date),
        FilterExpression=Attr("amount").eq(amount)
    )

    opposite_responses = table.query(
        KeyConditionExpression=Key("user").eq(
            user_id) & Key("sk").between(begin_find_date, end_find_date),
        FilterExpression=Attr("amount").eq(-amount)
    )
    return [{
        "activity": x,
        "duplicate": True
    } for x in duplicate_responses["Items"] if x["sk"] != sk] + [{
        "activity": x,
        "opposite": True
    } for x in opposite_responses["Items"] if x["sk"] != sk]


def lambda_handler(event, context):
    global table
    if not table:
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(os.environ.get("ACTIVITIES_TABLE", ""))
    # handle stream update events
    records = event.get("Records", None)
    if records is None:
        return {
            "statusCode": 200,
            "body": json.dumps("No records found")
        }
    try:
        # initialize mapping: user -> month -> category -> amount
        insights_activity_mapping = process_activity_insights(
            records)
        if not insights_activity_mapping:
            return {
                "statusCode": 200,
                "body": json.dumps("No insights found")
            }
        print("updating insights", insights_activity_mapping)
        for user_id, per_user_mapping in insights_activity_mapping.items():
            for month, per_month_mapping in per_user_mapping.items():
                # first get existing mappings
                response = table.get_item(
                    Key={
                        "user": user_id,
                        "sk": f"insights#{month}"
                    }
                )
                # merge existing mappings with new mappings
                if "Item" in response:
                    existing_mapping = json.loads(
                        response["Item"]["categories"], parse_float=Decimal)
                    for category, amount in per_month_mapping.items():
                        if category in existing_mapping:
                            existing_mapping[category] += amount
                        else:
                            existing_mapping[category] = amount
                    per_month_mapping = existing_mapping
                    # update insights
                    table.update_item(
                        Key={
                            "user": user_id,
                            "sk": f"insights#{month}"
                        },
                        UpdateExpression="set categories = :a",
                        ExpressionAttributeValues={
                            ":a": json.dumps(per_month_mapping)
                        }
                    )
                else:
                    # create insights
                    table.put_item(
                        Item={
                            "user": user_id,
                            "sk": f"insights#{month}",
                            "categories": json.dumps(per_month_mapping),
                            "date": month
                        }
                    )
    except Exception as e:
        print(e)
        return {
            "statusCode": 500,
            "body": "failed to update activity insights",
            "error": str(e)
        }
    return {
        "statusCode": 200,
        "body": "successfully updated activity insights",
    }
