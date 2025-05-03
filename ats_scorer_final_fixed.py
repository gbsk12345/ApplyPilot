
"""
ats_scorer_final_fixed.py

✔ Fixes embedded Greenhouse URLs
✔ Extracts job description from <div id="job">
✔ Prints all skills, job description snippet, and detailed match report
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
    print(f"[DEBUG] Loaded {len(skills)} tech skills from '{file_path}'")
    return skills

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9.,\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_skills(text, tech_skills):
    cleaned = clean_text(text)
    matched_skills = {skill for skill in tech_skills if skill in cleaned}
    return matched_skills

# -----------------------------
# Resume Parsing
# -----------------------------

def extract_resume_text(pdf_path):
    print(f"[DEBUG] Extracting resume text from: {pdf_path}")
    text = extract_text(pdf_path)
    print(f"[DEBUG] Resume text length: {len(text)} characters")
    return text

# -----------------------------
# Job Scraping (with Fix)
# -----------------------------

def normalize_greenhouse_url(url):
    if "embed/job_app?token=" in url:
        token = url.split("token=")[-1]
        return f"https://boards.greenhouse.io/applovin/jobs/{token}"
    return url

def scrape_job_description(url):
    fixed_url = normalize_greenhouse_url(url)
    print(f"[DEBUG] Scraping job description from: {fixed_url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(fixed_url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    job_div = soup.find("div", {"id": "job"})
    if job_div:
        text = job_div.get_text(separator=' ', strip=True)
        print(f"[DEBUG] Extracted job description length: {len(text)} characters")
        print("\n===== Job Description Snippet =====")
        print(text[:1500] + "..." if len(text) > 1500 else text)
        print("===================================\n")
        return text

    print("[WARNING] Could not find <div id='job'> in the page.")
    return ""

# -----------------------------
# Cosine Similarity
# -----------------------------

def compute_cosine_similarity(text1, text2):
    vectorizer = CountVectorizer().fit_transform([text1, text2])
    vectors = vectorizer.toarray()
    score = cosine_similarity([vectors[0]], [vectors[1]])[0][0] * 100
    return score

# -----------------------------
# ATS Scoring
# -----------------------------

def ats_score(resume_pdf_path, job_url, tech_skills_path):
    tech_skills = load_skills_from_file(tech_skills_path)

    resume_text = extract_resume_text(resume_pdf_path)
    resume_clean = clean_text(resume_text)
    resume_skills = parse_skills(resume_text, tech_skills)
    print(f"[DEBUG] Skills extracted from resume ({len(resume_skills)}): {sorted(resume_skills)}")

    job_text = scrape_job_description(job_url)
    job_clean = clean_text(job_text)
    job_skills = parse_skills(job_text, tech_skills)
    print(f"[DEBUG] Skills extracted from job description ({len(job_skills)}): {sorted(job_skills)}")

    matched = resume_skills & job_skills
    missing = job_skills - resume_skills
    skill_match_percent = (len(matched) / len(job_skills)) * 100 if job_skills else 0

    cosine_score = compute_cosine_similarity(resume_clean, job_clean)
    final_score = round((skill_match_percent + cosine_score) / 2, 2)

    print("\n======================= ATS SCORE REPORT =======================")
    print(f"✅ Final ATS Score: {final_score}%")
    print(f"🔍 Skill Match: {round(skill_match_percent, 2)}%")
    print(f"📈 Cosine Similarity: {round(cosine_score, 2)}%")
    print(f"✅ Matched Skills ({len(matched)}): {sorted(matched)}")
    print(f"⚠️ Missing Skills ({len(missing)}): {sorted(missing)}")
    print("===============================================================\n")

# -----------------------------
# Example Call
# -----------------------------

if __name__ == "__main__":
    ats_score(
        resume_pdf_path="JobResume2.pdf",
        job_url="https://boards.greenhouse.io/embed/job_app?token=4447610006",
        tech_skills_path="tech_skills_list.txt"
    )
