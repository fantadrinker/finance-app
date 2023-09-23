import json

# mock data here:
mocks = [
    {
        "user": "test",
        "sk": "wishlist#12324234234",
        "name": "graphics card",
        "description": "RTX 3080",
        "category": "Grocery",
        "url": "https://https://www.newegg.ca/msi-geforce-rtx-4070-rtx-4070-ventus-2x-12g-oc/p/N82E16814137787?item=N82E16814137787",
        "price": 1000,
        "priority": 1,
    },
    {
        "user": "test",
        "sk": "wishlist#12324234235",
        "name": "desk lamp",
        "description": "desk lamp",
        "category": "Furniture",
        "url": "https://www.amazon.ca/ACNCTOP-Desk-Lamp-Office-Home/dp/B0BGNJS7FQ/ref=sr_1_7?crid=W3YGOGFHLWPQ&keywords=desk+lamp&qid=1695447981&sprefix=desk+lamp%2Caps%2C360&sr=8-7",
        "price": 50,
        "priority": 2,
    }
]


def get(user_id):
    # stub
    print('get wishlist', user_id)
    return {
        "statusCode": 200,
        "body": json.dumps({
            "data": mocks,
        })
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
    print(event)
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "GET":
        return get(user_id)
    elif method == "POST":
        return post(user_id, event)
    elif method == "DELETE":
        return delete(user_id, event)
    elif method == "PUT":
        return put(user_id, event)
    else:
        return {
            "statusCode": 400,
            "body": "unknown method",
        }