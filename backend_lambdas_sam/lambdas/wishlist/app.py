import json
import os
import boto3
import datetime
from boto3.dynamodb.conditions import Key
import botocore
from auth_layer import get_user_id

table = None

def _deserialize_item(body):
    name = body.get("name", "")
    description = body.get("description", "")
    url = body.get("url", "")
    price = body.get("price", 0)

    if not name or not description or not url or not price:
        return None

    return {
        "item_name": name,
        "item_description": description,
        "item_url": url,
        "item_price": price,
    }


def _serialize_item(item):
    return {
        "id": item.get("sk", ""),
        "name": item.get("item_name", ""),
        "description": item.get("item_description", ""),
        "url": item.get("item_url", ""),
        "price": str(item.get("item_price", 0)),
    }


def get(user_id):
    try:
        response = table.query(
            KeyConditionExpression=Key('user').eq(
                user_id) & Key("sk").begins_with("wishlist#")
        )
        print(response)
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": [
                    _serialize_item(item) for item in response['Items']
                ],
            })
        }
    except botocore.exceptions.ClientError as e:
        print(e.response['Error']['Message'])
        return {
            "statusCode": 500,
            "body": "unable to retrive wishlist",
        }

def post(user_id, event):
    # gets item from body, generates sk with timestamp, adds to table
    body = json.loads(event.get("body", "{}"))

    if not body:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    item = _deserialize_item(body)
    if not item:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    try:
        table.put_item(
            Item={
                **item,
                "user": user_id,
                "sk": f"wishlist#{datetime.datetime.now().timestamp()}",
            }
        )
    except botocore.exceptions.ClientError as e:
        print(e.response['Error']['Message'])
        return {
            "statusCode": 500,
            "body": "unable to create wishlist",
        }

    return {
        "statusCode": 200,
        "body": "success ppost"
    }


def delete(user_id, event):
    # given item id from path parameter, delete item

    sk = event.get("queryStringParameters", {}).get("sk", "")
    if not sk:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    try:
        table.delete_item(
            Key={
                'user': user_id,
                'sk': sk
            }
        )
    except botocore.exceptions.ClientError as e:
        print(e.response['Error']['Message'])
        return {
            "statusCode": 500,
            "body": "unable to delete wishlist",
        }

    return {
        "statusCode": 200,
        "body": "success delete"
    }


def put(user_id, event):
    # given item id from query parameter, update item
    sk = event.get("queryStringParameters", {}).get("sk", "")
    if not sk:
        return {
            "statusCode": 400,
            "body": "item key not provided",
        }

    body = json.loads(event.get("body", "{}"))

    if not body:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    item = _deserialize_item(body)
    if not item:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    try:
        table.update_item(
            Key={
                'user': user_id,
                'sk': sk
            },
            UpdateExpression="set item_name=:n, item_description=:d, item_url=:u, item_price=:p",
            ExpressionAttributeValues={
                ':n': item.get("item_name", ""),
                ':d': item.get("item_description", ""),
                ':u': item.get("item_url", ""),
                ':p': item.get("item_price", 0)
            },
            ReturnValues="UPDATED_NEW"
        )
    except botocore.exceptions.ClientError as e:
        print(e.response['Error']['Message'])
        return {
            "statusCode": 500,
            "body": "unable to update wishlist",
        }

    return {
        "statusCode": 200,
        "body": "success put"
    }


def lambda_handler(event, context):
    global table
    user_id = get_user_id(event)

    print("debug", event, context)
    if not user_id:
        return {
            "statusCode": 400,
            "body": "unable to retrive user information",
        }
    if not table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        table = dynamodb.Table(table_name)

    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "GET":
        return get(user_id)
    elif method == "POST":
        return post(user_id, event)
    elif method == "DELETE":
        return delete(user_id, event)
    elif method == "PUT":
        return put(user_id, event)
    else:
        return {
            "statusCode": 400,
            "body": "unknown method",
        }
