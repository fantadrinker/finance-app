import json
import os
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from auth_layer import get_user_id

table = None

MAPPING_TIMESTAMP_FORMAT = '%Y-%m-%d %H:%M:%S'

def post(user, description, category, priority):
    global table
    if not table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        table = dynamodb.Table(table_name)
    # creates "user: user, sk: mapping#desc, description: description, category: category, priority: priority"
    try:
        # first see if the mapping already exists
        response = table.get_item(
            Key={
                "user": user,
                "sk": f'mapping#{description}',
            }
        )
        if response.get("Item"):
            # if already exist, then update the mapping
            table.update_item(
                Key={
                    "user": user,
                    "sk": f'mapping#{description}',
                },
                UpdateExpression="set category = :c, priority = :p",
                ExpressionAttributeValues={
                    ":c": category,
                    ":p": priority,
                },
                ReturnValues="UPDATED_NEW"
            )
        else:
            table.put_item(
                Item={
                    "user": user,
                    "sk": f'mapping#{description}',
                    "description": description,
                    "category": category,
                    "priority": priority,
                    "created_at": datetime.strftime(datetime.now(), MAPPING_TIMESTAMP_FORMAT)
                }
            )
        # TODO: update the activities rows here
        return {
            "statusCode": 201,
            "body": "success",
        }
    except ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while creating mapping, see logs"
        }
    except:
        return {
            "statusCode": 400,
            "body": "unable to create mapping",
        }


def get(user):
    # returns a list of unique category names
    global table
    if not table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        table = dynamodb.Table(table_name)
    try:
        response = table.query(
            KeyConditionExpression=Key("user").eq(user) & Key("sk").begins_with("mapping#"),
        )
        all_mappings = response.get("Items", [])

        while response.get("LastEvaluatedKey"):
            response = table.query(
                KeyConditionExpression=Key("user").eq(user) & Key("sk").begins_with("mapping#"),
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            all_mappings.extend(response.get("Items", []))

        # now try to group the mappings by category
        group_by_categories = []
        for mapping in all_mappings:
            category = mapping.get("category", "")
            description = mapping.get("description", "")
            creation_date_str = mapping.get("created_at", "")
            creation_date = datetime.strptime(creation_date_str, MAPPING_TIMESTAMP_FORMAT) if creation_date_str else None
            sk = mapping.get("sk", "")
            priority = mapping.get("priority", 0)

            found_category = [item for item in group_by_categories if item["category"] == category]
            if found_category:
                if creation_date is not None and creation_date > found_category[0]["last_update_time"]:
                    found_category[0]["last_update_time"] = creation_date
                found_category[0]["descriptions"].append({
                    "description": description,
                    "priority": str(priority),
                    "sk": sk
                })
            else:
                group_by_categories.append({
                    "category": category,
                    "last_update_time": creation_date,
                    "descriptions": [{
                        "description": description,
                        "priority": str(priority),
                        "sk": sk
                    }]
                })

        group_by_categories.sort(key=lambda x: x["last_update_time"], reverse=True)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": [{
                    "category": category["category"],
                    "descriptions": category["descriptions"]
                } for category in group_by_categories]
            })
        }

    except ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while getting mapping, see logs"
        }

def delete(user, id):
    global table

    if not table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        table = dynamodb.Table(table_name)

    try:
        response = table.delete_item(
            Key={
                "user": user,
                "sk": id
            }
        )
        print(response)
        # TODO: update the activities rows here
        return {
            "statusCode": 200,
            "body": "success",
        }
    except ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while deleting mapping, see logs"
        }
    except:
        return {
            "statusCode": 400,
            "body": "unable to delete mapping",
        }

def lambda_handler(event, context):
    global table
    user_id = get_user_id(event)

    if not user_id:
        return {
            "statusCode": 400,
            "body": "unable to retrive user information",
        }
    if not table:
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(os.environ.get("ACTIVITIES_TABLE", ""))
    method = event.get("routeKey", "").split(' ')[0]
    # should support 3 functionalities
    # post: create or update description to category mapping
    #       takes in a json body with description and category,
    #       and potentially a priority
    # get: get all the mappings defined for the user, paginated
    # delete: delete a mapping for a given list of ids
    if method == "POST":
        body = json.loads(event.get("body", "{}"))
        description = body.get("description", "")
        category = body.get("category", "")
        priority = body.get("priority", 0)
        return post(
            user_id,
            description,
            category,
            priority)
    elif method == "GET":
        return get(user_id)
    elif method == "DELETE":
        ids = event.get("queryStringParameters", {}).get("id", "")
        return delete(user_id, ids)
    else:
        return {
            "statusCode": 400,
            "body": "method not allowed",
        }
