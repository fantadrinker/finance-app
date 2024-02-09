import os
from functools import reduce
import json
import uuid
import re
from datetime import date, datetime, timedelta
import hashlib
import csv
from decimal import Decimal

import requests
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

def serialize_rbc_activity(row):
    if len(row) < 7:
        return None

    if not row[6] or row[6] == "0":
        print("skipping row")
        return None

    date_str = datetime.strptime(
        row[2], "%m/%d/%Y").strftime("%Y-%m-%d")
    amount = 0 - Decimal(row[6])
    return {
        'sk': date_str + str(uuid.uuid4()),
        'account': f"{row[1]}-{row[0]}",
        'date': date_str,
        'description': row[5],
        'category': row[4],  # in the future we should get this
        'amount': amount  # need to flip sign, rbc uses negative val for expense
    }


def serialize_cap1_activity(row):
    if len(row) < 6:
        return None

    date_str = datetime.strptime(
        row[0], "%Y-%m-%d").strftime("%Y-%m-%d")
    amount = Decimal(row[5]) if row[5] else 0 - Decimal(row[6])
    return {
        'sk': date_str + str(uuid.uuid4()),
        # concat uuid with date to make unique keys but also keep date ordering
        'date': date_str,
        'account': row[2],
        'description': row[3],
        'category': row[4],
        'amount': amount
    }

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

        chksum = hashlib.md5(body.encode('utf-8')).hexdigest()
        chksum_entry = activities_table.get_item(
            Key={'user': user, 'sk': f"chksum#{chksum}"})
        if 'Item' in chksum_entry:
            print('skipping duplicate file')
            return {
                'statusCode': 200,
                'body': json.dumps('skipping duplicate file')
            }
        # parse the csv
        csv_reader = csv.reader(body.splitlines(), delimiter=',')
        firstRow = True
        with activities_table.batch_writer() as batch:
            # these two to keep track of the earliest and latest dates in the file

            start_date = date.max.strftime("%Y-%m-%d")
            end_date = date.min.strftime("%Y-%m-%d")

            for row in csv_reader:
                # skips first header row
                if firstRow:
                    firstRow = False
                    continue
                # format and store them in dynamodb
                item = {}
                if file_format == "cap1":
                    item = serialize_cap1_activity(row)
                elif file_format == "rbc":
                    item = serialize_rbc_activity(row)
                if item:
                    # first update first and last dates
                    if item['date'] < start_date:
                        start_date = item['date']
                    if item['date'] > end_date:
                        end_date = item['date']
                    # iterate through mappings and override category if there is a match
                    batch.put_item(
                        Item={
                            **item,
                            'description': item['category'] if not item['description'] else item['description'],
                            'user': user,
                            'chksum': chksum,
                        }
                    )
            # store the checksum
            batch.put_item(
                Item={
                    'sk': f"chksum#{chksum}",
                    'user': user,
                    'date': datetime.now().strftime("%Y-%m-%d"),
                    'checksum': chksum,
                    'file': s3_key,
                    'start_date': start_date,
                    'end_date': end_date
                }
            )
            # TODO: also put in a notification item for the user, so they can see the file was processed
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
    
def getMappings(user: str):
    global activities_table
    response = activities_table.query(
        KeyConditionExpression=Key("user").eq(user) & Key("sk").begins_with("mapping#"),
    )
    all_mappings = response.get("Items", [])
    
    while response.get("LastEvaluatedKey"):
        response = activities_table.query(
            KeyConditionExpression=Key("user").eq(user) & Key("sk").begins_with("mapping#"),
            ExclusiveStartKey=response["LastEvaluatedKey"]
        )
        all_mappings.extend(response.get("Items", []))
    
    return all_mappings

def applyMappings(mappings: list, item: dict):
    itemDesc = item.get("description", "")
    itemCategory = item.get("category", itemDesc) # if category is not set, use description
    return {
        **item,
        "category": next((mapping["category"] for mapping in mappings if mapping["description"] in itemDesc), itemCategory)
    }


def getActivities(
        user: str,
        size: int,
        startKey: str = None,
        category: str = None,
        description: str = None,
        orderByAmount: bool = False,
        account: str = None,
        amountMax: int = None,
        amountMin: int = None):
    global activities_table
    try:
        query_params = {
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
        filter_exps = []
        noLimit = False

        mappings = getMappings(user)
        
        if description:
            filter_exps.append(Attr('description').contains(description))
            noLimit = True

        if account:
            filter_exps.append(Attr('account').eq(account))
            noLimit = True
        
        if amountMax:
            filter_exps.append(Attr('amount').lte(int(amountMax)))
            noLimit = True
        
        if amountMin:
            filter_exps.append(Attr('amount').gte(int(amountMin)))
            noLimit = True

        if filter_exps:
            query_params["FilterExpression"] = reduce(lambda x, y: x & y, filter_exps)
        
        if not noLimit and size > 0:
            query_params["Limit"] = size
        
        data = activities_table.query(
            **query_params
        )
        # should also fetch total count for page numbers
        items = data.get("Items", [])
        lastKey = data.get("LastEvaluatedKey", {})
        
        while lastKey and noLimit:
            data = activities_table.query(
                **query_params,
                ExclusiveStartKey=lastKey
            )
            items.extend(data.get("Items", []))
            lastKey = data.get("LastEvaluatedKey", {})
        # filter items to only include sk that starts with date
        date_regex = re.compile(r"^\d{4}-\d{2}-\d{2}")
        # TODO: redo lastevaluatedkey to be date instead of sk

        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": [{
                    **applyMappings(mappings, item),
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


RELATED_ACTIVITY_TIMEDELTA = 7


def getRelatedActivities(user: str, sk: str):
    global activities_table
    print("getting related activities for sk", sk)
    try:
        # get the date from the sk
        record = activities_table.get_item(
            Key={
                "user": user,
                "sk": sk
            }
        )

        if not record.get("Item"):
            return {
                "statusCode": 404,
                "body": "no record found"
            }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while fetching data, see logs"
        }

    date = datetime.strptime(record["Item"]["date"], "%Y-%m-%d")
    amount = record["Item"]["amount"]

    print("got item", record["Item"])

    begin_find_date = (date - timedelta(days=RELATED_ACTIVITY_TIMEDELTA)).strftime(
        "%Y-%m-%d")
    end_find_date = (date + timedelta(days=RELATED_ACTIVITY_TIMEDELTA)).strftime(
        "%Y-%m-%d")

    try:
        duplicate_responses = activities_table.query(
            KeyConditionExpression=Key("user").eq(
                user) & Key("sk").between(begin_find_date, end_find_date),
            FilterExpression=Attr("amount").eq(amount)
        )
        # print("got duplicate responses", duplicate_responses)

        opposite_responses = activities_table.query(
            KeyConditionExpression=Key("user").eq(
                user) & Key("sk").between(begin_find_date, end_find_date),
            FilterExpression=Attr("amount").eq(-amount)
        )
        # print("got opposite responses", opposite_responses)

        responses = [{
            **x,
            "amount": str(x["amount"]),
            "duplicate": True
        } for x in duplicate_responses["Items"] if x["sk"] != sk] + [{
            **x,
            "amount": str(x["amount"]),
            "opposite": True
        } for x in opposite_responses["Items"] if x["sk"] != sk]
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": responses
            })
        }
    except botocore.exceptions.ClientError as error:
        print("error fetching related activities", error)
        return {
            "statusCode": 500,
            "body": "client error happened while fetching data, see logs"
        }


def getEmptyDescriptionActivities(user_id, size):
    global activities_table
    empty_description_activities = activities_table.query(
        KeyConditionExpression=Key('user').eq(user_id) & Key(
            'sk').between("0000-00-00", "9999-99-99"),
        FilterExpression=Attr('description').eq(''),
        Limit=size if size else 10
    )
    return {
        "statusCode": 200,
        "body": json.dumps({
            "data": [{
                **item,
                "amount": str(item["amount"]),
            } for item in empty_description_activities["Items"]]
        })
    }

def getActivitiesForCategory(user_id, category):
    global activities_table
    mappings = getMappings(user_id)
    descs = [x["description"] for x in mappings if x["category"] == category]
    print(111, descs)
    filterExps = Attr('category').eq(category)
    if descs:
        filterExps = filterExps | Attr('description').is_in(descs)
    print(222, filterExps)
    category_activities = activities_table.query(
        KeyConditionExpression=Key('user').eq(user_id) & Key(
            'sk').between("0000-00-00", "9999-99-99"),
        FilterExpression=filterExps,
    )
    return {
        "statusCode": 200,
        "body": json.dumps({
            "data": [{
                **applyMappings(mappings, item),
                "amount": str(item["amount"]),
            } for item in category_activities["Items"]],
            "count": category_activities.get("Count", 0),
        })
    }

def delete_activities(user: str, sk: str):
    # deletes all activites for a user, or a specific activity if sk is provided
    global activities_table
    count = 0
    try:
        if sk:
            response = activities_table.delete_item(
                Key={
                    "user": user,
                    "sk": sk
                },
                ReturnValues="ALL_OLD"
            )
            row = response.get("Attributes", {})
            
            # now soft delete the row by adding 'deleted#' in front
            # of it's sk
            activities_table.put_item(Item={
                **row,
                "sk": f"deleted#{sk}"
            })
            count = 1
        else:
            print("deleting all activities")
            all_activities = activities_table.query(
                KeyConditionExpression=Key('user').eq(user) & Key(
                    'sk').between("0000-00-00", "9999-99-99")
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
                        count += 1
                if 'LastEvaluatedKey' in all_activities:
                    all_activities = activities_table.query(
                        KeyConditionExpression=Key('user').eq(user) & Key(
                            'sk').between("0000-00-00", "9999-99-99"),
                        ExclusiveStartKey=all_activities['LastEvaluatedKey']
                    )
                else:
                    break
        return {
            "statusCode": 200,
            "body": json.dumps({
                "count": count,
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
    print(event)
    method = event.get("routeKey", "").split(' ')[0]
    if not method:
        print("debug: no method found in request")
        print(event)
    if method == "POST":
        params = event.get("queryStringParameters", {})
        file_format = "cap1" if not params or "format" not in params else params.get(
            "format")
        body = event["body"]
        print(f"processing POST request")

        return postActivities(user_id, file_format, body)
    elif method == "GET":
        params = event.get("queryStringParameters", {})
        print("processing GET request")

        checkRelated = params.get("related", False)
        if checkRelated:
            return getRelatedActivities(user_id, checkRelated)

        size = int(params.get("size", 0))
        nextDate = params.get("nextDate", "")
        category = params.get("category", "")
        description = params.get("description", "")
        orderByAmount = params.get("orderByAmount", False)
        account = params.get("account", "")
        amountMax = params.get("amountMax", None)
        amountMin = params.get("amountMin", None)

        checkEmpty = params.get("emptyDescription", False)
        if checkEmpty:
            return getEmptyDescriptionActivities(user_id, size)

        if category:
            return getActivitiesForCategory(user_id, category)
        return getActivities(
            user_id,
            size,
            nextDate,
            category,
            description,
            orderByAmount,
            account,
            amountMax,
            amountMin)
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
