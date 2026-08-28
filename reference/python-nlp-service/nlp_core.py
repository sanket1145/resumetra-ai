"""Resume / job-description parsing, skill extraction and match scoring."""

from __future__ import annotations

import re
from typing import Iterable

import spacy

from skills import all_terms

# spaCy is used for sentence segmentation and noun-chunk keyword extraction.
try:
    NLP = spacy.load("en_core_web_sm")
except OSError:  # pragma: no cover - model not downloaded yet
    NLP = spacy.blank("en")
    NLP.add_pipe("sentencizer")

TERMS = all_terms()

SECTION_HEADINGS = {
    "education": ["education", "academic background", "academics"],
    "experience": ["experience", "work experience", "employment", "internship"],
    "projects": ["projects", "personal projects", "academic projects"],
    "skills": ["skills", "technical skills", "core competencies"],
    "certifications": ["certifications", "certificates", "courses", "licenses"],
    "summary": ["summary", "objective", "profile", "about"],
}

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}")
URL_RE = re.compile(r"(?:https?://|www\.)[^\s,)]+", re.I)

REQUIRED_CUES = ["required", "must have", "must-have", "minimum qualification", "requirements"]
PREFERRED_CUES = ["preferred", "nice to have", "nice-to-have", "bonus", "plus", "desirable"]


def normalize(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text.replace("\r\n", "\n").replace("\r", "\n"))


def contains_term(haystack_lower: str, term: str) -> int:
    """Boundary-aware count of a term inside already-lowercased text."""
    pattern = r"(?<![a-z0-9+#.])" + re.escape(term) + r"(?![a-z0-9+#])"
    return len(re.findall(pattern, haystack_lower))


def extract_skills(text: str) -> list[dict]:
    lower = text.lower()
    found: dict[str, dict] = {}
    for name, category, term in TERMS:
        count = contains_term(lower, term)
        if count:
            entry = found.setdefault(name, {"name": name, "category": category, "mentions": 0})
            entry["mentions"] += count
    return sorted(found.values(), key=lambda item: (-item["mentions"], item["name"]))


def _heading_for(line: str) -> str | None:
    cleaned = re.sub(r"[^a-z ]", "", line.strip().lower()).strip()
    if not cleaned or len(cleaned) > 40:
        return None
    for key, variants in SECTION_HEADINGS.items():
        if cleaned in variants:
            return key
    return None


def split_sections(text: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {key: [] for key in SECTION_HEADINGS}
    current: str | None = None
    for raw_line in normalize(text).split("\n"):
        line = raw_line.strip()
        if not line:
            continue
        heading = _heading_for(line)
        if heading:
            current = heading
            continue
        if current:
            sections[current].append(line)
    return sections


def guess_name(text: str) -> str | None:
    for line in normalize(text).split("\n"):
        line = line.strip()
        if not line or EMAIL_RE.search(line) or PHONE_RE.search(line):
            continue
        words = line.split()
        if 1 < len(words) <= 4 and all(w[:1].isupper() for w in words if w[:1].isalpha()):
            return line
    return None


def parse_resume(text: str) -> dict:
    sections = split_sections(text)
    email = EMAIL_RE.search(text)
    phone = PHONE_RE.search(text)
    return {
        "name": guess_name(text),
        "email": email.group(0) if email else None,
        "phone": phone.group(0) if phone else None,
        "links": sorted(set(URL_RE.findall(text))),
        "sections": sections,
        "skills": extract_skills(text),
    }


def _importance_for(sentence_lower: str) -> str:
    if any(cue in sentence_lower for cue in PREFERRED_CUES):
        return "preferred"
    return "required"


def keywords(text: str, limit: int = 25) -> list[str]:
    doc = NLP(text)
    seen: dict[str, int] = {}
    for chunk in getattr(doc, "noun_chunks", []):
        phrase = chunk.text.strip().lower()
        if 2 < len(phrase) <= 40:
            seen[phrase] = seen.get(phrase, 0) + 1
    ranked = sorted(seen.items(), key=lambda kv: (-kv[1], kv[0]))
    return [phrase for phrase, _ in ranked[:limit]]


def parse_job(text: str) -> dict:
    """Extract skills with required/preferred importance from a job description."""
    doc = NLP(normalize(text))
    sentences: Iterable[str] = [s.text for s in doc.sents] if doc.has_annotation("SENT_START") else text.split("\n")
    resolved: dict[str, dict] = {}
    context = "required"
    for sentence in sentences:
        lower = sentence.lower()
        if any(cue in lower for cue in PREFERRED_CUES):
            context = "preferred"
        elif any(cue in lower for cue in REQUIRED_CUES):
            context = "required"
        importance = _importance_for(lower) if any(c in lower for c in PREFERRED_CUES + REQUIRED_CUES) else context
        for skill in extract_skills(sentence):
            existing = resolved.get(skill["name"])
            if existing is None or (existing["importance"] == "preferred" and importance == "required"):
                resolved[skill["name"]] = {
                    "name": skill["name"],
                    "category": skill["category"],
                    "importance": importance,
                }
    return {"skills": list(resolved.values()), "keywords": keywords(text)}


def match(resume: dict, job: dict) -> dict:
    resume_names = {skill["name"] for skill in resume["skills"]}
    job_skills = job["skills"]

    matching = [s for s in job_skills if s["name"] in resume_names]
    missing = [s for s in job_skills if s["name"] not in resume_names]
    job_names = {s["name"] for s in job_skills}
    extra = [s for s in resume["skills"] if s["name"] not in job_names]

    required = [s for s in job_skills if s["importance"] == "required"]
    preferred = [s for s in job_skills if s["importance"] == "preferred"]
    matched_required = [s for s in matching if s["importance"] == "required"]
    matched_preferred = [s for s in matching if s["importance"] == "preferred"]

    possible = len(required) * 1.0 + len(preferred) * 0.5
    earned = len(matched_required) * 1.0 + len(matched_preferred) * 0.5
    score = round((earned / possible) * 100, 1) if possible else 0.0

    strengths: list[str] = []
    if len(resume["skills"]) >= 10:
        strengths.append(f"Broad technical skill coverage: {len(resume['skills'])} recognised skills detected.")
    if resume["sections"]["projects"]:
        strengths.append(f"Project section is well developed ({len(resume['sections']['projects'])} lines of detail).")
    if resume["sections"]["experience"]:
        strengths.append("Work or internship experience is documented.")
    if resume["sections"]["certifications"]:
        strengths.append("Certifications or courses are included.")
    if resume["email"] and resume["phone"]:
        strengths.append("Contact details are complete and easy to parse.")

    suggestions = [
        f"{skill['name']} is {skill['importance']} for this role but was not detected — add it if you have exposure."
        for skill in missing[:6]
    ]
    if not resume["sections"]["skills"]:
        suggestions.append("Add a dedicated 'Technical Skills' section so parsers can find your stack quickly.")
    if not resume["links"]:
        suggestions.append("Include a GitHub or LinkedIn link.")

    return {
        "score": score,
        "matching_skills": matching,
        "missing_skills": missing,
        "extra_skills": extra,
        "strengths": strengths,
        "suggestions": suggestions,
        "breakdown": {
            "required_total": len(required),
            "required_matched": len(matched_required),
            "preferred_total": len(preferred),
            "preferred_matched": len(matched_preferred),
            "earned_points": earned,
            "possible_points": possible,
            "formula": "(matched required x 1 + matched preferred x 0.5) / (total required x 1 + total preferred x 0.5) x 100",
        },
    }
