from typing import List, Optional
import uuid
from datetime import datetime
from decimal import Decimal

from boto3.dynamodb.conditions import Key, Attr

class Activity:

    sk: str
    account: str
    date: str
    description: str
    predicted: List[str]
    dirty: bool
    def __init__(self,
                 account: str,
                 date: str,
                 amount: Decimal,
                 description: str,
                 sk: Optional[str] = None,
                 category: Optional[str] = None
                 ):
        self.sk = date + str(uuid.uuid4()) if sk is None else sk
        self.account = account
        self.date = date
        self.description = description
        self.category = category if category is not None else description
        self.amount = amount
        self.search_term = description.lower() if description else 'other'
        self.predicted = []
        self.dirty = False
        
    def toDict(self):
        # TODO: implement properly
        return {
                "sk": self.sk,
                "account": self.account,
                "date": self.date,
                "description": self.description,
                "amount": str(self.amount),
                "search_term": self.search_term,
                "category": self.category,
                "predicted": self.predicted,
                "dirty": self.dirty,
                }

    def applyMappings(self, mappings: list):
        matchedMapping = [mapping for mapping in mappings if mapping["description"] in self.description]
        self.dirty = len(matchedMapping) > 0
        self.category = matchedMapping[0]["category"] if len(matchedMapping) > 0 else self.category
        self.predicted = [mapping["category"] for mapping in matchedMapping]

def isDuplicate(activity: Activity, another: Activity):
    return activity.date == another.date and activity.amount == another.amount and activity.description == another.description 


def serialize_rbc_activity(row) -> Optional[Activity]:
    if len(row) < 7:
        return None

    if not row[6] or row[6] == "0":
        print("skipping row" + ','.join(row))
        return None

    date_str = datetime.strptime(
        row[2], "%m/%d/%Y").strftime("%Y-%m-%d")
    amount = 0 - Decimal(row[6])
    activity = Activity(
        account=f"{mask_account_number(row[1])}-{row[0]}",
        date=date_str,
        description=row[5],
        category=row[4],  # in the future we should get this
        amount=amount  # rbc uses negative val for expense
    )
    return activity


def mask_account_number(account: str):
    # only return the last 4 digits
    return account[-4:] if len(account) > 4 else account


def serialize_cap1_activity(row) -> Optional[Activity]:
    if len(row) < 6:
        return None

    date_str = datetime.strptime(
        row[0], "%Y-%m-%d").strftime("%Y-%m-%d")
    amount = Decimal(row[5]) if row[5] else 0 - Decimal(row[6])
    activity = Activity(
        account=row[2],
        date=date_str,
        description=row[3],
        category=row[4],  # in the future we should get this
        amount=amount  # rbc uses negative val for expense
    )
    return activity

def serialize_default_activity(row) -> Optional[Activity]:
    date_str = row['date']
    return Activity(
        date=date_str,
        account=row['account'],
        description=row['description'],
        category=row['category'],  # in the future we should get this
        amount=Decimal(row['amount'])  # rbc uses negative val for expense
    )

def serialize_td_activity(row) -> Optional[Activity]:
    date_str = datetime.strptime(
        row[0], "%m/%d/%Y").strftime("%Y-%m-%d")
    description = row[1]
    amount = Decimal(row[2]) if row[2] else 0 - Decimal(row[3])
    return Activity(
        date=date_str,
        account='td',
        description=description,
        amount=amount  # rbc uses negative val for expense
    )


def getMappings(user: str, activities_table, categories=None):
    params = {
        "KeyConditionExpression": Key('user').eq(user) & Key('sk').begins_with("mapping#")
    }
    if categories:
        params["FilterExpression"] = Attr('category').is_in(categories)
    response = activities_table.query(
        **params
    )
    all_mappings = response.get("Items", [])

    while response.get("LastEvaluatedKey"):
        response = activities_table.query(
            KeyConditionExpression=Key("user").eq(
                user) & Key("sk").begins_with("mapping#"),
            ExclusiveStartKey=response["LastEvaluatedKey"]
        )
        all_mappings.extend(response.get("Items", []))

    return all_mappings


def applyMappings(mappings: list, item: dict):
    itemDesc = item.get("description", "")
    # if category is not set, use description
    itemCategory = item.get("category", itemDesc)

    matchedMapping = [mapping for mapping in mappings if mapping["description"] in itemDesc]
    return {
        **item,
        "dirty": len(matchedMapping) > 0,
        "category": matchedMapping[0]["category"] if len(matchedMapping) > 0 else itemCategory,
        "predicted": [mapping["category"] for mapping in matchedMapping]
    }
