# AI Resume Analyzer & Job Matcher

Upload a resume, paste a job description, and get a transparent match score with the skills you have, the skills you're missing, and concrete ways to improve.

**Live app:** https://resumetra-ai.lovable.app

## Features

- **Resume upload** — PDF or DOCX, text extracted in the browser (up to 5 MB)
- **Structured parsing** — name, email, phone, links, plus Summary, Education, Experience, Projects and Certifications sections
- **Skill extraction** — dictionary-driven detection across programming, data, ML, web, cloud and tools categories
- **Job matching** — required vs preferred skills pulled from the job description
- **Transparent score** — `(matched required x 1 + matched preferred x 0.5) / (total required x 1 + total preferred x 0.5) x 100`, with the full breakdown shown
- **Improvement suggestions** — rule-based, optionally rewritten in natural language by an LLM
- **Analysis history & export** — every analysis is saved; reports can be printed or downloaded
- **Accounts** — email + password sign-in; each user only sees their own data
- **Agent access** — an OAuth-protected MCP endpoint at `/mcp` lets assistants list resumes, add a resume and run a match

## Pages

Dashboard · Resume Analyzer · Job Matcher · Analysis History · About

## Tech stack

- **Frontend:** React 19, TanStack Router/Start, Tailwind CSS
- **Server:** TypeScript server functions (REST-style endpoints under `src/routes/api`)
- **NLP:** in-house text processing — section detection, boundary-aware skill matching, keyword ranking
- **Database:** Postgres with row-level security
- **Document parsing:** pdf.js (PDF) and mammoth (DOCX)

A reference implementation of the original architecture — Express REST API, Python/spaCy NLP service and MySQL schema — lives in [`reference/`](reference/) for anyone who wants to run that stack locally.

## Project structure

```
src/lib/nlp/         resume & job parsing, skill extraction, match scoring
src/lib/             text extraction, server functions, LLM layer, MCP tools
src/routes/          pages and API routes
reference/           Express + Python/spaCy + MySQL version
```

## Run locally

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
npm run dev
```

Open http://localhost:8080. Copy the six values from the project's `.env` file if it isn't present after cloning.

Full instructions, including the MySQL + Python option, are in [RUNNING_LOCALLY.md](RUNNING_LOCALLY.md).
