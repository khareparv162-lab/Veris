"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  auditRepository,
  auditContributions,
  auditSkills,
  type RepositoryAudit,
  type ContributionAudit,
  type SkillEvidenceResponse,
} from "@/lib/api";


function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<RepositoryAudit | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [contributions, setContributions] =
  useState<ContributionAudit | null>(null);
  const [contributionError, setContributionError] = useState("");
  const [contributionLoading, setContributionLoading] = useState(false);

  
  const [skillResults, setSkillResults] =
  useState<SkillEvidenceResponse | null>(null);
  const [skillError, setSkillError] = useState("");
  const [skillLoading, setSkillLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    const repositoryUrl = url.trim();
  
    setError("");
    setResult(null);
    setContributionError("");
    setContributions(null);
    setSkillError("");
    setSkillResults(null);
  
    setLoading(true);
    setContributionLoading(true);
    setSkillLoading(true);
  
    const repositoryTask = auditRepository(repositoryUrl)
      .then(setResult)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Could not audit this repository."
        );
      })
      .finally(() => setLoading(false));
  
    const contributionTask = auditContributions(repositoryUrl)
      .then(setContributions)
      .catch((err) => {
        setContributionError(
          err instanceof Error
            ? err.message
            : "Could not fetch contribution evidence."
        );
      })
      .finally(() => setContributionLoading(false));
  
    const skillTask = auditSkills(repositoryUrl)
      .then(setSkillResults)
      .catch((err) => {
        setSkillError(
          err instanceof Error
            ? err.message
            : "Could not analyze skill evidence."
        );
      })
      .finally(() => setSkillLoading(false));
  
    await Promise.all([
      repositoryTask,
      contributionTask,
      skillTask,
    ]);
  }

    try {
      const audit = await auditRepository(url.trim());
      setResult(audit);

      setContributionLoading(true);

      try {
        const contributionData = await auditContributions(url.trim());
        setContributions(contributionData);
      } catch (err) {
        setContributionError(
          err instanceof Error
            ? err.message
            : "Could not fetch contribution evidence."
        );
      } finally {
        setContributionLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not audit this repository."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      
        <header className="border-b border-[#e5e9f0] bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link href="/" className="flex items-center gap-3" aria-label="Veris home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172033] text-sm font-bold text-white">
                V
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.03em]">
                Veris<span className="text-[#315efb]">.</span>
              </span>
            </Link>
        
            <span className="rounded-full border border-[#e5e9f0] px-3 py-1.5 text-xs font-medium text-[#667085]">
              Veris - Evidence Over Claims
            </span>
          </div>
        </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-24">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dce5ff] bg-[#f0f4ff] px-3 py-1.5 text-xs font-semibold text-[#315efb]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#315efb]" />
            EVIDENCE OVER CLAIMS
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.055em] text-[#172033] md:text-6xl">
            Your work should speak louder than your resume.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#667085] md:text-lg">
            Start with the evidence inside a real GitHub repository. Inspect project metadata and language breakdowns before making claims about skills or contributions.
          </p>
        </div>

        <div className="mt-10 max-w-3xl rounded-2xl border border-[#e5e9f0] bg-white p-5 shadow-[0_12px_40px_rgba(23,32,51,0.04)] md:p-7">
          <form onSubmit={handleSubmit}>
            <label htmlFor="repo-url" className="mb-2 block text-sm font-semibold text-[#172033]">Public GitHub repository</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="repo-url"
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://github.com/owner/repository"
                className="min-w-0 flex-1 rounded-xl border border-[#d9deea] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#315efb] focus:ring-4 focus:ring-[#315efb]/10"
                aria-describedby="repo-help"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="rounded-xl bg-[#315efb] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#244be0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Fetching evidence…" : "Analyze repository"}
              </button>
            </div>
            <p id="repo-help" className="mt-3 text-xs leading-5 text-[#667085]">Public repositories only for now. Data is fetched from GitHub live; no sample results or invented skill scores.</p>
          </form>
          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-[#f3c7c7] bg-[#fff6f6] px-4 py-3 text-sm text-[#a12828]">{error}</div>
          )}
        </div>

        {result ? (
          <section aria-live="polite" className="mt-8 max-w-3xl overflow-hidden rounded-2xl border border-[#e5e9f0] bg-white">
            <div className="border-b border-[#e5e9f0] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">Live GitHub evidence</p>
                  <h2 className="mt-2 break-all text-2xl font-semibold tracking-[-0.04em]">{result.full_name}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085]">{result.description || "This repository has no description on GitHub."}</p>
                </div>
                <a href={result.url} target="_blank" rel="noreferrer" className="rounded-lg border border-[#e5e9f0] px-3 py-2 text-sm font-medium hover:bg-[#f7f8fb]">View on GitHub ↗</a>
              </div>
              {result.archived && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">GitHub marks this repository as archived.</p>}
            </div>

            <div className="grid grid-cols-2 gap-px bg-[#e5e9f0] sm:grid-cols-4">
              {[
                ["Stars", result.stars.toLocaleString()],
                ["Forks", result.forks.toLocaleString()],
                ["Open issues", result.open_issues.toLocaleString()],
                ["Primary language", result.primary_language || "Not detected"],
              ].map(([label, value]) => (
                <div key={label} className="bg-white p-4">
                  <p className="text-xs text-[#667085]">{label}</p>
                  <p className="mt-1 break-words text-lg font-semibold tracking-[-0.03em]">{value}</p>
                </div>
              ))}
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Language breakdown</h3>
                <span className="text-xs text-[#667085]">Based on GitHub-reported source bytes</span>
              </div>
              {result.languages.length ? (
                <div className="mt-4 space-y-4">
                  {result.languages.map((language) => (
                    <div key={language.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{language.name}</span>
                        <span className="text-[#667085]">{language.percentage}% · {formatBytes(language.bytes)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#edf0f5]">
                        <div className="h-full rounded-full bg-[#315efb]" style={{ width: `${Math.min(language.percentage, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-[#f7f8fb] p-4 text-sm text-[#667085]">GitHub did not report language byte counts for this repository.</p>
              )}

              <div className="mt-6 grid gap-3 rounded-xl bg-[#f7f8fb] p-4 text-sm sm:grid-cols-2">
                <div><span className="text-[#667085]">Default branch</span><p className="mt-1 font-medium">{result.default_branch}</p></div>
                <div><span className="text-[#667085]">License</span><p className="mt-1 font-medium">{result.license_name || "No license detected"}</p></div>
                <div><span className="text-[#667085]">Created</span><p className="mt-1 font-medium">{formatDate(result.created_at)}</p></div>
                <div><span className="text-[#667085]">Last updated</span><p className="mt-1 font-medium">{formatDate(result.updated_at)}</p></div>
              </div>
              <p className="mt-4 rounded-lg border border-[#dce5ff] bg-[#f5f7ff] p-4 text-xs leading-5 text-[#4a5672]">
                <strong>Evidence limitation:</strong> {result.evidence_note}
              </p>
            </div>
          </section>
        ) : (
          <div className="mt-8 max-w-3xl rounded-2xl border border-dashed border-[#d9deea] bg-white/60 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf2ff] text-[#315efb]">↗</div>
              <div>
                <h2 className="text-sm font-semibold">Start with verifiable evidence</h2>
                <p className="mt-2 text-sm leading-6 text-[#667085]">Enter a public repository URL to retrieve live facts from GitHub. Contribution analysis, project tests, and skill challenges will be separate features—not assumed from repository metadata.</p>
              </div>
            </div>
          </div>
        )}
        
        {skillLoading && (
          <p className="mt-5 max-w-3xl text-sm text-[#667085]" role="status">
            Analyzing repository skill evidence…
          </p>
        )}
        
        {skillError && (
          <p
            className="mt-5 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            role="alert"
          >
            Skill analysis could not be loaded: {skillError}
          </p>
        )}
        
        {skillResults && (
          <section className="mt-8 max-w-3xl overflow-hidden rounded-2xl border border-[#e5e9f0] bg-white">
            <div className="border-b border-[#e5e9f0] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                Evidence-based analysis
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Skill evidence
              </h2>
              <p className="mt-2 text-sm text-[#667085]">
                Technologies detected in {skillResults.full_name}.
                Detection indicates repository evidence, not verified proficiency.
              </p>
            </div>
        
            <div className="space-y-3 p-6">
              {skillResults.skills
                .filter((skill) => skill.evidence_found)
                .map((skill) => (
                  <article
                    key={skill.skill}
                    className="rounded-xl border border-[#e5e9f0] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{skill.skill}</h3>
                      <span className="rounded-full bg-[#f0f4ff] px-3 py-1 text-xs font-medium text-[#315efb]">
                        {skill.confidence} confidence
                      </span>
                    </div>
        
                    <p className="mt-2 text-sm leading-6 text-[#667085]">
                      {skill.evidence_summary}
                    </p>
        
                    {skill.evidence_urls.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {skill.evidence_urls.map((evidenceUrl) => (
                          <a
                            key={evidenceUrl}
                            href={evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-sm font-medium text-[#315efb] hover:underline"
                          >
                            View evidence ↗
                          </a>
                        ))}
                      </div>
                    )}
        
                    <p className="mt-3 text-xs leading-5 text-[#667085]">
                      Limitation: {skill.limitations}
                    </p>
                  </article>
                ))}
        
              {!skillResults.skills.some((skill) => skill.evidence_found) && (
                <p className="rounded-lg bg-[#f7f8fb] p-4 text-sm text-[#667085]">
                  No matching technology files were found in the inspected repository.
                </p>
              )}
            </div>
        
            <p className="border-t border-[#e5e9f0] bg-[#f7f8fb] p-4 text-xs leading-5 text-[#667085]">
              {skillResults.evidence_note}
            </p>
          </section>
        )}

        {contributionLoading && (
          <p className="mt-5 max-w-3xl text-sm text-[#667085]" role="status">
            Fetching contributor and commit evidence…
          </p>
        )}

        {contributionError && (
          <p
            className="mt-5 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            role="alert"
          >
            Contribution evidence could not be loaded: {contributionError}
          </p>
        )}

        {contributions && (
          <section className="mt-8 max-w-3xl overflow-hidden rounded-2xl border border-[#e5e9f0] bg-white">
            <div className="border-b border-[#e5e9f0] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">
                Contribution evidence
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Contributors &amp; commits
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                GitHub-reported activity for {contributions.full_name}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px bg-[#e5e9f0]">
              <div className="bg-white p-5">
                <p className="text-xs text-[#667085]">Contributors reported</p>
                <p className="mt-1 text-2xl font-semibold">
                  {contributions.contributors.length}
                </p>
              </div>
              <div className="bg-white p-5">
                <p className="text-xs text-[#667085]">Recent commits returned</p>
                <p className="mt-1 text-2xl font-semibold">
                  {contributions.commits.length}
                </p>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-semibold">Contributors</h3>
              {contributions.contributors.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {contributions.contributors.map((person) => (
                    <div
                      key={person.username}
                      className="flex items-center gap-3 rounded-xl border border-[#e5e9f0] p-3"
                    >
                      {person.avatar_url && (
                        <img
                          src={person.avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <a
                          href={person.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#315efb] hover:underline"
                        >
                          {person.username}
                        </a>
                        <p className="text-xs text-[#667085]">
                          {person.contributions_reported.toLocaleString()} reported contributions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#667085]">
                  GitHub returned no contributor records for this repository.
                </p>
              )}

              <h3 className="mt-8 text-sm font-semibold">Recent commits</h3>
              {contributions.commits.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {contributions.commits.map((commit) => (
                    <article
                      key={commit.sha}
                      className="rounded-xl border border-[#e5e9f0] p-4"
                    >
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-words text-sm font-semibold text-[#315efb] hover:underline"
                      >
                        {commit.message.split("\n")[0] || "Untitled commit"}
                      </a>
                      <p className="mt-2 text-xs text-[#667085]">
                        {commit.author_name || "Unknown author"}
                        {commit.author_username
                          ? ` (@${commit.author_username})`
                          : ""}
                        {" · "}
                        {new Date(commit.committed_at).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-xs text-[#667085]">
                        +{commit.additions} additions · −{commit.deletions} deletions
                        {" · "}{commit.changed_files} files changed
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#667085]">
                  GitHub returned no recent commit records.
                </p>
              )}

              <p className="mt-6 rounded-lg border border-[#dce5ff] bg-[#f5f7ff] p-4 text-xs leading-5 text-[#4a5672]">
                <strong>Evidence limitation:</strong> {contributions.evidence_note}
                {" "}Reported activity does not independently verify identity,
                authorship, or skill.
              </p>
            </div>
          </section>
        )}
        <footer className="mt-14 flex flex-col gap-2 border-t border-[#e5e9f0] pt-5 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">
          <span>Proof of Skill · Evidence-first developer profiles</span>
          <span>Repository metadata is evidence, not a skill certification.</span>
        </footer>
      </section>
    </main>
  );
}
