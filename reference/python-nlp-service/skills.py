"""Skill dictionary shared by resume and job-description parsing."""

SKILLS: dict[str, dict] = {
    "Python": {"category": "Programming", "aliases": ["python3"]},
    "Java": {"category": "Programming", "aliases": []},
    "JavaScript": {"category": "Programming", "aliases": ["js", "es6"]},
    "TypeScript": {"category": "Programming", "aliases": ["ts"]},
    "C++": {"category": "Programming", "aliases": ["cpp"]},
    "SQL": {"category": "Data", "aliases": []},
    "MySQL": {"category": "Data", "aliases": []},
    "PostgreSQL": {"category": "Data", "aliases": ["postgres"]},
    "MongoDB": {"category": "Data", "aliases": ["mongo"]},
    "Pandas": {"category": "Data", "aliases": []},
    "NumPy": {"category": "Data", "aliases": ["numpy"]},
    "Excel": {"category": "Data", "aliases": ["ms excel"]},
    "Power BI": {"category": "Data", "aliases": ["powerbi"]},
    "Tableau": {"category": "Data", "aliases": []},
    "Statistics": {"category": "Data", "aliases": ["statistical analysis"]},
    "A/B Testing": {"category": "Data", "aliases": ["ab testing", "split testing"]},
    "Machine Learning": {"category": "AI", "aliases": ["ml"]},
    "Deep Learning": {"category": "AI", "aliases": []},
    "NLP": {"category": "AI", "aliases": ["natural language processing"]},
    "Scikit-learn": {"category": "AI", "aliases": ["sklearn", "scikit learn"]},
    "TensorFlow": {"category": "AI", "aliases": []},
    "PyTorch": {"category": "AI", "aliases": []},
    "React": {"category": "Web", "aliases": ["react.js", "reactjs"]},
    "Node.js": {"category": "Web", "aliases": ["node", "nodejs"]},
    "Express.js": {"category": "Web", "aliases": ["express"]},
    "REST APIs": {"category": "Web", "aliases": ["rest api", "restful"]},
    "HTML5": {"category": "Web", "aliases": ["html"]},
    "CSS3": {"category": "Web", "aliases": ["css"]},
    "Flask": {"category": "Web", "aliases": []},
    "Django": {"category": "Web", "aliases": []},
    "Docker": {"category": "Tools", "aliases": []},
    "Git": {"category": "Tools", "aliases": []},
    "GitHub": {"category": "Tools", "aliases": []},
    "Linux": {"category": "Tools", "aliases": []},
    "AWS": {"category": "Cloud", "aliases": ["amazon web services"]},
    "Azure": {"category": "Cloud", "aliases": []},
    "Jupyter": {"category": "Tools", "aliases": ["jupyter notebook"]},
    "VS Code": {"category": "Tools", "aliases": ["visual studio code"]},
    "Communication": {"category": "Soft skills", "aliases": ["communication skills"]},
    "Teamwork": {"category": "Soft skills", "aliases": ["collaboration"]},
    "Problem Solving": {"category": "Soft skills", "aliases": ["problem-solving"]},
}


def all_terms() -> list[tuple[str, str, str]]:
    """Return (canonical_skill, category, searchable_term) triples."""
    out: list[tuple[str, str, str]] = []
    for name, meta in SKILLS.items():
        out.append((name, meta["category"], name.lower()))
        for alias in meta["aliases"]:
            out.append((name, meta["category"], alias.lower()))
    return out
