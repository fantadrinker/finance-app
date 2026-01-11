
from decimal import Decimal
import os
import json
from typing import List, Tuple
import uuid
import hashlib
import csv
from datetime import datetime, date

from boto3.dynamodb.conditions import Key
import botocore

from libs import (
        Activity,
        isDuplicate,
        serialize_rbc_activity,
        serialize_cap1_activity,
        serialize_td_activity,
        serialize_default_activity,
        getMappings,
)


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


def getItemsFromBody(body, file_format: str) -> Tuple[List[Activity], str, str]:
    all_activities = []
    if file_format:
        # parse the csv
        all_activities = csv.reader(body.splitlines(), delimiter=',')
    else:
        bodyParsed = json.loads(body)
        all_activities = bodyParsed.get('data', [])

    firstRow = not file_format is None

    items = []

    start_date = date.max.strftime("%Y-%m-%d")
    end_date = date.min.strftime("%Y-%m-%d")

    for row in all_activities:
        # skips first header row
        if (file_format == "cap1" or file_format == "rbc") and firstRow:
            firstRow = False
            continue
        # format and store them in dynamodb
        item = None
        if file_format == "cap1":
            item = serialize_cap1_activity(row)
        elif file_format == "rbc":
            item = serialize_rbc_activity(row)
        elif file_format == "td":
            item = serialize_td_activity(row)
        elif not file_format:
            item = serialize_default_activity(row)
        if item:
            # first update first and last dates
            if item.date < start_date:
                start_date = item.date
            if item.date > end_date:
                end_date = item.date
            # iterate through mappings and override category if there is a match
            items.append(item)
        else:
            print("item not processed", row)
    return items, start_date, end_date


# fetches items between start_date and end_date from the database to compare
def getExistingItems(activities_table, user: str, start_date: str, end_date: str) -> List[Activity]:
    query_params = {
        "KeyConditionExpression": Key('user').eq(user) & Key('sk').between(start_date, end_date),
        "ScanIndexForward": False
    }
    data = activities_table.query(
        **query_params
    )

    return [Activity(
            sk=item["sk"],
            account=item["account"],
            date=item["date"],
            amount=Decimal(item["amount"]),
            description=item["description"],
            category=item["category"],
        ) for item in data.get("Items", [])]


# finds potential duplicates between existing items and current item
def findDuplicates(curr_item: Activity, items: List[Activity]) -> List[str]:
    return [item.sk for item in items if isDuplicate(item, curr_item)]


def postActivities(user: str, file_format: str, body, activities_table, s3, preview: bool):
    try:
        if not body:
            return {
                "statusCode": 400,
                "body": "missing body content or input format",
            }

        items, start_date, end_date = getItemsFromBody(body, file_format)

        # get the items from the same range that we already have
        existing_items = getExistingItems(activities_table, user, start_date, end_date)

        def compare_date(item: dict):
            return item.get("date", "")

        if preview:
            mappings = getMappings(user, activities_table)
            for item in items:
                item.applyMappings(mappings)
            allItems = sorted([{
                **(item.toDict()),
                "duplicate_to": findDuplicates(item, existing_items)
            } for item in items], key=compare_date, reverse=True)
            return {
                "statusCode": 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
                },
                "body": json.dumps({
                    "data": {
                        "items": allItems
                    }
                }),
            }

        chksum, s3_key = uploadToS3(
            user, file_format, body, activities_table, s3)

        with activities_table.batch_writer() as batch:
            for item in items:
                print(f"debug - writing item as batch {item.toDict()}")
                batch.put_item(
                    Item={
                        **(item.toDict()),
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
