from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import settings
from .github import fetch_contribution_audit, fetch_repository_audit
from .schemas import (
    ContributionAuditResponse,
    RepositoryAuditRequest,
    RepositoryAuditResponse,
)

app = FastAPI(
    title="Proof of Skill API",
    version="0.1.0",
    description="Evidence-first repository analysis. No fabricated skill scores.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class HealthResponse(BaseModel):
    status: str
    feature: str


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", feature="github-public-repository-audit")


@app.post("/api/v1/repositories/audit", response_model=RepositoryAuditResponse)
async def audit_repository(payload: RepositoryAuditRequest) -> RepositoryAuditResponse:
    return await fetch_repository_audit(str(payload.url))


@app.post(
    "/api/v1/repositories/contributions",
    response_model=ContributionAuditResponse,
)
async def audit_contributions(
    payload: RepositoryAuditRequest,
) -> ContributionAuditResponse:
    return await fetch_contribution_audit(str(payload.url))