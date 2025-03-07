# this is the base layer that includes
# authentication, database connection, and
import os
import requests
import jwt
from jwt.exceptions import InvalidSignatureError
from jwt.algorithms import RSAAlgorithm
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

VERIFY_TOKEN_ERROR_TEXT = "Token verification failed."

def verify_token_with_jwks(token, jwks_url, audiences):
    """ Get the JSON Web Key Set from the provided URL """
    jwks = requests.get(jwks_url, timeout=3).json()

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
    except InvalidSignatureError as exc:
        # If the token could not be verified, raise an exception
        raise ValueError(VERIFY_TOKEN_ERROR_TEXT) from exc


def get_user_id(event):
    """ for lambda http api event, get user id from authorization token in header"""
    token = event.get("headers", {}).get("authorization", "")
    if os.environ.get('SKIP_AUTH', '') == '1':
        return token
    api_url = event.get("headers", {}).get("host", "")
    try:
        url_base = os.environ.get("BASE_URL", "")
        jwks_url = f"{url_base}/.well-known/jwks.json"
        audiences = [
            f"https://{api_url}/Test/"
        ]

        decoded = verify_token_with_jwks(token, jwks_url, audiences)
        return decoded.get("sub", "")
    except Exception as exc:
        print("Error while verifying token", exc)
        return ""
