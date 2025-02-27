import boto3
import botocore
import os
from datetime import datetime
from decimal import Decimal
from typing import Optional

import botocore.exceptions

DATE_FORMAT = "%Y-%m-%d"

class ActivitiesTable:

  class Activity:
    user: str
    sk: str
    date: str
    account: Optional[str]
    description: Optional[str]
    amount: Decimal
    category: Optional[str]
    chksum: Optional[str]

    def __init__(
        self, 
        user: str, 
        sk: str,
        date: datetime,
        account: Optional[str],
        description: Optional[str],
        amount: Decimal,
        category: Optional[str],
        chksum: Optional[str]
        ):
      self.user = user
      self.sk = sk
      self.date = date.strftime(DATE_FORMAT)
      self.account = account
      self.description = description
      self.amount = amount
      self.category = category
      self.chksum = chksum 

    def toDict(self):
      return {
        'user': self.user,
        'sk': self.sk,
        'date': self.date,
        'account': self.account,
        'description': self.description,
        'amount': self.amount,
        'category': self.category,
        'chksum': self.chksum
      }

  _table = None
  _ddbClient = None

  def parseDDBGetItemActivity(self, item: dict[str, dict[str, str]]) -> Activity:
    return self.Activity(
      item['user']['S'],
      item['sk']['S'],
      datetime.strptime(item['date']['S'], DATE_FORMAT),
      item['account']['S'],
      item['description']['S'],
      Decimal(item['amount']['N']),
      item['category']['S'],
      item.get('chksum', {}).get('S', None),
    )
  
  def unparseDDBItem(self, item: dict) -> dict[str, dict]:
    # given an activity as dictionary, unparse it into
    # ddb format like 'attr': { 'S': 'value' }
    result = {}
    for key, val in item.items():
      if val is None:
        continue
      typeKey = 'S'
      if not isinstance(val, str):
        # assume value is number
        typeKey = 'N'

      result[key] = {
        typeKey: str(val)
      }
    return result    

  def __init__(self):
    self._ddbClient = boto3.client("dynamodb")
    self._table = os.environ.get("ACTIVITIES_TABLE", "")
  
  
  def patchActivity(self, user: str, sk: str, newActivity: dict):
    if self._ddbClient is None:
      return
    try:
      # first get the existing from ddb
      response = self._ddbClient.get_item(
        TableName=self._table,
        Key={
          'user': {
            'S': user
          },
          'sk': {
            'S': sk
          }
        }
      )

      currentActivity = self.parseDDBGetItemActivity(response['Item'])
      currentActivity = currentActivity.toDict()
      for key in newActivity.keys():
        oldVal = currentActivity[key] 
        newVal = newActivity[key]
        if oldVal != newVal:
          currentActivity[key] = newVal
      
      response = self._ddbClient.put_item(
        TableName=self._table,
        Item=self.unparseDDBItem(currentActivity)
      )

      return response
    except botocore.exceptions.ClientError as e:
      print(f"db error while patching activity, {e.response["Error"]}")
      raise e
    except Exception as e:
      print("error in code" ,e )
      raise e
