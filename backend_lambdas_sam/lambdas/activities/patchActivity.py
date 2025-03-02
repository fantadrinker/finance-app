import json
from ActivitiesTableLayer import ActivitiesTable

MISSING_INPUT_ERROR_MSG =  "missing body content or input format"

def patchActivity(user_id: str, sk: str, body: str):
  if not body:
    return {
      "statusCode": 400,
      "body": MISSING_INPUT_ERROR_MSG
    }
  try:
    layer = ActivitiesTable()

    layer.patchActivity(user_id, sk, json.loads(body))

    return {
      "statusCode": 200
    }

  except Exception as e:
    print("error fetching", e)
    return {
      "statusCode": 500,
      "body": ""
    }
