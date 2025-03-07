import os
import json
import boto3
from boto3.dynamodb.conditions import Key
import botocore
from auth_layer import get_user_id

activities_table = None


def lambda_handler(event, context):
    global activities_table
    user_id = get_user_id(event)
    params = event.get("queryStringParameters", {})

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
            "Select": "SPECIFIC_ATTRIBUTES",
        }
        paramsSize = int(params.get("size", 0))
        if paramsSize > 0:
            query_params["Limit"] = paramsSize
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
