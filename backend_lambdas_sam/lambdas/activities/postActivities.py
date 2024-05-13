
import os
import json
import uuid
import hashlib
import csv
from datetime import datetime, date

import botocore

from libs import serialize_rbc_activity, serialize_cap1_activity


def uploadToS3(user: str, file_format: str, body, activities_table, s3):
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
    return s3_key, chksum


def getItemsFromFile(file_format: str, body):

    # parse the csv
    csv_reader = csv.reader(body.splitlines(), delimiter=',')
    firstRow = True

    items = []

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
            item['description'] = item['category'] if not item['description'] else item['description']
            item['search_term'] = item['description'].lower(
            ) if item['description'] else 'Other'
            # iterate through mappings and override category if there is a match
            items.append(item)
    return items, start_date, end_date


def postActivities(user: str, file_format: str, body, activities_table, s3, preview: bool):
    try:
        if not file_format or not body:
            return {
                "statusCode": 400,
                "body": "missing body content or input format",
            }

        items, start_date, end_date = getItemsFromFile(file_format, body)

        if preview:
            return {
                "statusCode": 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
                },
                "body": json.dumps({
                    "data": {
                        "items": items
                    }
                }),
            }

        chksum, s3_key = uploadToS3(
            user, file_format, body, activities_table, s3)

        with activities_table.batch_writer() as batch:
            for item in items:
                batch.put_item(
                    Item={
                        **item,
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
