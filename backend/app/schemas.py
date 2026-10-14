
from pydantic import BaseModel, Field, HttpUrl


class RepositoryAuditRequest(BaseModel):
    url: HttpUrl = Field(description="URL of a public GitHub repository")


class LanguageShare(BaseModel):
    name: str
    bytes: int
    percentage: float


class RepositoryAuditResponse(BaseModel):
    url: str
    full_name: str
    description: str | None
    default_branch: str
    stars: int
    forks: int
    open_issues: int
    created_at: str
    updated_at: str
    license_name: str | None
    archived: bool
    primary_language: str | None
    languages: list[LanguageShare]
    evidence_note: str


class ContributorEvidence(BaseModel):
    username: str | None
    profile_url: str | None
    avatar_url: str | None
    contributions_reported: int
    evidence_note: str


class CommitEvidence(BaseModel):
    sha: str
    message: str
    author_name: str | None
    author_username: str | None
    committed_at: str | None
    url: str
    additions: int | None
    deletions: int | None
    changed_files: int | None

class SkillEvidence(BaseModel):
    skill: str
    evidence_found: bool
    confidence: str
    evidence_summary: str
    evidence_urls: list[str] = Field(default_factory=list)
    limitations: str


class SkillEvidenceResponse(BaseModel):
    full_name: str
    skills: list[SkillEvidence]
    evidence_note: str


class ContributionAuditResponse(BaseModel):
    full_name: str
    contributors: list[ContributorEvidence]
    commits: list[CommitEvidence]
    evidence_note: str
