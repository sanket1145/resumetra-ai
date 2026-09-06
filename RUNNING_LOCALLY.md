# Running AI Resume Analyzer & Job Matcher locally (with a local MySQL database)

Follow these steps in order. This runs the full stack on your machine:

```
React frontend (8080)  ->  Node/Express REST API (4000)  ->  Python NLP service (8000)  ->  MySQL (3306)
```

## 1. Install the requirements

- Node.js 20+ (`node -v`)
- Python 3.10+ (`python --version`)
- MySQL 8 server + MySQL Workbench

## 2. Get the code

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
```

## 3. Create the local database

```bash
mysql -u root -p < reference/mysql/schema.sql
```

Open MySQL Workbench → connect to `localhost:3306` → schema `resume_matcher`.
You now have the six tables: `users`, `resumes`, `job_descriptions`,
`resume_skills`, `job_skills`, `analyses`.

## 4. Start the Python NLP service (terminal 1)

```bash
cd reference/python-nlp-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## 5. Start the Express API (terminal 2)

```bash
cd reference/node-api
npm install
cp .env.example .env
```

Edit `reference/node-api/.env`:

```
PORT=4000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=resume_matcher
JWT_SECRET=any-long-random-string
NLP_SERVICE_URL=http://localhost:8000
# optional, enables LLM-written suggestions
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

Then:

```bash
npm start
```

Health check: http://localhost:4000/api/health

## 6. Start the frontend (terminal 3)

From the project root:

```bash
npm run dev
```

Open http://localhost:8080.

The `.env` file at the project root holds the hosted backend values used by the
published site. Keep it as is — the frontend needs it to boot. If it is missing
after cloning, copy the six `VITE_SUPABASE_*` / `SUPABASE_*` values from the
editor's `.env`.

## 7. Verify data lands in your local MySQL

```bash
# register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sanket","email":"me@example.com","password":"StrongPass!2026"}'

# login -> copy the token from the response
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

Refresh MySQL Workbench after each call — rows appear in `users`, `resumes`,
`resume_skills`, `job_descriptions`, `job_skills` and `analyses`.

## 8. Point the React UI at your local API (optional but recommended)

The pages in `src/` call TanStack server functions. To drive the local Express
API instead, replace the calls in `src/lib/analyzer.functions.ts` with
`fetch("http://localhost:4000/api/...")` requests that send the login JWT in the
`Authorization` header. Request and response shapes are identical.

## Matching formula

```
score = (matched_required * 1.0 + matched_preferred * 0.5)
      / (total_required   * 1.0 + total_preferred   * 0.5) * 100
```

## Common issues

| Problem | Fix |
| --- | --- |
| Port 8080 in use | `npm run dev -- --port 3000` |
| Blank page, console mentions missing environment variables | `.env` missing at project root (step 6) |
| `ER_ACCESS_DENIED_ERROR` from the API | Wrong MySQL user/password in `reference/node-api/.env` |
| `OSError: [E050] Can't find model 'en_core_web_sm'` | Run `python -m spacy download en_core_web_sm` in the activated venv |
| API returns `502` on upload | Python service on port 8000 isn't running |
