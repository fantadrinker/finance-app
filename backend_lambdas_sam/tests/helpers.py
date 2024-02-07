
def _query_string_to_dict(query_string):
    all_params = [paramStr for paramStr in query_string.split("&") if len(paramStr.split("=")) > 1]
    return dict(map(lambda x: x.split("="), all_params))


class TestHelpers:
    @staticmethod
    def get_base_event(user_id, method, path, queryString):
        return {
            "version": "2.0",
            "routeKey": f"{method} {path}",
            "rawPath": f"/Test{path}",
            "rawQueryString": queryString, # TODO: add query string
            "path": path,
            "queryStringParameters": _query_string_to_dict(queryString),
            "requestContext": {
                "accountId":"123197238901",
                "apiId":"1234567890",
                "domainName":"1234567890.execute-api.us-east-1.amazonaws.com",
                "domainPrefix":"1234567890",
                "http":{
                    "method": method,
                    "path": f"/Test{path}",
                    "protocol": "HTTP/1.1",
                    "sourceIp": "0.0.0.0",
                    "userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                "requestId":"pasoiufpoicjop",
                "routeKey": f"{method} {path}",
                "stage": "Test",
                "time": "4/Jan/2023:05:04:07 +0000",
                "timeEpoch": 1706331847257
            },
            "headers": {
                "authorization": user_id
            },
        }
    