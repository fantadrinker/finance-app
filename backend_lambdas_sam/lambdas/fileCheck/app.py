import os
import requests
import json
import boto3
from boto3.dynamodb.conditions import Key
import botocore
import jwt
from jwt.exceptions import InvalidSignatureError

activities_table = None
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
    except:
        return ""


def lambda_handler(event, context):
    global activities_table
    user_id = get_user_id(event)

    if not user_id:
        return {
            "statusCode": 400,
            "body": "unable to retrive user information",
        }
    if not activities_table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        activities_table = dynamodb.Table(table_name)
    try:
        query_params = {
            "KeyConditionExpression": Key('user').eq(user_id) & Key('sk').begins_with('chksum#'),
            "ProjectionExpression": "checksum, start_date, end_date",
            "Select": "SPECIFIC_ATTRIBUTES"
        }
        data = activities_table.query(
            **query_params
        )
        print(f"data retrieved {data}")
        # should also fetch total count for page numbers
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": data.get("Items", []),
                "count": data.get("Count", 0),
                "LastEvaluatedKey": data.get("LastEvaluatedKey", {})
            })
        }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while fetching data, see logs"
        }
