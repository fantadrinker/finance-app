

import os
import boto3
from boto3.dynamodb.conditions import Key, Attr

# first set up activity table
table = None

# how does stream work? https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html

def update_insight(user_id, new_category, amount):
    # first get all activities that contains the description
    response = table.query(
        KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("insights#"),
        FilterExpression=Attr("category").eq(new_category)
    )
    items = response.get("Items", [])
    if items:
        # then update the category of each activity
        for item in response.get("Items", []):
            table.update_item(
                Key={
                    "user": user_id,
                    "sk": item["sk"]
                },
                UpdateExpression=f"set amount = amount {'+' if amount > 0 else '-'} :a",
                ExpressionAttributeValues={
                    ":a": amount
                }
            )
    else:
        # insert new insight item
        table.put_item(
            Item={
                "user": user_id,
                "sk": f"insights#{new_category}",
                "category": new_category,
                "amount": amount
            }
        )

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

def process_new_mappings(records):
    for record in records:
        user_id = record["dynamodb"]["Keys"]["user"]["S"]
        category = record["dynamodb"]["NewImage"]["category"]["S"]
        description = record["dynamodb"]["NewImage"]["description"]["S"]
        update_activity_category(user_id, category, description)

def process_new_activities(records):
    # try to sum changes up by category and then update insights
    category_to_amount = {}
    for record in records:
        user_id = record["dynamodb"]["Keys"]["user"]["S"]
        category = record["dynamodb"]["NewImage"]["category"]["S"]
        amount = record["dynamodb"]["NewImage"]["amount"]["N"]
        if user_id not in category_to_amount:
            category_to_amount[user_id] = {}
        per_user_mapping = category_to_amount[user_id]
        if category in per_user_mapping:
            per_user_mapping[category] += amount
        else:
            per_user_mapping[category] = amount
    for user, mappings in category_to_amount.items():
        for category, amount in mappings.items():
            update_insight(user, category, amount)

def process_modified_activities(records):
    # try to sum changes up by category and then update insights
    category_to_amount = {}
    for record in records:
        user_id = record["dynamodb"]["Keys"]["user"]["S"]
        old_category = record["dynamodb"]["OldImage"]["category"]["S"]
        new_category = record["dynamodb"]["NewImage"]["category"]["S"]
        amount = record["dynamodb"]["NewImage"]["amount"]["N"]
        if user_id not in category_to_amount:
            category_to_amount[user_id] = {}
        per_user_mapping = category_to_amount[user_id]
        if old_category in per_user_mapping:
            per_user_mapping[old_category] -= amount
        else:
            per_user_mapping[old_category] = -amount
        if new_category in per_user_mapping:
            per_user_mapping[new_category] += amount
        else:
            per_user_mapping[new_category] = amount
    for user, mappings in category_to_amount.items():
        for category, amount in mappings.items():
            update_insight(user, category, amount)

def process_deleted_activities(records):
    category_to_amount = {}
    for record in records:
        user_id = record["dynamodb"]["Keys"]["user"]["S"]
        category = record["dynamodb"]["OldImage"]["category"]["S"]
        amount = record["dynamodb"]["OldImage"]["amount"]["N"]
        if user_id not in category_to_amount:
            category_to_amount[user_id] = {}
        per_user_mapping = category_to_amount[user_id]
        if category in per_user_mapping:
            per_user_mapping[category] -= amount
        else:
            per_user_mapping[category] = -amount
    for user, mappings in category_to_amount.items():
        for category, amount in mappings.items():
            update_insight(user, category, amount)

def process_deleted_mappings(records):
    for record in records:
        user_id = record["dynamodb"]["Keys"]["user"]["S"]
        description = record["dynamodb"]["OldImage"]["description"]["S"]
        update_activity_category(user_id, "others", description)

def lambda_handler(event, context):
    if not table:
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(os.environ.get("ACTIVITIES_TABLE", ""))
    # handle stream update events
    if event.get("Records", None):
        # first group records by use cases
        # 1. new mapping
        # 2. new activity
        new_mappings = [record for record in event["Records"] if check_record_type(record, "INSERT", "mapping#")]
        new_activities = [record for record in event["Records"] if check_record_type(record, "INSERT", "20")]
        
        # 3. modify mapping
        # 4. modify activity
        modified_mappings = [record for record in event["Records"] if check_record_type(record, "MODIFY", "mapping#")]
        modified_activities = [record for record in event["Records"] if check_record_type(record, "MODIFY", "20")]

        # 5. delete mapping
        # 6. delete activity
        deleted_mappings = [record for record in event["Records"] if check_record_type(record, "REMOVE", "mapping#")]
        deleted_activities = [record for record in event["Records"] if check_record_type(record, "REMOVE", "20")]
        try:
            # first process new or updated mappings
            process_new_mappings(new_mappings + modified_mappings)
            process_new_activities(new_activities)

            # then process modified activities
            process_modified_activities(modified_activities)

            # finally process deleted activities and mappings
            process_deleted_activities(deleted_activities)
            process_deleted_mappings(deleted_mappings)
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