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

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://veris-api-s13b.onrender.com";

export async function auditRepository(url: string): Promise<RepositoryAudit> {
  const response = await fetch(`${API_BASE}/api/v1/repositories/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail ?? `Request failed with HTTP ${response.status}`);
  }
  return body as RepositoryAudit;
}

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


export async function auditContributions(
  url: string
): Promise<ContributionAudit> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const response = await fetch(
    `${apiUrl}/api/v1/repositories/contributions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    }
  );

 
const text = await response.text();

let data: ApiErrorResponse;

try {
  data = JSON.parse(text) as ApiErrorResponse;
} catch {
  throw new Error(
    `The API returned HTML or invalid JSON (HTTP ${response.status}). Check the API URL: ${apiUrl}`
  );
}

if (!response.ok) {
  throw new Error(
    typeof data.detail === "string"
      ? data.detail
      : data.detail?.[0]?.msg ||
          "Could not fetch contribution evidence."
  );
}
  return data as ContributionAudit;
}
