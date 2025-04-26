import spacy
from pdfminer.high_level import extract_text
import re

nlp = spacy.load("en_core_web_sm")

TECH_SKILLS = {
    'python', 'java', 'c#', 'c++', 'sql', 'nosql', 'postgresql', 'javascript', 'typescript',
    'haskell', 'racket', 'shell', 'react', 'angular', 'vue', 'node.js', 'express', 'flask',
    '.net', 'restful apis', 'aws', 'azure', 'docker', 'git', 'pandas', 'matplotlib', 'numpy',
    'scikit-learn', 'whisperapi', 'langchain', 'css', 'webpack', 'javafx', 'jdbc',
    'algorithms', 'data structures', 'machine learning', 'agile methodologies', 'design patterns',
    'pytorch', 'twilio', 'etl', 'data analysis', 'socket programming', 'unix', 'random forest',
    'svm', 'decision trees', 'clustering', 'data mining', 'nlp', 'http', 'oracle'
}


def clean_text(text):
    # Lowercase, remove extra spaces and special characters
    text = text.lower()
    text = re.sub(r'[^a-z0-9.,\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def parse_skills(text, tech_skills):
    extracted_skills = set()
    cleaned_text = clean_text(text)

    for skill in tech_skills:
        if skill in cleaned_text:
            extracted_skills.add(skill)

    return extracted_skills


if __name__ == "__main__":
    # pdf_path = "JobResume2.pdf"
    # pdf_path = "Aditya_Resume_Ml.pdf"
    pdf_path = "Devanshu_Resumeclear.pdf"
    raw_text = extract_text(pdf_path)
    skills = parse_skills(raw_text, TECH_SKILLS)

    print("\n--- Raw Extracted Text Preview ---")
    print(raw_text[:500])   # Show first 500 chars for debugging

    print("\nExtracted Technical Skills:", skills)
