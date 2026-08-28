-- AI Resume Analyzer & Job Matcher — MySQL schema
CREATE DATABASE IF NOT EXISTS resume_matcher
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE resume_matcher;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(160),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS resumes (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED NOT NULL,
  file_name         VARCHAR(255) NOT NULL,
  file_type         ENUM('pdf','docx') NOT NULL,
  file_size         INT UNSIGNED NOT NULL DEFAULT 0,
  raw_text          MEDIUMTEXT NOT NULL,
  candidate_name    VARCHAR(160),
  candidate_email   VARCHAR(255),
  candidate_phone   VARCHAR(64),
  links             JSON,
  sections          JSON,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_resumes_user (user_id, created_at)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS job_descriptions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  company     VARCHAR(200),
  raw_text    MEDIUMTEXT NOT NULL,
  keywords    JSON,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_jobs_user (user_id, created_at)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS resume_skills (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resume_id  INT UNSIGNED NOT NULL,
  skill      VARCHAR(120) NOT NULL,
  category   VARCHAR(80) NOT NULL,
  mentions   INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resume_skills_resume FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE CASCADE,
  UNIQUE KEY uq_resume_skill (resume_id, skill)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS job_skills (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id     INT UNSIGNED NOT NULL,
  skill      VARCHAR(120) NOT NULL,
  category   VARCHAR(80) NOT NULL,
  importance ENUM('required','preferred') NOT NULL DEFAULT 'required',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_skills_job FOREIGN KEY (job_id) REFERENCES job_descriptions (id) ON DELETE CASCADE,
  UNIQUE KEY uq_job_skill (job_id, skill)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS analyses (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id            INT UNSIGNED NOT NULL,
  resume_id          INT UNSIGNED NOT NULL,
  job_id             INT UNSIGNED NOT NULL,
  match_score        DECIMAL(5,2) NOT NULL,
  matching_skills    JSON,
  missing_skills     JSON,
  extra_skills       JSON,
  strengths          JSON,
  suggestions        JSON,
  score_breakdown    JSON,
  llm_summary        TEXT,
  suggestion_source  ENUM('rules','llm') NOT NULL DEFAULT 'rules',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analyses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_analyses_resume FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE CASCADE,
  CONSTRAINT fk_analyses_job FOREIGN KEY (job_id) REFERENCES job_descriptions (id) ON DELETE CASCADE,
  INDEX idx_analyses_user (user_id, created_at)
) ENGINE = InnoDB;
