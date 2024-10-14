import simplejson as json
import boto3
import re
import os
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr

table = None
# this lambda is meant to be invoked manually, to check if

def lambda_handler(event, context):
    global table
    # This function fetches all mappings and activities items and checks if activities item matches the mapping
    if not table:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get("ACTIVITIES_TABLE", ""))
    try:
        response = table.scan(
            FilterExpression=Attr('sk').begins_with('mapping#')
        )
        all_mappings = response['Items']
        nextKey = response.get('LastEvaluatedKey')
        processed_rows = 0
        while nextKey and processed_rows < os.environ.get("MAX_ROWS", 10000):
            response = table.scan(
                FilterExpression=Attr('sk').begins_with('mapping#'),
                ExclusiveStartKey=nextKey
            )
            all_mappings.extend(response['Items'])
            nextKey = response.get('LastEvaluatedKey')
            processed_rows += len(response['Items'])
        if nextKey:
            print("max rows reached, stopping")
        user_mappings = {}
        for item in all_mappings:
            user = item['user']
            if user not in user_mappings:
                user_mappings[user] = [item]
            else:
                user_mappings[user].append(item)
        # then we fetch all activities items
        response = table.scan(
            FilterExpression=Attr('sk').begins_with('20')
        )
        activities = response['Items']
        nextKey = response.get('LastEvaluatedKey')
        processed_rows = 0
        user_insights_dict = {}
        while nextKey and processed_rows < os.environ.get("MAX_ROWS", 10000):
            response = table.scan(
                FilterExpression=Attr('sk').begins_with('20'),
                ExclusiveStartKey=nextKey
            )
            activities.extend(response['Items'])
            nextKey = response.get('LastEvaluatedKey')
            processed_rows += len(response['Items'])
        if nextKey:
            print("max rows reached, stopping")

        for activity in activities:
            user = activity['user']
            if user in user_mappings:
                for mapping in user_mappings[user]:
                    desc = activity['description']
                    cat = activity['category']
                    if re.search(mapping['description'], desc):
                        if cat == mapping['category']:
                            break
                        # update activity with correct category
                        table.update_item(
                            Key={
                                'user': user,
                                'sk': activity['sk']
                            },
                            UpdateExpression="set category = :c",
                            ExpressionAttributeValues={
                                ':c': mapping['category']
                            }
                        )
                        break
            if user not in user_insights_dict:
                user_insights_dict[user] = {}
            month = datetime.strptime(activity['date'], "%Y-%m-%d").strftime("%Y-%m")
            if month not in user_insights_dict[user]:
                user_insights_dict[user][month] = {}
            if activity['category'] not in user_insights_dict[user][month]:
                user_insights_dict[user][month][activity['category']] = activity['amount']
            else:
                user_insights_dict[user][month][activity['category']] += activity['amount']

        print("finished processing activities", user_insights_dict)
        # then we update the insights table
        for user in user_insights_dict:
            for month in user_insights_dict[user]:
                # first check if item exists
                response = table.query(
                    KeyConditionExpression=Key('user').eq(user) & Key('sk').eq('insights#' + month)
                )
                if len(response['Items']) == 0:
                    # create item
                    table.put_item(
                        Item={
                            'user': user,
                            'sk': 'insights#' + month,
                            'categories': json.dumps(user_insights_dict[user][month])
                        }
                    )
                else:
                    # update item
                    table.update_item(
                        Key={
                            'user': user,
                            'sk': 'insights#' + month
                        },
                        UpdateExpression="set categories = :c",
                        ExpressionAttributeValues={
                            ':c': json.dumps(user_insights_dict[user][month])
                        },
                    )
        return {
            'statusCode': 200,
            'body': json.dumps('Hello from Lambda!')
        }
    except Exception as e:
        print(e)
        return {
            'statusCode': 500,
            'body': json.dumps('Error!')
        }
