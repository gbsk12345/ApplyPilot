
import os
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

import nltk

try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords")

# Ensure required NLTK data is available


def ensure_nltk_resources():
    try:
        stopwords.words('english')
    except LookupError:
        nltk.download('stopwords')

    try:
        word_tokenize("This is a test.", preserve_line=True)
    except LookupError:
        nltk.download('punkt')


ensure_nltk_resources()


class ResumeSkillExtractor:
    def __init__(self, skill_file_path):
        self.skill_file_path = skill_file_path
        self.skill_list = self.load_skills()
        self.compiled_patterns = []
        self.single_word_skills = set()
        self.compile_skill_patterns()
        self.stop_words = set(stopwords.words('english'))

    def load_skills(self):
        with open(self.skill_file_path, "r") as f:
            return [line.strip().lower() for line in f if line.strip()]

    def compile_skill_patterns(self):
        for skill in self.skill_list:
            if any(sym in skill for sym in [' ', '.', '#', '+', '-']):
                # Match symbol-based skills without word boundaries
                self.compiled_patterns.append(
                    re.compile(re.escape(skill), re.IGNORECASE))
            else:
                # Use word-boundary for clean single-word skills
                self.compiled_patterns.append(re.compile(
                    r"\b" + re.escape(skill) + r"\b", re.IGNORECASE))
                self.single_word_skills.add(skill)

    def extract_text(self, file_path):
        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            print(f"Error: File '{file_path}' not found.")
            return ""

        _, ext = os.path.splitext(file_path.lower())
        if ext == ".pdf":
            return self.extract_text_from_pdf(file_path)
        elif ext == ".docx":
            return self.extract_text_from_docx(file_path)
        elif ext == ".txt":
            return self.extract_text_from_txt(file_path)
        else:
            print(f"Unsupported file format: {ext}")
            return ""

    def extract_text_from_pdf(self, file_path):
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            return "\n".join(page.extract_text() for page in reader.pages if page.extract_text())
        except ImportError:
            print("PyPDF2 not installed. Run 'pip install PyPDF2'")
            return ""
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return ""

    def extract_text_from_docx(self, file_path):
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join(para.text for para in doc.paragraphs)
        except ImportError:
            print("python-docx not installed. Run 'pip install python-docx'")
            return ""
        except Exception as e:
            print(f"DOCX extraction error: {e}")
            return ""

    def extract_text_from_txt(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            print(f"TXT extraction error: {e}")
            return ""

    def extract_skills_from_text(self, text):
        if not text:
            return []

        text_lower = text.lower()
        found_skills = set()

        for pattern in self.compiled_patterns:
            if pattern.search(text_lower):
                found_skills.add(pattern.pattern.strip(
                    "\b").strip("\\b").strip("\\").strip("^$"))

        words = set(word_tokenize(text_lower, preserve_line=True)
                    ) - self.stop_words
        found_skills.update(
            [skill for skill in self.single_word_skills if skill in words])

        return sorted(found_skills)

    def extract_skills_from_file(self, resume_file_path):
        text = self.extract_text(resume_file_path)
        return self.extract_skills_from_text(text)

    def extract_text_and_skills(self, resume_file_path):
        text = self.extract_text(resume_file_path)
        skills = self.extract_skills_from_text(text)
        return text, skills
