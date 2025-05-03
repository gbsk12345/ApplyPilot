# ats_scorer_with_url.py

"""
This script computes an ATS (Applicant Tracking System) score by:
1. Parsing your resume file (PDF, DOCX, or TXT).
2. Scraping a job listing from a given URL.
3. Extracting skills/keywords from both sources.
4. Calculating match %, similarity, and overall score.
"""

import re
import string
import PyPDF2
import docx
import requests
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ------------------------------
# Resume Parsing Functions
# ------------------------------


def extract_text_from_pdf(pdf_path):
    """Extracts text from a PDF file."""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        return ' '.join([page.extract_text() for page in reader.pages if page.extract_text()])


def extract_text_from_docx(docx_path):
    """Extracts text from a DOCX file."""
    doc = docx.Document(docx_path)
    return ' '.join([para.text for para in doc.paragraphs])


def clean_text(text):
    """Lowercase, remove punctuation and normalize whitespace."""
    text = text.lower()
    text = re.sub(r'\n', ' ', text)
    text = re.sub(f"[{string.punctuation}]", '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def extract_keywords(text):
    """Extracts words of length >=3 and removes common stopwords."""
    stopwords = {'and', 'the', 'for', 'with', 'from', 'that',
                 'this', 'you', 'your', 'are', 'but', 'have', 'has'}
    words = re.findall(r'\b[a-z]{3,}\b', text)
    return [word for word in words if word not in stopwords]

# ------------------------------
# Job Description Scraper
# ------------------------------


def extract_job_description(url):
    """
    Extracts visible text and keywords from a job listing webpage.
    Customize this based on actual site structure.
    """
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise Exception("Failed to fetch job listing.")

    soup = BeautifulSoup(response.text, 'html.parser')

    # Collect all visible text
    job_text = ' '.join(tag.get_text(separator=' ')
                        for tag in soup.find_all(['p', 'li', 'span', 'div']))

    # Clean and return both full job text and extracted keywords
    cleaned_job_text = clean_text(job_text)
    job_keywords = extract_keywords(cleaned_job_text)

    return cleaned_job_text, list(set(job_keywords))

# ------------------------------
# Similarity Scoring
# ------------------------------


def compute_cosine_similarity(text1, text2):
    """Computes cosine similarity between two text blobs."""
    vectorizer = CountVectorizer().fit_transform([text1, text2])
    vectors = vectorizer.toarray()
    return cosine_similarity([vectors[0]], [vectors[1]])[0][0] * 100

# ------------------------------
# ATS Score Function
# ------------------------------


def ats_score(resume_path, job_url):
    """
    Main ATS scoring function.
    1. Parses resume
    2. Scrapes job URL
    3. Compares and scores
    """

    # Parse resume text
    if resume_path.endswith('.pdf'):
        resume_text = extract_text_from_pdf(resume_path)
    elif resume_path.endswith('.docx'):
        resume_text = extract_text_from_docx(resume_path)
    else:
        with open(resume_path, 'r') as f:
            resume_text = f.read()

    resume_clean = clean_text(resume_text)
    resume_keywords = set(extract_keywords(resume_clean))

    # Scrape job description
    job_clean, job_keywords = extract_job_description(job_url)
    job_keywords_set = set(job_keywords)

    # Compare keywords
    matched = resume_keywords & job_keywords_set
    missing = job_keywords_set - resume_keywords

    keyword_match = (len(matched) / len(job_keywords_set)) * \
        100 if job_keywords_set else 0
    cosine_sim = compute_cosine_similarity(resume_clean, job_clean)
    final_score = round((keyword_match + cosine_sim) / 2, 2)

    # Output result
    print(f"\n✅ Final ATS Score: {final_score}%")
    print(f"🔍 Keyword Match: {round(keyword_match, 2)}%")
    print(f"📈 Text Similarity: {round(cosine_sim, 2)}%")
    print(f"✅ Matched Keywords: {sorted(matched)}")
    print(f"⚠️ Missing Keywords: {sorted(missing)}")


# ------------------------------
# Example Usage
# ------------------------------
if __name__ == "__main__":
    resume_file = "JobResume2.pdf"   # Change to your file name
    # Paste job listing URL here
    job_url = "https://boards.greenhouse.io/embed/job_app?token=4447610006"

    ats_score(resume_file, job_url)
