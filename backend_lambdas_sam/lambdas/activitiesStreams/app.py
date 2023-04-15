import os
import boto3
import simplejson as json
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
from datetime import datetime

# first set up activity table
table = None

# how does stream work? https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html

def update_activity_category(user_id, category, description):
    print(111, user_id, category, description)
    # first get all activities that contains the description
    response = table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("20"),
        FilterExpression=Attr("description").contains(description)
    )
    # then update the category of each activity
    for item in response.get("Items", []):
        table.update_item(
            Key={
                "user": user_id,
                "sk": item["sk"]
            },
            UpdateExpression="set category = :c",
            ExpressionAttributeValues={
                ":c": category
            }
        )

# helpers to identify stream record type

def check_record_type(record, event_type, sk_prefix):
    return record["eventName"] == event_type and record["dynamodb"]["Keys"]["sk"]["S"].startswith(sk_prefix)

def process_new_mapping(record):
    user_id = record["dynamodb"]["Keys"]["user"]["S"]
    category = record["dynamodb"]["NewImage"]["category"]["S"]
    description = record["dynamodb"]["NewImage"]["description"]["S"]
    update_activity_category(user_id, category, description)

def process_new_activity(record, existing_mapping):
    # try to sum changes up by category and then update insights
    user_id = record["dynamodb"]["Keys"]["user"]["S"]
    category = record["dynamodb"]["NewImage"]["category"]["S"]
    amount = Decimal(record["dynamodb"]["NewImage"]["amount"]["N"])
    month = datetime.strptime(record["dynamodb"]["NewImage"]["date"]["S"], "%Y-%m-%d").strftime("%Y-%m")
    if user_id not in existing_mapping:
        existing_mapping[user_id] = {}
    per_user_mapping = existing_mapping[user_id]
    if month not in per_user_mapping:
        per_user_mapping[month] = {}
    per_month_mapping = per_user_mapping[month]
    if category not in per_month_mapping:
        per_month_mapping[category] = Decimal(0)
    per_month_mapping[category] += amount

def process_modified_activity(record, existing_mapping):
    # try to sum changes up by category and then update insights
    user_id = record["dynamodb"]["Keys"]["user"]["S"]
    old_category = record["dynamodb"]["OldImage"]["category"]["S"]
    new_category = record["dynamodb"]["NewImage"]["category"]["S"]
    amount = Decimal(record["dynamodb"]["NewImage"]["amount"]["N"])
    month = datetime.strptime(record["dynamodb"]["NewImage"]["date"]["S"], "%Y-%m-%d").strftime("%Y-%m")
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
    category = record["dynamodb"]["NewImage"]["category"]["S"]
    amount = Decimal(record["dynamodb"]["NewImage"]["amount"]["N"])
    month = datetime.strptime(record["dynamodb"]["NewImage"]["date"]["S"], "%Y-%m-%d").strftime("%Y-%m")
    if user_id not in existing_mapping:
        existing_mapping[user_id] = {}
    per_user_mapping = existing_mapping[user_id]
    if month not in per_user_mapping:
        per_user_mapping[month] = {}
    per_month_mapping = per_user_mapping[month]
    if category not in per_month_mapping:
        per_month_mapping[category] = Decimal(0)
    per_month_mapping[category] -= amount

def process_deleted_mapping(record):
    user_id = record["dynamodb"]["Keys"]["user"]["S"]
    description = record["dynamodb"]["OldImage"]["description"]["S"]
    update_activity_category(user_id, "others", description)

def lambda_handler(event, context):
    global table
    if not table:
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(os.environ.get("ACTIVITIES_TABLE", ""))
    # handle stream update events
    if event.get("Records", None):
        try:
            # initialize mapping: user -> month -> category -> amount
            insights_activity_mapping = {}
            for record in event.get("Records", []):
                if check_record_type(record, "INSERT", "mapping#"):
                    process_new_mapping(record)
                elif check_record_type(record, "REMOVE", "mapping#"):
                    process_deleted_mapping(record)
                elif check_record_type(record, "INSERT", "20"):
                    process_new_activity(record, insights_activity_mapping)
                elif check_record_type(record, "MODIFY", "20"):
                    process_modified_activity(record, insights_activity_mapping)
                elif check_record_type(record, "REMOVE", "20"):
                    process_deleted_activity([record], insights_activity_mapping)
            if insights_activity_mapping:
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
                            existing_mapping = json.loads(response["Item"]["categories"])
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