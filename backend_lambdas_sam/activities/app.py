import json
from io import StringIO
import csv
import boto3


# import requests


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

    input_format = event.get("queryStringParameters", {}).get("format", None)

    body = event["body"]

    if not input_format or not body:
        return {
            "statusCode": 400,
            "body": "missing body content or input format",
        }
    response_body = ""
    f = StringIO(body)
    reader = csv.reader(f, delimiter=',')
    dynamodb = boto3.resource("dynamodb")
    table_name = "activities"
    activities_table = dynamodb.Table(table_name)
    
    for row in reader:
        # format and store them in dynamodb

        response_body += '\t'.join(row)

    return {
        "statusCode": 200,
        "body": response_body,
    }
