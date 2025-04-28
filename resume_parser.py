import spacy
from pdfminer.high_level import extract_text
import re

# Load spaCy NLP model
nlp = spacy.load("en_core_web_sm")

# Function to load skills from text_skills.txt


def load_skills_from_file(file_path):
    skills = set()
    with open(file_path, 'r') as file:
        for line in file:
            skill = line.strip().lower()
            # Remove anything after '(' to handle cases like "PaaS (e.g."
            skill = re.sub(r'\(.*', '', skill).strip()
            if skill:
                skills.add(skill)
    return skills

# Clean resume text


def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9.,\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text

# Parse skills dynamically


def parse_skills(text, tech_skills):
    extracted_skills = set()
    cleaned_text = clean_text(text)

    for skill in tech_skills:
        if skill and skill in cleaned_text:
            extracted_skills.add(skill)

    return extracted_skills


if __name__ == "__main__":
    # 1. Load dynamic skills
    tech_skills = load_skills_from_file("tech_skills_list.txt")

    # 2. Extract text from resume PDF
    pdf_path = "JobResume2.pdf"
    raw_text = extract_text(pdf_path)

    # 3. Parse for skills
    skills_found = parse_skills(raw_text, tech_skills)

    print(f"\nExtracted Technical Skills: {skills_found}")
