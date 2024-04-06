import json

import pytest

from lambdas.multiply import app
from tests.helpers import TestHelpers


@pytest.fixture()
def apigw_event():
    """ Generates API GW Event"""

    return TestHelpers.get_base_event(
        "",
        "GET",
        "/multiply",
        "a=10&b=9"
    )


def test_lambda_handler(apigw_event):

    ret = app.lambda_handler(apigw_event, "")
    data = json.loads(ret["body"])

    assert ret["statusCode"] == 200
    assert "product" in ret["body"]
    assert data["product"] == 90
