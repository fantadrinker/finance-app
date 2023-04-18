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
        decoded_token = jwt.decode(token, key=key, algorithms=["RS256"], audience=audiences)
        
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
    except:
        return ""


def post(user, description, category, priority):
    global table
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
    global table
    try:
        response = table.query(
            KeyConditionExpression=Key("user").eq(user) & Key("sk").begins_with("mapping#"),
        )
        # TODO: handle pagination
        if response.get("LastEvaluatedKey"):
            print("pagination not supported yet")
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": [{
                    **item,
                    "priority": int(item.get("priority", 0)),
                } for item in response.get("Items", [])]
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