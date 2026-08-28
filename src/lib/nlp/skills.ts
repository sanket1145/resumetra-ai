/**
 * Skill dictionary.
 *
 * Every entry is a canonical skill name plus optional aliases that are also
 * accepted while scanning text. Extend this file to teach the analyzer new
 * skills; no other module needs to change.
 */

export interface SkillDefinition {
  name: string;
  category: string;
  aliases?: string[];
}

const DICTIONARY: Record<string, Array<[string, string[]?]>> = {
  Programming: [
    ["Python"],
    ["Java", ["core java"]],
    ["C++", ["cpp", "c plus plus"]],
    ["C"],
    ["JavaScript", ["js", "es6"]],
    ["TypeScript", ["ts"]],
    ["Go", ["golang"]],
    ["R"],
  ],
  Data: [
    ["SQL"],
    ["MySQL"],
    ["PostgreSQL", ["postgres"]],
    ["MongoDB", ["mongo"]],
    ["Pandas"],
    ["NumPy", ["numpy"]],
    ["ETL"],
    ["Data Cleaning"],
    ["Data Visualization"],
  ],
  Analytics: [
    ["Power BI", ["powerbi"]],
    ["Excel", ["ms excel", "advanced excel"]],
    ["Tableau"],
    ["Statistics", ["statistical analysis"]],
    ["A/B Testing", ["ab testing"]],
  ],
  "Machine Learning": [
    ["Machine Learning", ["ml"]],
    ["Deep Learning"],
    ["TensorFlow"],
    ["Scikit-learn", ["sklearn", "scikit learn"]],
    ["Keras"],
    ["PyTorch"],
    ["NLP", ["natural language processing"]],
    ["Model Deployment"],
  ],
  "Computer Vision": [
    ["OpenCV", ["open cv"]],
    ["Object Detection", ["yolo"]],
    ["Image Classification"],
    ["Image Processing"],
  ],
  Web: [
    ["React", ["react.js", "reactjs"]],
    ["Node.js", ["nodejs", "node js"]],
    ["Express.js", ["expressjs", "express"]],
    ["HTML", ["html5"]],
    ["CSS", ["css3"]],
    ["REST API", ["rest apis", "restful api", "rest"]],
    ["Flask"],
    ["FastAPI", ["fast api"]],
    ["Django"],
  ],
  Tools: [
    ["Git"],
    ["GitHub"],
    ["Jupyter", ["jupyter notebook"]],
    ["VS Code", ["visual studio code"]],
    ["Docker"],
    ["Linux"],
    ["Postman"],
    ["AWS"],
    ["Azure"],
  ],
  "Soft Skills": [
    ["Communication"],
    ["Teamwork"],
    ["Problem Solving"],
    ["Leadership"],
    ["Time Management"],
  ],
};

export const SKILL_DICTIONARY: SkillDefinition[] = Object.entries(DICTIONARY).flatMap(
  ([category, entries]) =>
    entries.map(([name, aliases]) => ({
      name,
      category,
      ...(aliases ? { aliases } : {}),
    })),
);

export const SKILL_CATEGORIES = Object.keys(DICTIONARY);

export function findSkillDefinition(name: string): SkillDefinition | undefined {
  const lowered = name.toLowerCase();
  return SKILL_DICTIONARY.find((skill) => skill.name.toLowerCase() === lowered);
}
