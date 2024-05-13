import json

import botocore


def delete_activities(user: str, sk: str, activities_table):
    # deletes all activites for a user, or a specific activity if sk is provided
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
