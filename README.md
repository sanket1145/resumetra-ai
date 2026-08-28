# Resume Matcher Pro

Build a complete, functional full-stack web application called “AI Resume Analyzer & Job Matcher”.

The application should be professional enough to demonstrate as a portfolio project in a technical interview. Do NOT create only a static UI or mock dashboard. Implement the core functionality end-to-end.

1. PROJECT OBJECTIVE

The application should allow a user to:

Upload a resume in PDF or DOCX format.

Extract the resume text.

Analyze the resume using Python-based NLP/text-processing techniques.

Extract important information such as:

Candidate name

Email

Phone number

Technical skills

Education

Experience

Projects

Certifications

Enter or paste a job description.

Extract important skills and keywords from the job description.

Compare the resume against the job description.

Calculate a transparent resume-job match score.

Show:

Matching skills

Missing skills

Job-relevant skills

Resume strengths

Areas for improvement

Optionally use an LLM to generate natural-language improvement suggestions based only on the extracted resume and job-description information.

Display the analysis in a clean, modern dashboard.

Allow the user to download/export the analysis report.

The application must be functional and use real data throughout the workflow.

2. TECHNOLOGY STACK

Use the following technologies:

Frontend

React.js

JavaScript

HTML5

CSS3

Responsive design

Use a clean component-based architecture.

Backend

Node.js

Express.js

REST APIs

NLP / Resume Processing

Python

Python NLP/text-processing libraries

Regular expressions for structured information extraction

spaCy or another lightweight NLP library where appropriate

PDF/DOCX text extraction libraries

Database

MySQL

AI / LLM

LLM integration through an API

Use an environment variable for the API key.

Never hard-code API keys.

The application must continue to work for the core resume matching functionality even if the LLM API is unavailable.

Optional frontend libraries

Use only lightweight and well-supported libraries where useful, such as:

Axios

React Router

Chart.js or Recharts

Lucide React icons

Do NOT introduce unnecessary frameworks or technologies.

3. SYSTEM ARCHITECTURE

Use a modular architecture:

React Frontend
↓
Node.js + Express REST API
↓
Python NLP Service
↓
MySQL Database

The Node.js backend should act as the main API layer.

The Python service should handle:

Resume text processing

NLP analysis

Skill extraction

Job description processing

Keyword extraction

Resume/job matching

The Node.js backend should handle:

API routing

File upload

Authentication if implemented

Communication with Python service

Database operations

LLM API communication

Report generation

MySQL should store:

Users

Resumes

Job descriptions

Extracted skills

Analysis results

Match scores

Reports

Keep the architecture understandable enough for a student developer to explain during an interview.

4. FRONTEND DESIGN

Create a professional modern interface.

Use a clean light theme with:

White/light background

Dark text

Blue or indigo accent

Cards

Rounded corners

Good spacing

Responsive layout

Do not make the design overly flashy.

Main Navigation

Create:

Dashboard

Resume Analyzer

Job Matcher

Analysis History

About

Top navigation should show the application name:

AI Resume Analyzer

and a simple navigation menu.

5. LANDING / HOME PAGE

Create a professional landing page.

Hero section:

AI Resume Analyzer & Job Matcher

Subtitle:

“Analyze your resume, compare it with job descriptions, identify skill gaps, and get actionable improvement insights.”

Buttons:

Analyze My Resume
Try Job Matcher

Add three feature cards:

Resume Analysis

Extract skills, education, experience, projects and certifications from your resume.

Job Matching

Compare your resume against a target job description.

Skill Gap Analysis

Identify matching and missing skills and understand where your resume can improve.

Add a small “How it works” section:

Upload Resume

Add Job Description

Analyze

Review Results

6. RESUME UPLOAD PAGE

Create a dedicated Resume Analyzer page.

Allow:

PDF upload

DOCX upload

Display:

Drag-and-drop upload area

Browse Files button

File name

File size

Upload progress

Remove file button

Analyze Resume button

Validation:

Only PDF and DOCX

Reasonable file-size limit

Show clear error messages

After upload, send the file to the Node.js backend.

Node.js should pass the extracted/processed content to the Python NLP service.

7. RESUME TEXT EXTRACTION

Implement actual text extraction.

For PDF:

Extract selectable text.

For DOCX:

Extract document text.

Do not simply store the uploaded file and pretend analysis happened.

If text extraction fails:
Show:

“Unable to extract readable text from this document. Please upload a text-based PDF or DOCX resume.”

8. PYTHON NLP SERVICE

Create a separate Python service.

Suggested structure:

python-service/
app.py
requirements.txt
services/
resume_parser.py
skill_extractor.py
job_parser.py
matcher.py
text_processor.py
llm_helper.py

Use a lightweight REST API framework such as Flask or FastAPI.

Create endpoints such as:

POST /analyze-resume

POST /analyze-job-description

POST /match-resume

9. RESUME NLP PROCESSING

The Python NLP service should extract:

Personal Information

Name

Email

Phone

Use regular expressions where appropriate.

Skills

Create a skill dictionary containing common categories such as:

Programming:

Python

Java

C++

JavaScript

Data:

SQL

MySQL

PostgreSQL

Pandas

NumPy

Analytics:

Power BI

Excel

Tableau

Machine Learning:

Machine Learning

TensorFlow

Scikit-learn

Keras

Computer Vision:

OpenCV

Object Detection

Image Classification

Web:

React

Node.js

Express.js

Tools:

Git

GitHub

Jupyter

VS Code

The skill dictionary must be stored in a separate configuration file so it can be extended easily.

Do case-insensitive matching.

Avoid duplicate skills.

10. JOB DESCRIPTION PROCESSING

Allow the user to paste a job description into a large text area.

Add:

Analyze Job Description

The Python service should identify:

Required skills

Preferred skills

Technical keywords

Important technologies

Display extracted skills as tags.

Example:

Required Skills:
Python
SQL
Machine Learning
TensorFlow

Preferred Skills:
Power BI
OpenCV

11. RESUME-JOB MATCHING ALGORITHM

Implement an understandable and transparent scoring system.

Do NOT create a fake AI score.

Calculate the score based on actual extracted skills.

Example:

Resume skills:
Python
SQL
Pandas
TensorFlow

Job skills:
Python
SQL
TensorFlow
Power BI
OpenCV

Matching skills:
Python
SQL
TensorFlow

Missing skills:
Power BI
OpenCV

Basic match score:

matched required skills / total required skills × 100

Add reasonable weighting for required versus preferred skills if implemented.

Show the calculation methodology in an “How is this score calculated?” tooltip/modal.

Example:

Match Score: 75%

Matched:
3 / 4 required skills

This makes the system explainable.

12. ANALYSIS RESULTS PAGE

After analysis, display a professional dashboard.

Top section:

Resume Analysis Complete

Cards:

Match Score

75%

Matching Skills

12

Missing Skills

4

Resume Strengths

8

Use a circular progress indicator or clean progress bar for the match score.

13. MATCHING SKILLS

Display matching skills as green/positive tags.

Example:

Python
SQL
TensorFlow
Pandas

14. MISSING SKILLS

Display missing job-relevant skills separately.

Example:

Power BI
OpenCV
Docker

Add a short explanation:

“These skills were found in the job description but were not detected in the uploaded resume.”

Do not claim the candidate actually lacks a skill if it may simply not have been mentioned. Use wording such as:

“Not detected in resume”

instead of:

“You do not know this skill.”

15. RESUME STRENGTHS

Generate rule-based insights such as:

Strong technical skill coverage

Relevant programming skills

Relevant project experience

Good certification coverage

Relevant internship experience

Only generate insights supported by the resume content.

16. IMPROVEMENT SUGGESTIONS

Create an improvement section.

Examples:

Add missing job-relevant technical skills if you genuinely possess them.

Add measurable project outcomes.

Highlight relevant internship experience.

Improve project descriptions with technologies and outcomes.

Remove irrelevant technologies for the target role.

Do not invent experience, skills, projects, certifications or achievements.

17. LLM INTEGRATION

Add an optional LLM layer.

The LLM should receive:

Extracted resume information

Extracted job description information

Matching skills

Missing skills

Match score

Ask the LLM to generate:

Resume improvement suggestions

Project-description suggestions

Skill-gap explanation

Professional summary suggestions

Important rules:

Never invent qualifications.

Never invent experience.

Never invent certifications.

Never tell users to claim skills they do not have.

Base suggestions only on provided data.

If the LLM API is unavailable, show the rule-based suggestions instead.

Use environment variables:

LLM_API_KEY=
LLM_MODEL=

Never expose API keys in the React frontend.

18. DATABASE DESIGN

Use MySQL.

Create tables:

users

id

name

email

password_hash

created_at

resumes

id

user_id

file_name

extracted_text

created_at

job_descriptions

id

user_id

title

description

created_at

resume_skills

id

resume_id

skill_name

skill_category

job_skills

id

job_id

skill_name

skill_category

importance

analyses

id

user_id

resume_id

job_id

match_score

matching_skills

missing_skills

strengths

suggestions

created_at

Use proper foreign keys and indexes.

19. API ENDPOINTS

Create clean REST APIs.

Resume

POST /api/resumes/upload

GET /api/resumes

GET /api/resumes/:id

DELETE /api/resumes/:id

Job Description

POST /api/jobs

GET /api/jobs

GET /api/jobs/:id

DELETE /api/jobs/:id

Analysis

POST /api/analyze/resume

POST /api/analyze/job

POST /api/analyze/match

GET /api/analyses

GET /api/analyses/:id

Report

GET /api/reports/:analysisId

20. ERROR HANDLING

Implement proper error handling.

Handle:

Invalid file type

Empty resume

Empty job description

Failed text extraction

Python service unavailable

Database connection error

LLM API failure

Invalid API request

File too large

Display user-friendly messages.

Do not display raw server errors to users.

21. SECURITY

Implement basic security practices:

Validate uploaded file types

Limit upload size

Sanitize input

Use parameterized SQL queries

Store passwords securely if authentication is implemented

Keep secrets in environment variables

Never expose API keys to frontend

Add CORS configuration

Do not execute uploaded files

22. DASHBOARD

Create a dashboard showing:

Total resumes analyzed

Total job descriptions

Average match score

Latest analysis

Recent analyses

Show recent analysis cards:

Job Title
Match Score
Date
View Analysis button

Add a simple chart showing match scores over recent analyses.

23. ANALYSIS HISTORY

Create an Analysis History page.

Each record should show:

Resume name

Job title

Match score

Date

View button

Delete button

Allow users to open previous analysis results.

24. REPORT EXPORT

Create a clean report view.

Include:

AI Resume Analyzer & Job Matcher

Candidate:
Resume:
Target Job:

Match Score

Matching Skills

Missing Skills

Resume Strengths

Improvement Suggestions

Allow export/download as PDF if practical.

If PDF generation becomes too complex, first implement a print-friendly report page that the user can save as PDF through the browser.

25. ABOUT PAGE

Explain:

What the project does

A full-stack AI-assisted resume analysis and job matching platform that combines NLP-based text processing, skill extraction, transparent matching logic and optional LLM-generated suggestions.

Technology Stack

React.js
Node.js
Python
NLP
LLM
MySQL

Main Modules

Resume Parsing
Skill Extraction
Job Description Analysis
Resume Matching
Skill Gap Analysis
AI Suggestions

26. PROJECT CODE STRUCTURE

Use a clean structure similar to:

frontend/
src/
components/
pages/
services/
hooks/
utils/
App.jsx
main.jsx

backend/
src/
controllers/
routes/
services/
middleware/
db/
utils/
app.js
server.js

python-service/
app.py
requirements.txt
services/
resume_parser.py
skill_extractor.py
job_parser.py
matcher.py
text_processor.py
llm_helper.py

database/
schema.sql
seed.sql

README.md

27. SAMPLE DATA

Create seed/sample data for development.

Sample job:

Data Analyst Intern

Required:
Python
SQL
Excel
Power BI
Pandas

Preferred:
Machine Learning
Git

Create a sample resume text for testing.

The application must work with this sample data.

28. USER EXPERIENCE

The main workflow should be:

HOME
↓
UPLOAD RESUME
↓
RESUME ANALYSIS
↓
ADD JOB DESCRIPTION
↓
MATCH RESUME
↓
MATCH SCORE
↓
MATCHING SKILLS
↓
MISSING SKILLS
↓
STRENGTHS
↓
IMPROVEMENT SUGGESTIONS
↓
EXPORT REPORT

Make this workflow obvious to the user.

29. IMPORTANT DEVELOPMENT RULES

Do NOT:

Create fake analysis results.

Hard-code a 90% match score.

Use fake AI responses.

Use placeholder dashboard numbers after the application is connected.

Claim that an LLM performed an analysis if the API failed.

Invent resume skills.

Invent job requirements.

Build only frontend mockups.

Do:

Implement real API calls.

Implement actual resume text extraction.

Implement actual skill extraction.

Implement actual matching logic.

Store analysis results in MySQL.

Make the application usable with real uploaded resumes.

Provide clear loading states.

Provide clear error messages.

Keep code modular and readable.

30. README REQUIREMENTS

Create a detailed README.md containing:

Project Overview

Features

Technology Stack

System Architecture

Folder Structure

Installation

Environment Variables

Example:

DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
PYTHON_SERVICE_URL=
LLM_API_KEY=
LLM_MODEL=

Database Setup

Explain how to create the MySQL database and execute schema.sql.

Backend Setup

Explain Node.js installation and commands.

Python Service Setup

Explain Python environment and requirements installation.

Frontend Setup

Explain React installation and commands.

Running the Application

Provide commands for:

Frontend
Backend
Python service

API Documentation

Document the main endpoints.

Future Improvements

Examples:

Better semantic skill matching

More advanced NLP

Resume section scoring

Multi-language support

More LLM providers

Job recommendation system

31. DEVELOPMENT PRIORITY

Build in this order:

PHASE 1:
Set up React frontend + Node.js backend + MySQL.

PHASE 2:
Implement PDF/DOCX upload and text extraction.

PHASE 3:
Implement Python NLP service.

PHASE 4:
Implement skill extraction.

PHASE 5:
Implement job description processing.

PHASE 6:
Implement resume-job matching algorithm.

PHASE 7:
Build analysis dashboard.

PHASE 8:
Add MySQL persistence.

PHASE 9:
Add optional LLM suggestions.

PHASE 10:
Add analysis history and report export.

PHASE 11:
Test the complete application using real sample resumes and job descriptions.

PHASE 12:
Clean UI, fix errors, improve README and prepare the project for demonstration.

32. FINAL QUALITY REQUIREMENT

The final application should look and behave like a genuine student-built full-stack AI/NLP project, not a generic template.

Prioritize:

Working functionality

Explainable matching logic

Clean architecture

Good UI

Real database integration

Real NLP processing

Optional LLM assistance

Easy local setup

Do not over-engineer the project.

The final application must be possible to run locally using:

React.js frontend

Node.js/Express backend

Python NLP service

MySQL database

After implementation, provide:

Complete folder structure

Setup instructions

Required environment variables

Database schema

API endpoint list

How to run frontend

How to run backend

How to run Python service

Testing instructions

Explanation of the resume-to-job matching algorithm

Explanation of the NLP pipeline

Explanation of the LLM integration
# 33. PROJECT BRANDING, NAMING & AI-GENERATED CONTENT RESTRICTIONS

The final application must look like a professionally developed independent software project.

IMPORTANT:

Do NOT display or mention the development platform or AI generation tool anywhere in the application.

The final application must NOT contain:

- “Lovable”

- “Lovable AI”

- “Built with Lovable”

- “Generated by Lovable”

- “Created with Lovable”

- “AI Generated”

- “Generated by AI”

- Lovable logos, badges, watermarks, credits or branding

- Any reference to the development platform in the UI

Do not add any footer, badge, banner, comment or visible text indicating that the application was created using an AI tool or website builder.

## PROJECT NAME

Use the professional project name:

“AI Resume Analyzer & Job Matcher”

Use this name consistently throughout the application.

Do not append platform names to the project name.

For example, do NOT use:

- AI Resume Analyzer Lovable

- Lovable Resume Analyzer

- Lovable AI Resume Matcher

Use only:

- AI Resume Analyzer & Job Matcher

## FOLDER AND FILE NAMING

Use clean, professional and technology-based names.

Use names such as:

frontend/

backend/

python-service/

database/

README.md

Do NOT create names containing:

- lovable

- lovable-ai

- ai-generated

- generated-by-lovable

- lovable-project

All source files, folders, variables, components and modules should use professional project-specific naming.

## CODE COMMENTS

Do not insert comments such as:

“Generated by Lovable”

“Created by Lovable”

“AI generated code”

“Lovable component”

“Lovable implementation”

Code comments, if required, should describe the actual functionality of the code.

## UI CONTENT

All visible UI text must be written as normal professional product content.

Do not include developer-tool references in:

- Headers

- Footers

- About page

- Login page

- Dashboard

- Error messages

- Loading messages

- Metadata

- Page titles

- Browser titles

## METADATA

Set professional metadata:

Title:

AI Resume Analyzer & Job Matcher

Description:

An AI-assisted resume analysis and job matching platform for extracting skills, identifying skill gaps, and comparing resumes with job descriptions.

Do not mention Lovable or any AI website builder in metadata.

## README

The README should describe the project as:

“AI Resume Analyzer & Job Matcher is a full-stack application that combines Python-based text processing, skill extraction, transparent resume-job matching, MySQL persistence, and optional LLM-assisted recommendations.”

Do not mention Lovable, AI-generated development, or the development platform anywhere in the README.

## FINAL CHECK

Before considering the project complete, scan the entire project for any occurrence of:

“Lovable”

“Lovable AI”

“Built with Lovable”

“Generated by Lovable”

“AI Generated”

Remove all such references from the application, source code comments, folder names, file names, README, metadata and UI.

The final project should appear as an independently developed professional software project.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://resumetra-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8f331b65-47e3-40c6-9ccb-a7dcf9100a07).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
