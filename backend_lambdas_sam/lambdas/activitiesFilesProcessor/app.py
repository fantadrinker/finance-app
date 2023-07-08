import json
import boto3
import uuid
import csv
import hashlib
import os
import re
from datetime import date, datetime
from decimal import Decimal
from urllib.parse import unquote_plus
from boto3.dynamodb.conditions import Key

activities_table = None
s3 = None

def lambda_handler(event, context):
    global activities_table
    global s3

    if not activities_table:
        dynamodb = boto3.resource('dynamodb')
        activities_table = dynamodb.Table(os.environ.get('ACTIVITIES_TABLE', ''))

    if not s3:
        s3 = boto3.resource('s3')

    # for some reason the key in event is url encoded, but the actual key is not
    s3_key = unquote_plus(event['Records'][0]['s3']['object']['key'])
    user_id = s3_key.split('/')[0]
    file_format = s3_key.split('/')[1]

    print(f"processing uploaded file {s3_key}")
    try:
        # grab the s3 file
        s3_response = s3.Object(
            os.environ.get('ACTIVITIES_BUCKET', ''),
            s3_key
        ).get()
        s3_body = s3_response['Body'].read()
        chksum = hashlib.md5(s3_body).hexdigest()
        body_decoded = s3_body.decode('utf-8')
        chksum_entry = activities_table.get_item(Key={'user': user_id, 'sk': f"chksum#{chksum}"})
        if 'Item' in chksum_entry:
            print('skipping duplicate file')
            return {
                'statusCode': 200,
                'body': json.dumps('skipping duplicate file')
            }
        # parse the csv

        mappings = {}
        mappings_response = activities_table.query(
            KeyConditionExpression=Key('user').eq(user_id) & Key('sk').begins_with('mapping#')
        )
        for item in mappings_response['Items']:
            if item['description'] not in mappings:
                mappings[item['description']] = item['category']

        csv_reader = csv.reader(body_decoded.splitlines(), delimiter=',')
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
                if file_format == "cap1" and len(row) >= 6:
                    date_str = datetime.strptime(row[0], "%Y-%m-%d").strftime("%Y-%m-%d")
                    amount = Decimal(row[5]) if row[5] else 0 - Decimal(row[6])
                    item = {
                        'sk': date_str + str(uuid.uuid4()), 
                        # concat uuid with date to make unique keys but also keep date ordering
                        'user': user_id,
                        'date': date_str,
                        'account': row[2],
                        'description': row[3],
                        'category': row[4],
                        'amount': amount
                    }
                elif file_format == "rbc" and len(row) >= 7:
                    if not row[6] or row[6] == "0":
                        print('skipping row with no transaction amount, might be a usd transaction')
                        continue
                    date_str = datetime.strptime(row[2], "%m/%d/%Y").strftime("%Y-%m-%d")
                    amount = 0 - Decimal(row[6])
                    item = {
                        'sk': date_str + str(uuid.uuid4()),
                        'user': user_id,
                        'account': f"{row[1]}-{row[0]}",
                        'date': date_str,
                        'description': row[5],
                        'category': row[4], # in the future we should get this
                        'amount' : amount # need to flip sign, rbc uses negative val for expense
                    }
                if item:
                    # first update first and last dates
                    if item['date'] < start_date:
                        start_date = item['date']
                    if item['date'] > end_date:
                        end_date = item['date']
                    # iterate through mappings and override category if there is a match
                    for key in mappings:
                        if re.search(key, item["description"]):
                            print(f"found mapping, overriding {item['category']} with {mappings[key]}")
                            item["category"] = mappings[key]
                            break
                    batch.put_item(
                        Item={
                            **item,
                            'chksum': chksum,
                        }
                    )
            # store the checksum
            batch.put_item(
                Item={
                    'sk': f"chksum#{chksum}",
                    'user': user_id,
                    'date': datetime.now().strftime("%Y-%m-%d"),
                    'checksum': chksum,
                    'file': s3_key,
                    'start_date': start_date,
                    'end_date': end_date
                }
            )
            # TODO: also put in a notification item for the user, so they can see the file was processed
    except Exception as e:
        print('error: getting s3 object', e)
        return {
            'statusCode': 500,
            'body': json.dumps('Error getting s3 object')
        }
    print(f"finished uploading file {s3_key}")
    return {
        'statusCode': 200,
        'body': json.dumps('success')
    }