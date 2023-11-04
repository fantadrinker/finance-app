import os
import requests
import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
import botocore
import jwt
from jwt.exceptions import InvalidSignatureError

activities_table = None


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
    except:
        return ""


def get(user_id, starting_date=None, ending_date=None, categories=None):
    global activities_table
    # for user, get summary for each category in each month
    # and return the list of categories
    # or for now just get from existing activities table instead
    try:
        params = {
            "KeyConditionExpression": Key("user").eq(user_id) & Key("sk").begins_with("insights#"),
        }
        if starting_date and ending_date:
            params["KeyConditionExpression"] = Key("user").eq(user_id) & Key(
                "sk").between(f"insights#{starting_date}", f"insights#{ending_date}")
        elif starting_date:
            params["KeyConditionExpression"] = Key("user").eq(
                user_id) & Key("sk").gte(f"insights#{starting_date}")
        elif ending_date:
            params["KeyConditionExpression"] = Key("user").eq(
                user_id) & Key("sk").lte(f"insights#{ending_date}")
        if categories:
            params["FilterExpression"] = Attr("category").is_in(categories)
        response = activities_table.query(
            **params
        )
        items = response.get("Items", [])
        # checks if there are more items to be fetched
        while response.get("LastEvaluatedKey"):
            more_response = activities_table.query(
                KeyConditionExpression=Key("user").eq(
                    user_id) & Key("sk").begins_with("insights#"),
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(more_response.get("Items", []))
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": items
            })
        }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while processing file, see logs"
        }


def lambda_handler(event, context):
    global activities_table
    if not activities_table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        activities_table = dynamodb.Table(table_name)
    user_id = get_user_id(event)

    if not user_id:
        return {
            "statusCode": 400,
            "body": "unable to retrive user information",
        }
    method = event.get("routeKey", "").split(' ')[0]
    if method == "GET":
        query_params = event.get("queryStringParameters", {})
        # need to do some request validation here
        return get(
            user_id,
            query_params.get("starting_date", None),
            query_params.get("ending_date", None),
            query_params.get("categories", None))  # need to get from multivalue query params
    else:
        return {
            "statusCode": 400,
            "body": "method not allowed",
        }
