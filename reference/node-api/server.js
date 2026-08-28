import "dotenv/config";

import cors from "cors";
import express from "express";
import multer from "multer";

import { login, register, requireAuth } from "./auth.js";
import { query } from "./db.js";
import { extractText, llmSuggestions, parseJob, parseResume, runMatch } from "./nlp.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

/* ---------------------------------------------------------------- auth ---- */

app.post("/api/auth/register", async (req, res) => {
  try {
    res.status(201).json(await register(req.body));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    res.json(await login(req.body));
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

/* ------------------------------------------------------------- resumes ---- */

app.post("/api/resumes", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "A PDF or DOCX file is required." });
    const fileType = req.file.originalname.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";
    const { text } = await extractText(req.file.buffer, req.file.originalname, req.file.mimetype);
    const parsed = await parseResume(text);

    const inserted = await query(
      `INSERT INTO resumes
         (user_id, file_name, file_type, file_size, raw_text, candidate_name,
          candidate_email, candidate_phone, links, sections)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        req.file.originalname,
        fileType,
        req.file.size,
        text,
        parsed.name,
        parsed.email,
        parsed.phone,
        JSON.stringify(parsed.links),
        JSON.stringify(parsed.sections),
      ],
    );

    for (const skill of parsed.skills) {
      await query(
        `INSERT INTO resume_skills (resume_id, skill, category, mentions)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE mentions = VALUES(mentions)`,
        [inserted.insertId, skill.name, skill.category, skill.mentions],
      );
    }

    res.status(201).json({ resumeId: inserted.insertId, parsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/resumes", requireAuth, async (req, res) => {
  res.json(
    await query(
      `SELECT id, file_name, file_type, candidate_name, created_at
         FROM resumes WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId],
    ),
  );
});

/* ---------------------------------------------------------------- jobs ---- */

app.post("/api/jobs/parse", requireAuth, async (req, res) => {
  try {
    res.json(await parseJob(req.body.text ?? ""));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------------ analyses ---- */

app.post("/api/analyses", requireAuth, async (req, res) => {
  try {
    const { resumeId, title, company, jobText, useLlm = true } = req.body;
    const resumeRows = await query("SELECT raw_text FROM resumes WHERE id = ? AND user_id = ?", [
      resumeId,
      req.userId,
    ]);
    if (!resumeRows.length) return res.status(404).json({ error: "Resume not found." });

    const { resume, job, analysis } = await runMatch(resumeRows[0].raw_text, jobText);

    const jobInsert = await query(
      `INSERT INTO job_descriptions (user_id, title, company, raw_text, keywords)
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId, title, company ?? null, jobText, JSON.stringify(job.keywords)],
    );
    for (const skill of job.skills) {
      await query(
        `INSERT INTO job_skills (job_id, skill, category, importance)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE importance = VALUES(importance)`,
        [jobInsert.insertId, skill.name, skill.category, skill.importance],
      );
    }

    let summary = null;
    let suggestions = analysis.suggestions;
    let source = "rules";
    if (useLlm) {
      const llm = await llmSuggestions({ analysis, resume, job });
      if (llm?.suggestions?.length) {
        summary = llm.summary ?? null;
        suggestions = llm.suggestions;
        source = "llm";
      }
    }

    const saved = await query(
      `INSERT INTO analyses
         (user_id, resume_id, job_id, match_score, matching_skills, missing_skills,
          extra_skills, strengths, suggestions, score_breakdown, llm_summary, suggestion_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        resumeId,
        jobInsert.insertId,
        analysis.score,
        JSON.stringify(analysis.matching_skills),
        JSON.stringify(analysis.missing_skills),
        JSON.stringify(analysis.extra_skills),
        JSON.stringify(analysis.strengths),
        JSON.stringify(suggestions),
        JSON.stringify(analysis.breakdown),
        summary,
        source,
      ],
    );

    res.status(201).json({ analysisId: saved.insertId, ...analysis, suggestions, summary, source });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/analyses", requireAuth, async (req, res) => {
  res.json(
    await query(
      `SELECT a.id, a.match_score, a.created_at, j.title, j.company, r.file_name
         FROM analyses a
         JOIN job_descriptions j ON j.id = a.job_id
         JOIN resumes r ON r.id = a.resume_id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC`,
      [req.userId],
    ),
  );
});

app.get("/api/analyses/:id", requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT a.*, j.title, j.company, j.raw_text AS job_text, r.file_name
       FROM analyses a
       JOIN job_descriptions j ON j.id = a.job_id
       JOIN resumes r ON r.id = a.resume_id
      WHERE a.id = ? AND a.user_id = ?`,
    [req.params.id, req.userId],
  );
  if (!rows.length) return res.status(404).json({ error: "Analysis not found." });
  res.json(rows[0]);
});

app.delete("/api/analyses/:id", requireAuth, async (req, res) => {
  await query("DELETE FROM analyses WHERE id = ? AND user_id = ?", [req.params.id, req.userId]);
  res.status(204).end();
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`REST API listening on http://localhost:${port}`));
