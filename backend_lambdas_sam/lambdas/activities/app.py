import os

import boto3

from AuthLayer import get_user_id

from getActivities import getActivitiesForCategory, getActivities, getRelatedActivities, getEmptyDescriptionActivities
from postActivities import postActivities
from deleteActivities import delete_activities
from patchActivity import patchActivity

activities_table = None

s3 = None


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
    if method == "POST":
        params = event.get("queryStringParameters", {})
        file_format = params.get("format")
        body = event["body"]
        preview = params.get("type", "") == "preview"
        print(f"processing POST request", preview)

        return postActivities(user_id, file_format, body, activities_table, s3, preview)
    elif method == "GET":
        params = event.get("queryStringParameters", {})
        print("processing GET request")

        checkRelated = params.get("related", False)
        if checkRelated:
            return getRelatedActivities(user_id, checkRelated, activities_table)

        size = int(params.get("size", 0))
        nextDate = params.get("nextDate", "")
        description = params.get("description", "")
        orderByAmount = params.get("orderByAmount", False)
        account = params.get("account", "")
        amountMax = params.get("amountMax", None)
        amountMin = params.get("amountMin", None)
        startDate = params.get("startDate", "0000-00-00")
        endDate = params.get("endDate", "9999-99-99")
        isDirty = params.get("isDirty", None)
        if isDirty is not None:
            if isDirty == "true": 
                isDirty = True
            elif isDirty == "false":
                isDirty = False
            else:
                isDirty = None

        checkEmpty = params.get("emptyDescription", False)
        if checkEmpty:
            return getEmptyDescriptionActivities(user_id, size, activities_table)

        category = params.get("category", "")
        if category:
            exclude = params.get("exclude", False)
            return getActivitiesForCategory(
                user_id,
                category.split(","),
                activities_table,
                exclude,
                startDate,
                endDate,
                5 if size == 0 else size
            )
        return getActivities(
            user_id,
            size,
            activities_table,
            nextDate,
            description,
            orderByAmount,
            account,
            amountMax,
            amountMin,
            isDirty)
    elif method == "DELETE":
        params = event.get("queryStringParameters", {})
        sk = params.get("sk", "")
        print(f"processing DELETE request")
        return delete_activities(user_id, sk, activities_table)
    elif method == "PATCH":
        params = event.get("queryStringParameters", {})
        sk = params.get("sk", "")
        body = event["body"]
        return patchActivity(user_id, sk, body)
    else:
        print("debug: no method found in request")
        print(event)
        return {
            "statusCode": 400,
            "body": "invalid method"
        }
