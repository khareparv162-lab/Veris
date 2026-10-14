
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://veris-api-s13b.onrender.com";

type ApiErrorResponse = {
  detail?: string | { msg?: string }[];
};

export type LanguageShare = {
  name: string;
  bytes: number;
  percentage: number;
};

export type RepositoryAudit = {
  url: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  stars: number;
  forks: number;
  open_issues: number;
  created_at: string;
  updated_at: string;
  license_name: string | null;
  archived: boolean;
  primary_language: string | null;
  languages: LanguageShare[];
  evidence_note: string;
};

export type SkillEvidence = {
  skill: string;
  evidence_found: boolean;
  confidence: string;
  evidence_summary: string;
  evidence_urls: string[];
  limitations: string;
};

export type SkillEvidenceResponse = {
  full_name: string;
  skills: SkillEvidence[];
  evidence_note: string;
};

export type RepositoryContributor = {
  username: string;
  profile_url: string;
  avatar_url: string;
  contributions_reported: number;
  evidence_note: string;
};

export type RepositoryCommit = {
  sha: string;
  message: string;
  author_name: string;
  author_username: string | null;
  committed_at: string;
  url: string;
  additions: number;
  deletions: number;
  changed_files: number;
};

export type ContributionAudit = {
  full_name: string;
  contributors: RepositoryContributor[];
  commits: RepositoryCommit[];
  evidence_note: string;
};

async function postJson<T>(path: string, url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const text = await response.text();
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `The API returned invalid JSON (HTTP ${response.status}). Check that the backend is running and NEXT_PUBLIC_API_URL is correct.`
    );
  }

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    const detail = errorData.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg || `Request failed with HTTP ${response.status}`
          : `Request failed with HTTP ${response.status}`
    );
  }

  return data as T;
}

export function auditRepository(url: string): Promise<RepositoryAudit> {
  return postJson<RepositoryAudit>("/api/v1/repositories/audit", url);
}

export function auditContributions(
  url: string
): Promise<ContributionAudit> {
  return postJson<ContributionAudit>(
    "/api/v1/repositories/contributions",
    url
  );
}

export function auditSkills(
  url: string
): Promise<SkillEvidenceResponse> {
  return postJson<SkillEvidenceResponse>(
    "/api/v1/repositories/skills",
    url
  );
}
