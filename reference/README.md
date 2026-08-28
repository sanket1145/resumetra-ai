# AI Resume Analyzer & Job Matcher — local reference stack

The deployed app in this repository runs the full pipeline (resume parsing, skill
extraction, transparent scoring, LLM suggestions) on the hosted TypeScript
runtime with a managed Postgres database.

This folder contains an equivalent local stack for the classic architecture:

```
React frontend  ->  Node.js + Express REST API  ->  Python NLP service  ->  MySQL
```

Contents:

- `mysql/schema.sql` — MySQL schema: `users`, `resumes`, `job_descriptions`,
  `resume_skills`, `job_skills`, `analyses`.
- `python-nlp-service/` — FastAPI service that extracts text from PDF/DOCX,
  parses resume sections and skills, parses job descriptions and computes the
  match score with the same formula the app uses.
- `node-api/` — Express REST API that stores users, resumes, jobs and analyses
  in MySQL and delegates all text processing to the Python service.

## Run order

```bash
# 1. database
mysql -u root -p < mysql/schema.sql

# 2. python NLP service (port 8000)
cd python-nlp-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app:app --reload --port 8000

# 3. node API (port 4000)
cd ../node-api
npm install
cp .env.example .env   # set MySQL credentials and NLP_SERVICE_URL
npm start
```

## Matching formula

Identical to the app:

```
score = (matched_required * 1.0 + matched_preferred * 0.5)
      / (total_required   * 1.0 + total_preferred   * 0.5) * 100
```

Required skills are those in must-have context ("required", "must have",
"minimum qualifications"); preferred skills come from "preferred", "nice to
have", "bonus" context.
