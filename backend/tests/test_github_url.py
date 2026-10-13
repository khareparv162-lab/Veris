import pytest
from fastapi import HTTPException

from app.github import parse_github_repo_url


def test_valid_repository_url():
    assert parse_github_repo_url("https://github.com/fastapi/fastapi") == ("fastapi", "fastapi")


def test_trailing_slash_is_allowed():
    assert parse_github_repo_url("https://github.com/fastapi/fastapi/") == ("fastapi", "fastapi")


@pytest.mark.parametrize("url", [
    "http://github.com/fastapi/fastapi",
    "https://evil.example/fastapi/fastapi",
    "https://github.com/fastapi",
    "https://github.com/",
    "https://github.com/fastapi/fastapi/issues",
])
def test_invalid_urls_are_rejected(url):
    with pytest.raises(HTTPException):
        parse_github_repo_url(url)
