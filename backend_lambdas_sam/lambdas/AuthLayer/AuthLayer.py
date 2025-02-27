# this is the base layer that includes
# authentication, database connection, and
import requests
import jwt
import os
from jwt.exceptions import InvalidSignatureError
from jwt.algorithms import RSAAlgorithm
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

VERIFY_TOKEN_ERROR_TEXT = "Token verification failed."

def verify_token_with_jwks(token, jwks_url, audiences):
    # Get the JSON Web Key Set from the provided URL
    jwks = requests.get(jwks_url).json()

    # Extract the public key from the JSON Web Key Set
    key = RSAAlgorithm.from_jwk(jwks["keys"][0])
    if isinstance(key, RSAPrivateKey):
        raise ValueError(VERIFY_TOKEN_ERROR_TEXT)

    try:
        # Verify the token using the extracted public key
        decoded_token = jwt.decode(token, key=key, algorithms=[
                                   "RS256"], audience=audiences)

        # If the token was successfully verified, return the decoded token
        return decoded_token
    except InvalidSignatureError:
        # If the token could not be verified, raise an exception
        raise ValueError(VERIFY_TOKEN_ERROR_TEXT)


def get_user_id(event):
    token = event.get("headers", {}).get("authorization", "")
    if os.environ.get('SKIP_AUTH', '') == '1':
        return token
    try:
        url_base = os.environ.get("BASE_URL", "")
        jwks_url = f"{url_base}/.well-known/jwks.json"
        audiences = [
            f"{url_base}/userinfo"
        ]

        decoded = verify_token_with_jwks(token, jwks_url, audiences)
        return decoded.get("sub", "")
    except:
        return ""
