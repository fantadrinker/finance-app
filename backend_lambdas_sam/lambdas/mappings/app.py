import json
import os
import boto3
import datetime
from boto3.dynamodb.conditions import Key
import botocore
from AuthLayer import get_user_id

table = None

def post(user, description, category, priority):
    global table
    # creates "user: user, sk: mapping#desc, description: description, category: category, priority: priority"
    if not table:
        return
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
                    "created_at": str(datetime.datetime.now())
                }
            )
        # TODO: update the activities rows here
        return {
            "statusCode": 201,
            "body": "success",
        }
    except botocore.exceptions.ClientError as error:
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
        return
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
            sk = mapping.get("sk", "")
            priority = mapping.get("priority", 0)

            found_category = [item for item in group_by_categories if item["category"] == category]
            if found_category:
                found_category[0]["descriptions"].append({
                    "description": description,
                    "priority": str(priority),
                    "sk": sk
                })
            else:
                group_by_categories.append({
                    "category": category,
                    "descriptions": [{
                        "description": description,
                        "priority": str(priority),
                        "sk": sk
                    }]
                })


        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": group_by_categories
            })
        }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while getting mapping, see logs"
        }

def delete(user, id):
    global table
    if not table:
        return
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
    except botocore.exceptions.ClientError as error:
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