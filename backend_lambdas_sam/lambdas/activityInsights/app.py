import os
from decimal import Decimal
from datetime import datetime, timedelta
import requests
import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
import botocore
import jwt
from jwt.exceptions import InvalidSignatureError

activities_table = None


def verify_token_with_jwks(token, jwks_url, audiences):
    # Get the JSON Web Key Set from the provided URL
    jwks = requests.get(jwks_url).json()

    # Extract the public key from the JSON Web Key Set
    key = jwt.algorithms.RSAAlgorithm.from_jwk(jwks["keys"][0])

    try:
        # Verify the token using the extracted public key
        decoded_token = jwt.decode(token, key=key, algorithms=[
                                   "RS256"], audience=audiences)

        # If the token was successfully verified, return the decoded token
        return decoded_token
    except InvalidSignatureError:
        # If the token could not be verified, raise an exception
        raise ValueError("Token verification failed.")


def get_user_id(event):
    if os.environ.get("SKIP_AUTH", "") == "1":
        # for local testing
        return event.get("headers", {}).get("authorization", "")
    try:
        url_base = os.environ.get("BASE_URL", "")
        jwks_url = f"{url_base}/.well-known/jwks.json"
        audiences = [
            f"{url_base}/api/v2/",
            f"{url_base}/userinfo"
        ]
        token = event.get("headers", {}).get("authorization", "")

        decoded = verify_token_with_jwks(token, jwks_url, audiences)
        return decoded.get("sub", "")
    except:
        return ""


def get_grouped_by_categories(items, all_categories, categories):
    # todo: calculate and return an array of {category: amount} objects
    # with first object with category = "all"

    results = []

    sum_by_category = {}
    # below is generated by copilot, will probably rewrite these later on
    if all_categories:
        # get all categories
        for item in items:
            if item["category"] in sum_by_category:
                sum_by_category[item["category"]] += Decimal(item["amount"])
            else:
                sum_by_category[item["category"]] = Decimal(item["amount"])
    elif len(categories) == 0:
        sum_by_category["all"] = 0
        for item in items:
            sum_by_category["all"] += Decimal(item["amount"])
    else:
        # get only categories in categories param
        for item in items:
            if item["category"] in categories:
                if item["category"] in sum_by_category:
                    sum_by_category[item["category"]] += Decimal(item["amount"])
                else:
                    sum_by_category[item["category"]] = Decimal(item["amount"])
    for category, amount in sum_by_category.items():
        results.append({
            "category": category,
            "amount": str(amount)
        })
    return results

def getAllMappings(user: str):
    global activities_table
    response = activities_table.query(
        KeyConditionExpression=Key("user").eq(user) & Key("sk").begins_with("mapping#"),
    )
    all_mappings = response.get("Items", [])
    
    while response.get("LastEvaluatedKey"):
        response = activities_table.query(
            KeyConditionExpression=Key("user").eq(user) & Key("sk").begins_with("mapping#"),
            ExclusiveStartKey=response["LastEvaluatedKey"]
        )
        all_mappings.extend(response.get("Items", []))
    
    return all_mappings

def applyMappings(mappings: list, item: dict):
    itemDesc = item.get("description", "")
    itemCategory = item.get("category", itemDesc) # if category is not set, use description
    return {
        **item,
        "category": next((mapping["category"] for mapping in mappings if mapping["description"] in itemDesc), itemCategory)
    }    

# starting_date and ending_date are in the format YYYY-MM-DD
# all_categories is a boolean, if true we return all categories, else we only return what's 
# in the 'categories' param
def get_new(
    user_id, 
    starting_date, 
    ending_date, 
    all_categories = False, 
    categories = [],
    exclude_negative = False,
    monthlyBreakdown = False
): 
    global activities_table

    if not ending_date:
        ending_date = datetime.now().strftime("%Y-%m-%d")
    
    if not starting_date:
        starting_date = (datetime.strptime(ending_date, "%Y-%m-%d") - timedelta(days=30)).strftime("%Y-%m-%d")

    breakdownPeriods = []
    if monthlyBreakdown:
        # get all the months in the range
        curr_date = datetime.strptime(starting_date, "%Y-%m-%d")
        while curr_date < ending_date:
            curr_month = curr_date.month
            next_month = curr_date.replace(year=curr_date.year+1, month=1) if curr_month == 12 else curr_date.replace(month=curr_month+1)
            breakdownPeriods.append((curr_date.strftime("%Y-%m-%d"), next_month.strftime("%Y-%m-%d")))
            curr_date = next_month
    else:
        breakdownPeriods = [(starting_date, ending_date)]

    try:
        # first get all transactions for the time period
        params = {
            "KeyConditionExpression": Key("user").eq(user_id) & Key("sk").between(starting_date, ending_date),
        }
        if exclude_negative:
            params["FilterExpression"] = Attr("amount").gt(0)

        response = activities_table.query(
            **params
        )
        items = response.get("Items", [])
        # checks if there are more items to be fetched
        while response.get("LastEvaluatedKey"):
            more_response = activities_table.query(
                **params,
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(more_response.get("Items", []))
        
        # then get all mappings
        response = activities_table.query(
            KeyConditionExpression=Key("user").eq(user_id) & Key("sk").begins_with("mapping#"),
        )
        mappings = getAllMappings(user_id)
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": [{
                    # TODO: add date
                    "start_date": period_start,
                    "end_date": period_end,
                    "categories": get_grouped_by_categories(
                        [applyMappings(mappings, item) for item in items if item["date"] >= period_start and item["date"] <= period_end], 
                        all_categories,
                        categories,
                    )
                } for period_start, period_end in breakdownPeriods]
            })
        }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while processing file, see logs"
        }

def lambda_handler(event, context):
    global activities_table
    if not activities_table:
        dynamodb = boto3.resource("dynamodb")
        table_name = os.environ.get("ACTIVITIES_TABLE", "")
        activities_table = dynamodb.Table(table_name)
    user_id = get_user_id(event)

    if not user_id:
        return {
            "statusCode": 400,
            "body": "unable to retrive user information",
        }
    method = event.get("routeKey", "").split(' ')[0]
    if method == "GET":
        query_params = event.get("queryStringParameters", {})
        # need to do some request validation here
        return get_new(
            user_id,
            query_params.get("starting_date", None),
            query_params.get("ending_date", None),
            all_categories=query_params.get("all_categories", False),
            categories=query_params.get("categories", []),
            exclude_negative=query_params.get("exclude_negative", False)
        )  # need to get from multivalue query params
    else:
        return {
            "statusCode": 400,
            "body": "method not allowed",
        }
