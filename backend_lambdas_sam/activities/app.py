from io import StringIO
import os
import csv
import json
import uuid
import requests
import hashlib
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key, Attr
import botocore
import jwt
from jwt.exceptions import InvalidSignatureError


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
    # how: for each file uploaded, store a checksum in a database table
    # this way we know when user uploads a duplicate file
    try:
        if not file_format or not body:
            return {
                "statusCode": 400,
                "body": "missing body content or input format",
            }
    
        f = StringIO(body)
        reader = csv.reader(f, delimiter=',')
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        activities_table = dynamodb.Table(table_name)
        firstRow = True
        for row in reader:
            # skips first header row
            if firstRow:
                firstRow = False
                continue
            # format and store them in dynamodb
            item = {}
            if file_format == "cap1" and len(row) >= 6:
                item = {
                    'id': str(uuid.uuid4()),
                    'user': user,
                    'date': row[0],
                    'account': row[2],
                    'description': row[3],
                    'category': row[4],
                    'amount': row[5]
                }
            if item:
                activities_table.put_item(
                    Item=item
                )
        chksum_table_name = os.environ.get("FILECHECK_TABLE", "")
        chksum_table = dynamodb.Table(chksum_table_name)
        chksum_table.put_item(
            Item={
                'user': user,
                'chksum': hashlib.md5(body.encode('utf-8')).hexdigest(),
                'date': datetime.today().strftime('%Y-%m-%d')
            }
        )
        return {
            "statusCode": 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
            },
            "body": json.dumps({
                "data": "success"
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

def getActivities(user: str, size: int, startKey: dict):
    try:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        activities_table = dynamodb.Table(table_name)
        query_params = {
            "Limit": size,
            "KeyConditionExpression": Key('user').eq(user),
            "ScanIndexForward": False
        }
        if startKey:
            query_params["ExclusiveStartKey"] = startKey
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

def lambda_handler(event, context):
    """Sample pure Lambda function

    Parameters
    ----------
    event: dict, required
        API Gateway Lambda Proxy Input Format

        Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format

    context: object, required
        Lambda Context runtime methods and attributes

        Context doc: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    Returns
    ------
    API Gateway Lambda Proxy Output Format: dict

        Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """

    # processes user activities data, store in db
    # right now just pings and returns body
    """
    POST /activities?format=<format>
        param:
        - format: cap1 or rbc
        body: csv file exported from either cap1 or RBC
        response: body: formatted data with following columns 
        date, account, description, category, amount
    """ 
    user_id = get_user_id(event)
    
    if not user_id:
        return {
            "statusCode": 400,
            "body": "unable to retrive user information",
        }
    print(f"got user id {user_id}")
    method = event.get("routeKey", "").split(' ')[0]
    if method == "POST":
        params = event["queryStringParameters"]
        file_format = "cap1" if not params or "format" not in params else params.get("format")
        body = event["body"]
        print(f"processing POST request")

        return postActivities(user_id, file_format, body)
    elif method == "GET":
        params = event["queryStringParameters"]
        size = int(params.get("size", 0))
        startKey = params.get("startKey", {})
        print(f"processing GET request")
        return getActivities(user_id, size, startKey)
    else:
        return {
            "statusCode": 400,
            "body": "invalid method"
        }
