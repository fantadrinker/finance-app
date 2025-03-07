import os

import boto3

from auth_layer import get_user_id
from getActivities import getActivitiesForCategory, getActivities, getRelatedActivities, getEmptyDescriptionActivities
from postActivities import postActivities
from deleteActivities import delete_activities
from patchActivity import patchActivity

activities_table = None

s3 = None


def lambda_handler(event, _):
    # processes user activities data, store in db
    # right now just pings and returns body
    global activities_table
    global s3
    if not activities_table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        activities_table = dynamodb.Table(table_name)

    if not s3:
        s3 = boto3.resource("s3")

    user_id = get_user_id(event)
    if not user_id:
        return {
            "statusCode": 400,
            "body": "unable to retrive user information",
        }
    print(f"got user id {user_id}")
    print(event)
    method = event.get("routeKey", "").split(" ")[0]
    if method == "POST":
        params = event.get("queryStringParameters", {})
        file_format = params.get("format")
        body = event["body"]
        preview = params.get("type", "") == "preview"
        print("processing POST request", preview)

        return postActivities(
            user_id,
            file_format,
            body,
            activities_table,
            s3,
            preview)
    elif method == "GET":
        params = event.get("queryStringParameters", {})
        print("processing GET request")

        check_related = params.get("related", False)
        if check_related:
            return getRelatedActivities(
                user_id,
                check_related,
                activities_table)

        size = int(params.get("size", 0))
        next_date = params.get("nextDate", "")
        description = params.get("description", "")
        order_by_amount = params.get("orderByAmount", False)
        account = params.get("account", "")
        amount_max = params.get("amountMax", None)
        amount_min = params.get("amountMin", None)
        start_date = params.get("startDate", "0000-00-00")
        end_date = params.get("endDate", "9999-99-99")
        is_dirty = params.get("isDirty", None)
        if is_dirty is not None:
            if is_dirty == "true":
                is_dirty = True
            elif is_dirty == "false":
                is_dirty = False
            else:
                is_dirty = None

        check_empty = params.get("emptyDescription", False)
        if check_empty:
            return getEmptyDescriptionActivities(
                user_id,
                size,
                activities_table)

        category = params.get("category", "")
        if category:
            exclude = params.get("exclude", False)
            return getActivitiesForCategory(
                user_id,
                category.split(","),
                activities_table,
                exclude,
                start_date,
                end_date,
                5 if size == 0 else size
            )
        return getActivities(
            user_id,
            size,
            activities_table,
            next_date,
            description,
            order_by_amount,
            account,
            amount_max,
            amount_min,
            is_dirty)
    elif method == "DELETE":
        params = event.get("queryStringParameters", {})
        sk = params.get("sk", "")
        print("processing DELETE request")
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
