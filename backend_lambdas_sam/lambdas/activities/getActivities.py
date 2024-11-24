import re
import json
from boto3.dynamodb.conditions import Key, Attr
import botocore
from functools import reduce
from datetime import timedelta, datetime
from libs import getMappings, applyMappings


def getActivities(
        user: str,
        size: int,
        activities_table,
        startKey: str = None,
        description: str = None,
        orderByAmount: bool = False,
        account: str = None,
        amountMax: int = None,
        amountMin: int = None):
    try:
        query_params = {
            "KeyConditionExpression": Key('user').eq(user) & Key('sk').between("0000-00-00", "9999-99-99"),
            "ScanIndexForward": False
        }
        if startKey:
            query_params["ExclusiveStartKey"] = {
                "user": user,
                "sk": startKey
            }
        filter_exps = []
        noLimit = False

        mappings = getMappings(user, activities_table)

        if description:
            filter_exps.append(
                Attr('search_term').contains(description.lower()))
            noLimit = True

        if account:
            filter_exps.append(Attr('account').eq(account))
            noLimit = True

        if amountMax:
            filter_exps.append(Attr('amount').lte(int(amountMax)))
            noLimit = True

        if amountMin:
            filter_exps.append(Attr('amount').gte(int(amountMin)))
            noLimit = True

        if filter_exps:
            query_params["FilterExpression"] = reduce(
                lambda x, y: x & y, filter_exps)

        if not noLimit and size > 0:
            query_params["Limit"] = size

        data = activities_table.query(
            **query_params
        )
        # should also fetch total count for page numbers
        items = data.get("Items", [])
        lastKey = data.get("LastEvaluatedKey", {})

        while lastKey and noLimit:
            data = activities_table.query(
                **query_params,
                ExclusiveStartKey=lastKey
            )
            items.extend(data.get("Items", []))
            lastKey = data.get("LastEvaluatedKey", {})
        # filter items to only include sk that starts with date
        date_regex = re.compile(r"^\d{4}-\d{2}-\d{2}")
        # TODO: redo lastevaluatedkey to be date instead of sk

        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": [{
                    **applyMappings(mappings, item),
                    "amount": str(item["amount"]),
                } for item in items if date_regex.match(item["sk"])],
                "count": data.get("Count", 0),
                "LastEvaluatedKey": data.get("LastEvaluatedKey", {})
            })
        }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while fetching data, see logs"
        }


def getActivitiesForCategory(
        user_id, 
        categories, 
        activities_table, 
        exclude: bool, 
        startDate: str, 
        endDate: str,
        limit: int = 0
    ):
    mappings = getMappings(user_id, activities_table, categories)
    descs = [x["description"] for x in mappings]
    filterExps = None
    if exclude:
        filterExps = ~Attr('category').is_in(categories)
        if mappings:
            for desc in descs:
                filterExps = filterExps & ~Attr(
                    'search_term').contains(desc.lower())
    else:
        filterExps = Attr('category').is_in(categories)
        if mappings:
            for desc in descs:
                filterExps = filterExps | Attr(
                    'search_term').contains(desc.lower())

    category_activities = activities_table.query(
        KeyConditionExpression=Key('user').eq(user_id) & Key(
            'sk').between(startDate, endDate),
        FilterExpression=filterExps,
    )
    allItems = category_activities.get("Items", [])
    while category_activities.get("LastEvaluatedKey"):
        category_activities = activities_table.query(
            KeyConditionExpression=Key('user').eq(user_id) & Key(
                'sk').between(startDate, endDate),
            FilterExpression=filterExps,
            ExclusiveStartKey=category_activities["LastEvaluatedKey"]
        )
        allItems.extend(category_activities.get("Items", []))

    sortedItems = sorted(allItems, key=lambda x: x["amount"], reverse=True)
    return {
        "statusCode": 200,
        "body": json.dumps({
            "data": [{
                **applyMappings(mappings, item),
                "amount": str(item["amount"]),
            } for item in sortedItems[:limit]],
            "count": len(allItems)
        })
    }


RELATED_ACTIVITY_TIMEDELTA = 7


def getRelatedActivities(user: str, sk: str, activities_table):
    print("getting related activities for sk", sk)
    try:
        # get the date from the sk
        record = activities_table.get_item(
            Key={
                "user": user,
                "sk": sk
            }
        )

        if not record.get("Item"):
            return {
                "statusCode": 404,
                "body": "no record found"
            }
    except botocore.exceptions.ClientError as error:
        print(error)
        return {
            "statusCode": 500,
            "body": "client error happened while fetching data, see logs"
        }

    date = datetime.strptime(record["Item"]["date"], "%Y-%m-%d")
    amount = record["Item"]["amount"]

    print("got item", record["Item"])

    begin_find_date = (date - timedelta(days=RELATED_ACTIVITY_TIMEDELTA)).strftime(
        "%Y-%m-%d")
    end_find_date = (date + timedelta(days=RELATED_ACTIVITY_TIMEDELTA)).strftime(
        "%Y-%m-%d")

    try:
        duplicate_responses = activities_table.query(
            KeyConditionExpression=Key("user").eq(
                user) & Key("sk").between(begin_find_date, end_find_date),
            FilterExpression=Attr("amount").eq(amount)
        )
        # print("got duplicate responses", duplicate_responses)

        opposite_responses = activities_table.query(
            KeyConditionExpression=Key("user").eq(
                user) & Key("sk").between(begin_find_date, end_find_date),
            FilterExpression=Attr("amount").eq(-amount)
        )
        # print("got opposite responses", opposite_responses)

        responses = [{
            **x,
            "amount": str(x["amount"]),
            "duplicate": True
        } for x in duplicate_responses["Items"] if x["sk"] != sk] + [{
            **x,
            "amount": str(x["amount"]),
            "opposite": True
        } for x in opposite_responses["Items"] if x["sk"] != sk]
        return {
            "statusCode": 200,
            "body": json.dumps({
                "data": responses
            })
        }
    except botocore.exceptions.ClientError as error:
        print("error fetching related activities", error)
        return {
            "statusCode": 500,
            "body": "client error happened while fetching data, see logs"
        }


def getEmptyDescriptionActivities(user_id, size, activities_table):
    empty_description_activities = activities_table.query(
        KeyConditionExpression=Key('user').eq(user_id) & Key(
            'sk').between("0000-00-00", "9999-99-99"),
        FilterExpression=Attr('description').eq(''),
        Limit=size if size else 10
    )
    return {
        "statusCode": 200,
        "body": json.dumps({
            "data": [{
                **item,
                "amount": str(item["amount"]),
            } for item in empty_description_activities["Items"]]
        })
    }
