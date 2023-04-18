
const awsLambdaAddr = "https://ot8kxben4m.execute-api.us-east-1.amazonaws.com/Test";

export function postCall(
    url: string, 
    body: string = "", 
    contentType: string = "application/json", 
    auth: string = ""
): Promise<Response> | null {
    try {
        return fetch(awsLambdaAddr + url, {
            method: 'POST',
            headers: {
                'Content-Type': contentType,
                'Authorization': auth
            },
            mode: 'cors',
            body: contentType === "application/json"? JSON.stringify(body): body
        });
    } catch(err) {
        console.log("post error", err);
    }
    return null;
}

export function getCall(
    url: string, 
    auth: string
): Promise<Response> | null {
    try {
        return fetch(awsLambdaAddr + url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth
            },
            mode: 'cors'
        });
    } catch(err) {
        console.log("get error", err);
    }
    return null;
}

export function deleteCall(
    url: string, 
    auth: string,
): Promise<Response> | null {
    try {
        return fetch(awsLambdaAddr + url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth
            },
            mode: 'cors'
        });
    } catch(err) {
        console.log("get error", err);
    }
    return null;
}