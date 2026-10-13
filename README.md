# Proof of Skill — MVP Starter

A local VS Code starter for a real GitHub public-repository audit. The first feature accepts a public GitHub repository URL and retrieves live repository metadata and language statistics from GitHub's API. It does not invent scores, claim authorship, or pretend to verify skills.

## Stack
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Python, httpx
- Database: PostgreSQL via Docker Compose (included for the next feature; the first feature does not need to persist data)
- GitHub API: live public repository metadata and languages endpoint

## Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop (optional for the included PostgreSQL service)

## 1. Start PostgreSQL (optional for this first feature)
From the project root:
```bash
docker compose up -d db
```

## 2. Start the backend
Open a terminal:
```bash
cd backend
python -m venv .venv
```
Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```
macOS/Linux:
```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Run backend URL validation tests with `pytest`, then check `http://localhost:8000/health` and API docs at `http://localhost:8000/docs`.

## 3. Start the frontend
In a second terminal:
```bash
cd frontend
npm install
```
Windows PowerShell:
```powershell
Copy-Item .env.local.example .env.local
npm run dev
```
macOS/Linux:
```bash
cp .env.local.example .env.local
npm run dev
```
Open `http://localhost:3000`.

## What the first feature does
1. User enters a public GitHub URL such as `https://github.com/fastapi/fastapi`.
2. Frontend sends it to FastAPI.
3. Backend validates the host/path and calls GitHub's public REST API.
4. UI displays real repository metadata, detected languages, and a clear evidence disclaimer.

## Important limitations
- Only public repositories are supported in this first iteration.
- GitHub API rate limits apply. Configure `GITHUB_TOKEN` in `backend/.env` if you need authenticated API quota. Use a fine-grained token with read-only public repository metadata access; never expose it in frontend variables.
- Language percentages are derived from GitHub's byte counts and are not a measure of skill.
- Repository metadata and commit history do not prove who authored code or whether a person understands it.
- No AI score is shown yet. We will add evidence-backed analysis after the data collection feature is tested.
