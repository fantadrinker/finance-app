
const awsLambdaAddr = "https://fbbvgusi51.execute-api.us-east-1.amazonaws.com/default";

export const postCall = async (url, body={}, contentType = "application/json") => {
    try {
        const result = await fetch(awsLambdaAddr + url, {
            method: 'POST',
            headers: {
                'Content-Type': contentType,
            },
            mode: 'cors',
            body: contentType === "application/json"? JSON.stringify(body): body
        });
        return result;
    } catch(err) {
        console.log("post error", err);
    }
    return null;
}

export const getCall = async (url) => {
    try {
        const result = await fetch(awsLambdaAddr + url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        return result;
    } catch(err) {
        console.log("get error", err);
    }
    return null;
}

export const deleteCall = async (url) => {
    try {
        const result = await fetch(awsLambdaAddr + url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        })
        return result;
    } catch(err) {
        console.log("get error", err);
    }
    return null;
}