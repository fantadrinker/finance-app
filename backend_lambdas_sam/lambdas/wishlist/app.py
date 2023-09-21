



def get(user_id):
    # stub
    print('get wishlist', user_id)
    return {
        "statusCode": 200,
        "body": "success get"
    }

def post(user_id, event):
    # stub
    print('post wishlist', event)

    return {
        "statusCode": 200,
        "body": "success ppost"
    }

def delete(user_id, event):
    # stub
    print('delete wishlist', event)

    return {
        "statusCode": 200,
        "body": "success delete"
    }

def put(user_id, event):
    # stub
    print('put wishlist', event)

    return {
        "statusCode": 200,
        "body": "success put"
    }



def lambda_handler(event, context):
    global table
    #user_id = get_user_id(event)
    
    #if not user_id:
    #    return {
    #        "statusCode": 400,
    #        "body": "unable to retrive user information",
    #    }
    #if not table:
    #    dynamodb = boto3.resource("dynamodb")
    #    table_name = os.environ.get("MAPPINGS_TABLE", "")
    #    table = dynamodb.Table(table_name)
    user_id = "test"
    if event["httpMethod"] == "GET":
        return get(user_id)
    elif event["httpMethod"] == "POST":
        return post(user_id, event)
    elif event["httpMethod"] == "DELETE":
        return delete(user_id, event)
    elif event["httpMethod"] == "PUT":
        return put(user_id, event)
    else:
        return {
            "statusCode": 400,
            "body": "unknown method",
        }