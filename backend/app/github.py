from .schemas import (
    ContributorEvidence,
    CommitEvidence,
    ContributionAuditResponse,
)
import re
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException

from .config import settings
from .schemas import LanguageShare, RepositoryAuditResponse

GITHUB_API = "https://api.github.com"
REPO_PATH_RE = re.compile(r"^/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)/?$")


def parse_github_repo_url(raw_url: str) -> tuple[str, str]:
    parsed = urlparse(raw_url)
    if parsed.scheme != "https" or parsed.hostname not in {"github.com", "www.github.com"}:
        raise HTTPException(status_code=422, detail="Enter a repository URL hosted on https://github.com.")
    match = REPO_PATH_RE.fullmatch(parsed.path)
    if not match:
        raise HTTPException(status_code=422, detail="Use a repository URL like https://github.com/owner/repository.")
    owner, repo = match.groups()
    if repo.endswith(".git"):
        repo = repo[:-4]
    if not owner or not repo:
        raise HTTPException(status_code=422, detail="Both repository owner and name are required.")
    return owner, repo


async def fetch_repository_audit(raw_url: str) -> RepositoryAuditResponse:
    owner, repo = parse_github_repo_url(raw_url)
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ProofOfSkill-MVP",
    }
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    timeout = httpx.Timeout(12.0, connect=5.0)
    async with httpx.AsyncClient(headers=headers, timeout=timeout, follow_redirects=False) as client:
        response = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found or not publicly accessible.")
        if response.status_code == 403 and response.headers.get("X-RateLimit-Remaining") == "0":
            raise HTTPException(status_code=429, detail="GitHub API rate limit reached. Add a backend GITHUB_TOKEN and try again.")
        if response.status_code == 403:
            raise HTTPException(status_code=403, detail="GitHub declined this request. Check API limits and try again.")
        if response.status_code == 451:
            raise HTTPException(status_code=451, detail="GitHub cannot provide this repository due to a legal restriction.")
        if response.is_error:
            raise HTTPException(status_code=502, detail=f"GitHub API returned HTTP {response.status_code}.")
        repo_data = response.json()

        languages_response = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/languages")
        if languages_response.is_error:
            raise HTTPException(status_code=502, detail="Repository details loaded, but GitHub language statistics could not be retrieved.")
        language_bytes: dict[str, int] = languages_response.json()

    total_bytes = sum(language_bytes.values())
    languages = [
        LanguageShare(
            name=name,
            bytes=count,
            percentage=round((count / total_bytes * 100), 1) if total_bytes else 0.0,
        )
        for name, count in sorted(language_bytes.items(), key=lambda item: item[1], reverse=True)
    ]

    license_data = repo_data.get("license") or {}
    return RepositoryAuditResponse(
        url=repo_data["html_url"],
        full_name=repo_data["full_name"],
        description=repo_data.get("description"),
        default_branch=repo_data["default_branch"],
        stars=repo_data["stargazers_count"],
        forks=repo_data["forks_count"],
        open_issues=repo_data["open_issues_count"],
        created_at=repo_data["created_at"],
        updated_at=repo_data["updated_at"],
        license_name=license_data.get("spdx_id") or license_data.get("name"),
        archived=repo_data["archived"],
        primary_language=repo_data.get("language"),
        languages=languages,
        evidence_note=(
            "These are live GitHub repository facts. Language byte shares are not skill scores. "
            "Repository metadata alone does not prove authorship, originality, or individual skill."
        ),
    )

async def fetch_contribution_audit(raw_url: str) -> ContributionAuditResponse:
    owner, repo = parse_github_repo_url(raw_url)

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ProofOfSkill-MVP",
    }

    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    base_url = f"{GITHUB_API}/repos/{owner}/{repo}"

    async with httpx.AsyncClient(
        headers=headers,
        timeout=httpx.Timeout(15.0, connect=5.0),
    ) as client:
        repo_response = await client.get(base_url)

        if repo_response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Repository not found or not publicly accessible.",
            )

        if repo_response.status_code == 403:
            raise HTTPException(
                status_code=403,
                detail="GitHub API access was limited. Try again later.",
            )

        if repo_response.is_error:
            raise HTTPException(
                status_code=502,
                detail="Could not retrieve repository information from GitHub.",
            )

        repo_data = repo_response.json()
        full_name = repo_data["full_name"]

        contributors_response = await client.get(
            f"{base_url}/contributors",
            params={"per_page": 10},
        )

        commits_response = await client.get(
            f"{base_url}/commits",
            params={"per_page": 10},
        )

        for response in (contributors_response, commits_response):
            if response.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail="GitHub API rate limit reached. Try again later.",
                )
            if response.is_error:
                raise HTTPException(
                    status_code=502,
                    detail="GitHub could not return contribution evidence.",
                )

        contributor_data = contributors_response.json()
        commit_data = commits_response.json()

    contributors = [
        ContributorEvidence(
            username=item.get("login"),
            profile_url=item.get("html_url"),
            avatar_url=item.get("avatar_url"),
            contributions_reported=item.get("contributions", 0),
            evidence_note=(
                "GitHub-reported repository contribution count; "
                "not proof of identity, authorship, or skill."
            ),
        )
        for item in contributor_data
        if isinstance(item, dict)
    ]

    commits = []

    for item in commit_data:
        commit = item.get("commit", {})
        author = item.get("author") or {}
        details = commit.get("author") or {}

        stats = item.get("stats") or {}

        commits.append(
            CommitEvidence(
                sha=item.get("sha", ""),
                message=commit.get("message", "").splitlines()[0],
                author_name=details.get("name"),
                author_username=author.get("login"),
                committed_at=details.get("date"),
                url=item.get("html_url", ""),
                additions=stats.get("additions"),
                deletions=stats.get("deletions"),
                changed_files=None,
            )
        )

    return ContributionAuditResponse(
        full_name=full_name,
        contributors=contributors,
        commits=commits,
        evidence_note=(
            "This information comes from GitHub's public API. "
            "Contributor counts and commit author fields are signals, "
            "not conclusive proof of individual authorship or skill. "
            "Commit statistics may be unavailable for some API responses."
        ),
    )