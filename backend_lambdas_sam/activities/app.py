from io import StringIO
import os
import csv
import uuid
import boto3
import botocore


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
    params = event["queryStringParameters"]
    file_format = "cap1" if not params or "format" not in params else params.get("format")
    # "queryStringParameters": None

    body = event["body"]

    # print(event)

    if not file_format or not body:
        return {
            "statusCode": 400,
            "body": "missing body content or input format",
        }
    
    try:
        response_body = ""
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
            response_body += '\t'.join(row)
            item = {}
            if file_format == "cap1" and len(row) >= 6:
                item = {
                    'id': str(uuid.uuid4()),
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
        return {
            "statusCode": 200,
            "body": {
                "data": response_body
            },
        }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while processing file, see logs"
        }
