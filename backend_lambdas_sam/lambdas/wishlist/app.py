import json
import os
import boto3
import datetime
import requests
import jwt
from jwt.exceptions import InvalidSignatureError
from boto3.dynamodb.conditions import Key
import botocore

table = None
# handle auth tokens


def verify_token_with_jwks(token, jwks_url, audiences):
    # Get the JSON Web Key Set from the provided URL
    jwks = requests.get(jwks_url).json()

    # Extract the public key from the JSON Web Key Set
    key = jwt.algorithms.RSAAlgorithm.from_jwk(jwks["keys"][0])

    try:
        # Verify the token using the extracted public key
        decoded_token = jwt.decode(token, key=key, algorithms=[
                                   "RS256"], audience=audiences)

        # If the token was successfully verified, return the decoded token
        return decoded_token
    except InvalidSignatureError:
        # If the token could not be verified, raise an exception
        raise ValueError("Token verification failed.")


def get_user_id(event):
    if os.environ.get("SKIP_AUTH", "") == "1":
        # for local testing
        return event.get("headers", {}).get("authorization", "")
    try:
        url_base = os.environ.get("BASE_URL", "")
        jwks_url = f"{url_base}/.well-known/jwks.json"
        audiences = [
            f"{url_base}/api/v2/",
            f"{url_base}/userinfo"
        ]
        token = event.get("headers", {}).get("authorization", "")

        decoded = verify_token_with_jwks(token, jwks_url, audiences)
        return decoded.get("sub", "")
    except Exception as e:
        print("error decoding user id", e)
        return ""


def _serialize_item(body):
    name = body.get("name", "")
    description = body.get("description", "")
    url = body.get("url", "")
    price = body.get("price", 0)

    if not name or not description or not url or not price:
        return None

    return {
        "name": name,
        "description": description,
        "url": url,
        "price": price,
    }


def get(user_id):
    try:
        response = table.query(
            KeyConditionExpression=Key('user').eq(
                user_id) & Key("sk").begins_with("mapping#")
        )
        print(response)
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": [
                    {
                        **item,
                        "price": str(item["price"])
                    } for item in response['Items']
                ],
            })
        }
    except botocore.exceptions.ClientError as e:
        print(e.response['Error']['Message'])
        return {
            "statusCode": 500,
            "body": "unable to retrive wishlist",
        }

    return {
        "statusCode": 200,
        "body": json.dumps({
            "data": response.get("Items", []),
        })
    }


def post(user_id, event):
    # gets item from body, generates sk with timestamp, adds to table
    body = json.loads(event.get("body", "{}"))

    if not body:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    item = _serialize_item(body)
    if not item:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    try:
        table.put_item(
            Item={
                **item,
                "pk": user_id,
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

    sk = event.get("path", {}).get("sk", "")
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
    sk = event.get("queryParams", {}).get("sk", "")
    if not sk:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    body = json.loads(event.get("body", "{}"))

    if not body:
        return {
            "statusCode": 400,
            "body": "invalid body",
        }

    item = _serialize_item(body)
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
            UpdateExpression="set name=:n, description=:d, url=:u, price=:p",
            ExpressionAttributeValues={
                ':n': item.get("name", ""),
                ':d': item.get("description", ""),
                ':u': item.get("url", ""),
                ':p': item.get("price", 0)
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
