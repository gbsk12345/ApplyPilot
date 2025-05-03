
"""
ats_scorer_final.py

A unified ATS (Applicant Tracking System) scorer that:
1. Extracts skills from a resume using a tech skill list.
2. Scrapes job description from a job URL (RemoteOK-compatible).
3. Extracts relevant skills from the job.
4. Computes both skill match % and cosine similarity score.
"""

import re
import string
import requests
from bs4 import BeautifulSoup
from pdfminer.high_level import extract_text
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# -----------------------------
# Utility Functions
# -----------------------------


def load_skills_from_file(file_path):
    skills = set()
    with open(file_path, 'r') as file:
        for line in file:
            skill = line.strip().lower()
            skill = re.sub(r'\(.*', '', skill).strip()
            if skill:
                skills.add(skill)
    return skills


def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9.,\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def parse_skills(text, tech_skills):
    cleaned = clean_text(text)
    return {skill for skill in tech_skills if skill in cleaned}

# -----------------------------
# Resume Parsing
# -----------------------------


def extract_resume_text(pdf_path):
    return extract_text(pdf_path)

# -----------------------------
# Job Scraping
# -----------------------------


def scrape_job_description(url):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    desc_div = soup.find('div', {'class': 'description'})
    if desc_div:
        return desc_div.get_text(separator=' ', strip=True)
    return ""

# -----------------------------
# Cosine Similarity
# -----------------------------


def compute_cosine_similarity(text1, text2):
    vectorizer = CountVectorizer().fit_transform([text1, text2])
    vectors = vectorizer.toarray()
    return cosine_similarity([vectors[0]], [vectors[1]])[0][0] * 100

# -----------------------------
# ATS Scoring
# -----------------------------


def ats_score(resume_pdf_path, job_url, tech_skills_path):
    # Load predefined tech skills
    tech_skills = load_skills_from_file(tech_skills_path)

    # Parse resume
    resume_text = extract_resume_text(resume_pdf_path)
    resume_skills = parse_skills(resume_text, tech_skills)
    resume_clean = clean_text(resume_text)

    # Scrape and parse job description
    job_text = scrape_job_description(job_url)
    job_skills = parse_skills(job_text, tech_skills)
    job_clean = clean_text(job_text)

    # Skill Match
    matched = resume_skills & job_skills
    missing = job_skills - resume_skills
    skill_match_percent = (len(matched) / len(job_skills)
                           ) * 100 if job_skills else 0

    # Cosine Similarity
    cosine_score = compute_cosine_similarity(resume_clean, job_clean)

    # Final ATS Score (average of both)
    final_score = round((skill_match_percent + cosine_score) / 2, 2)

    # Output
    print(f"\n✅ Final ATS Score: {final_score}%")
    print(f"🔍 Skill Match: {round(skill_match_percent, 2)}%")
    print(f"📈 Cosine Similarity: {round(cosine_score, 2)}%")
    print(f"✅ Matched Skills: {sorted(matched)}")
    print(f"⚠️ Missing Skills: {sorted(missing)}")

# -----------------------------
# Example Call (Edit these paths)
# -----------------------------


if __name__ == "__main__":
    ats_score(
        resume_pdf_path="JobResume2.pdf",                # Replace with your resume PDF
        # Replace with actual job link
        job_url="https://boards.greenhouse.io/embed/job_app?token=4447610006",
        tech_skills_path="tech_skills_list.txt"          # Path to skill list
    )
