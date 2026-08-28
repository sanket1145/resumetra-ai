# Running AI Resume Analyzer & Job Matcher on your own machine

There are two ways to run this project locally. Both work — pick based on what you need.

- **Option A** — run the exact app you published (React + TanStack Start + hosted Postgres). Fastest, everything already works.
- **Option B** — run the classic architecture from `reference/`: React frontend + Node/Express REST API + Python NLP service + **MySQL you can open and browse locally**.

---

## Option A — run the published app locally

### 1. Requirements
- Node.js 20 or newer (`node -v`)
- npm (comes with Node)
- Git

### 2. Get the code
Connect the project to GitHub from the editor (top-right → GitHub), then:

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
```

### 3. Environment variables
The repo already contains a `.env` file with the backend connection values:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
```

If `.env` is missing after cloning (it can be git-ignored), copy those five values from the editor's `.env` file into a new `.env` at the project root.

Note: the AI suggestion feature uses a server-side key that only exists in the hosted environment. Locally, matching, parsing and scoring work fully; the AI-written suggestions fall back to the rule-based suggestions unless you set your own LLM key.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:8080. Sign in with the same account you use on the published site — it talks to the same hosted database, so your resumes and analyses are all there.

### 5. Production build

```bash
npm run build
npm run preview
```

### 6. Seeing the database
The app's database is managed Postgres in the cloud. You view it from the editor's **Backend / Database** view (tables: `profiles`, `resumes`, `job_descriptions`, `resume_skills`, `job_skills`, `analyses`). There is no downloadable password for it, so it cannot be opened in a local desktop client.

**If you want a database on your own machine that you can browse with MySQL Workbench / phpMyAdmin, use Option B.**

---

## Option B — the local Python + MySQL stack (`reference/`)

This is the architecture from the original spec, fully implemented and runnable offline:

```
React frontend  ->  Node.js + Express REST API  ->  Python NLP service  ->  MySQL
```

### 1. Requirements
- MySQL 8 (server + Workbench or phpMyAdmin)
- Python 3.10+
- Node.js 20+

### 2. Create the database

```bash
mysql -u root -p < reference/mysql/schema.sql
```

This creates the `resume_matcher` database with the six tables. Open MySQL Workbench → connect to `localhost:3306` → schema `resume_matcher` and you can browse/query every row as data comes in.

### 3. Start the Python NLP service (port 8000)

```bash
cd reference/python-nlp-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app:app --reload --port 8000
```

Check http://localhost:8000/docs for the interactive API docs.

### 4. Start the Express REST API (port 4000)

```bash
cd reference/node-api
npm install
cp .env.example .env
```

Edit `.env`:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=resume_matcher
JWT_SECRET=any-long-random-string
NLP_SERVICE_URL=http://localhost:8000
# optional, enables LLM suggestions
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

Then:

```bash
npm start
```

Health check: http://localhost:4000/api/health

### 5. Try the API

```bash
# register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sanket","email":"me@example.com","password":"StrongPass!2026"}'

# login -> copy the token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"StrongPass!2026"}'

# upload a resume
curl -X POST http://localhost:4000/api/resumes \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/resume.pdf"

# run a match
curl -X POST http://localhost:4000/api/analyses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"resumeId":1,"title":"Backend Engineer","company":"Acme","jobText":"Required: Python, SQL, Docker. Preferred: AWS."}'
```

After each call, refresh MySQL Workbench — rows appear in `resumes`, `resume_skills`, `job_descriptions`, `job_skills` and `analyses`.

### 6. Pointing the React UI at this API
The React pages in `src/` call TanStack server functions. To drive the Express API instead, replace the calls in `src/lib/analyzer.functions.ts` with `fetch("http://localhost:4000/api/...")` requests that send the JWT from login in the `Authorization` header. The request/response shapes are intentionally the same.

---

## Matching formula (identical in both stacks)

```
score = (matched_required * 1.0 + matched_preferred * 0.5)
      / (total_required   * 1.0 + total_preferred   * 0.5) * 100
```

## Common issues

| Problem | Fix |
| --- | --- |
| `npm run dev` port already used | Stop the other process or run `npm run dev -- --port 3000` |
| Blank page + console error about missing Supabase variables | `.env` missing at the project root (Option A step 3) |
| `ER_ACCESS_DENIED_ERROR` from the Express API | Wrong `MYSQL_USER` / `MYSQL_PASSWORD` in `reference/node-api/.env` |
| `OSError: [E050] Can't find model 'en_core_web_sm'` | Run `python -m spacy download en_core_web_sm` inside the activated venv |
| Express returns `502` on upload | Python service on port 8000 isn't running |
