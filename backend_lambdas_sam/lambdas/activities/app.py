import os
import json
import uuid
import requests
import re
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key, Attr
import botocore
import jwt
from jwt.exceptions import InvalidSignatureError

activities_table = None

s3 = None

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

def postActivities(user, file_format, body):
    global s3
    try:
        if not file_format or not body:
            return {
                "statusCode": 400,
                "body": "missing body content or input format",
            }
        # upload to s3
        s3_key = f"{user}/{file_format}/{datetime.today().strftime('%Y-%m-%d')}{uuid.uuid4()}.csv"
        print(f"uploading to s3 bucket, key={s3_key}")
        s3.Object(
            os.environ.get("ACTIVITIES_BUCKET", ""),
            s3_key
        ).put(Body=body)
        return {
            "statusCode": 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
            },
            "body": json.dumps({
                "data": {
                    "s3_key": s3_key
                }
            }),
        }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while processing file, see logs"
        }
    except KeyError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "missing header or request params"
        }

def getActivities(
        user: str, 
        size: int, 
        startKey : str = None, 
        category: str = None,
        orderByAmount: bool = False):
    global activities_table
    try:
        query_params = {
            "Limit": size,
            "KeyConditionExpression": Key('user').eq(user) & Key('sk').between("0000-00-00", "9999-99-99"),
            "ScanIndexForward": False
        }
        if startKey and category:
            return {
                "statusCode": 400,
                "body": "cannot have both startKey and category"
            }
        if startKey:
            query_params["ExclusiveStartKey"] = {
                "user": user,
                "sk": startKey
            }
        if category:
            # TODO: implement sort by amount DESC. this needs an LSI
            query_params["FilterExpression"] = Attr('category').eq(category)
            del query_params["Limit"]
        data = activities_table.query(
            **query_params
        )
        # should also fetch total count for page numbers
        items = data.get("Items", [])
        # filter items to only include sk that starts with date
        date_regex = re.compile(r"^\d{4}-\d{2}-\d{2}")
        # TODO: redo lastevaluatedkey to be date instead of sk
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": [{
                    **item,
                    "amount": str(item["amount"]),
                } for item in items if date_regex.match(item["sk"])],
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

def delete_activities(user: str, sk: str):
    # deletes all activites for a user, or a specific activity if sk is provided
    global activities_table
    try:
        if sk:
            activities_table.delete_item(
                Key={
                    "user": user,
                    "sk": sk
                }
            )
        else:
            print("deleting all activities")
            all_activities = activities_table.query(
                KeyConditionExpression=Key('user').eq(user) & Key('sk').between("0000-00-00", "9999-99-99")
            )
            while True:
                with activities_table.batch_writer() as batch:
                    for each in all_activities['Items']:
                        batch.delete_item(
                            Key={
                                'user': user,
                                'sk': each['sk']
                            }
                        )
                if 'LastEvaluatedKey' in all_activities:
                    all_activities = activities_table.query(
                        KeyConditionExpression=Key('user').eq(user) & Key('sk').between("0000-00-00", "9999-99-99"),
                        ExclusiveStartKey=all_activities['LastEvaluatedKey']
                    )
                else:
                    break
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": "success"
            })
        }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while fetching data, see logs"
        }

def lambda_handler(event, context):
    # processes user activities data, store in db
    # right now just pings and returns body
    global activities_table
    global s3
    if not activities_table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        activities_table = dynamodb.Table(table_name)

    if not s3:
        s3 = boto3.resource('s3')
        
    user_id = get_user_id(event)
    if not user_id:
        return {
            "statusCode": 400,
            "body": "unable to retrive user information",
        }
    print(f"got user id {user_id}")
    method = event.get("routeKey", "").split(' ')[0]
    if not method:
        print("debug: no method found in request")
        print(event)
    if method == "POST":
        params = event.get("queryStringParameters", {})
        file_format = "cap1" if not params or "format" not in params else params.get("format")
        body = event["body"]
        print(f"processing POST request")

        return postActivities(user_id, file_format, body)
    elif method == "GET":
        params = event.get("queryStringParameters", {})
        size = int(params.get("size", 0))
        nextDate = params.get("nextDate", "")
        category = params.get("category", "")
        orderByAmount = params.get("orderByAmount", False)
        print(f"processing GET request")
        return getActivities(user_id, size, nextDate, category, orderByAmount)
    elif method == "DELETE":
        params = event.get("queryStringParameters", {})
        sk = params.get("sk", "")
        print(f"processing DELETE request")
        return delete_activities(user_id, sk)
    else:
        return {
            "statusCode": 400,
            "body": "invalid method"
        }
