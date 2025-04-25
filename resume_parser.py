import spacy
from pdfminer.high_level import extract_text

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

# Step 1: Load Technical Skills from Dataset


def load_skills_from_file(file_path):
    with open(file_path, 'r') as f:
        skills = {line.strip().lower() for line in f if line.strip()}
    return skills

# Step 2: Extract text from PDF


def extract_resume_text(pdf_path):
    return extract_text(pdf_path)

# Step 3: Parse Resume for Skills


def parse_resume_for_skills(pdf_path, tech_skills):
    text = extract_resume_text(pdf_path)
    doc = nlp(text.lower())
    extracted_skills = set()

    for token in doc:
        if token.text in tech_skills:
            extracted_skills.add(token.text)

    return extracted_skills


if __name__ == "__main__":
    # Load dynamic skill list
    tech_skills = load_skills_from_file("tech_skills_list.txt")

    # Test with sample resume
    skills_found = parse_resume_for_skills("sample_resume.pdf", tech_skills)
    print(f"Extracted Technical Skills: {skills_found}")
